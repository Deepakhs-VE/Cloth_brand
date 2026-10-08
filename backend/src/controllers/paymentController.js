import Stripe from 'stripe';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { emailService } from '../utils/emailService.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe is not configured on the server');
    error.statusCode = 503;
    throw error;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5174').replace(/\/$/, '');

const getPaymentIntentId = (session) =>
  typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || '';

const fulfillStripeOrder = async (session) => {
  if (session.payment_status !== 'paid') return null;

  const orderId = session.metadata?.orderId;
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;

  const paymentIntentId = getPaymentIntentId(session);

  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      $set: {
        user: order.user,
        amount: order.totalAmount,
        currency: (session.currency || 'usd').toUpperCase(),
        provider: 'stripe',
        transactionId: session.id,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        paymentStatus: 'SUCCESS',
        gatewayResponse: {
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details?.email || session.customer_email || '',
          processedAt: new Date().toISOString(),
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (order.isPaid) return order;

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  order.paymentResult = {
    id: session.id,
    status: session.payment_status,
    updateTime: new Date().toISOString(),
    emailAddress: session.customer_details?.email || session.customer_email || '',
    method: 'Stripe',
    transactionId: paymentIntentId || session.id,
  };
  order.statusHistory.push({
    status: 'CONFIRMED',
    note: `Payment verified securely by Stripe (${session.id})`,
  });
  await order.save();

  await Cart.updateOne({ user: order.user }, { $set: { items: [] } });

  await order.populate('user', 'name email phone');
  emailService.sendOrderConfirmationEmail(order, order.user).catch((error) =>
    console.error('Order email error:', error)
  );

  return order;
};

const expireUnpaidOrder = async (session) => {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, isPaid: false, orderStatus: 'PENDING' },
    {
      $set: {
        orderStatus: 'CANCELLED',
        paymentStatus: 'FAILED',
        cancelledAt: new Date(),
        cancellationReason: 'Stripe Checkout session expired',
      },
      $push: {
        statusHistory: {
          status: 'CANCELLED',
          note: 'Stripe Checkout session expired before payment',
        },
      },
    },
    { new: true }
  );

  if (!order) return;

  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    )
  );

  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon) {
      coupon.usageCount = Math.max(0, coupon.usageCount - 1);
      const userUsage = coupon.usedBy.find(
        (entry) => entry.user.toString() === order.user.toString()
      );
      if (userUsage) userUsage.count = Math.max(0, userUsage.count - 1);
      await coupon.save();
    }
  }

  await Payment.findOneAndUpdate(
    { order: order._id },
    { $set: { paymentStatus: 'CANCELLED' } }
  );
};

const restoreCouponUsage = async (order) => {
  if (!order.couponCode) return;
  const coupon = await Coupon.findOne({ code: order.couponCode });
  if (!coupon) return;

  coupon.usageCount = Math.max(0, coupon.usageCount - 1);
  const userUsage = coupon.usedBy.find(
    (entry) => entry.user.toString() === order.user.toString()
  );
  if (userUsage) userUsage.count = Math.max(0, userUsage.count - 1);
  await coupon.save();
};

const finalizeSuccessfulRefund = async (payment, stripeRefund) => {
  payment.paymentStatus = 'REFUNDED';
  payment.refundInfo = {
    refundId: stripeRefund.id,
    amount: stripeRefund.amount / 100,
    reason: payment.refundInfo?.reason || 'Customer refund',
    status: stripeRefund.status,
    refundedAt: new Date(),
  };
  await payment.save();

  // The conditional update is the exactly-once guard for stock and coupon
  // restoration when both the API response and Stripe webhook arrive together.
  const currentOrder = await Order.findById(payment.order).select('orderStatus refundRequest');
  const completedRequest = currentOrder?.refundRequest
    ? {
        ...currentOrder.refundRequest.toObject(),
        status: 'COMPLETED',
        completedAt: new Date(),
      }
    : {
        type: currentOrder?.orderStatus === 'DELIVERED' ? 'RETURN' : 'CANCELLATION',
        status: 'COMPLETED',
        reason: 'Refund completed directly through Stripe',
        requestedAt: new Date(),
        reviewedAt: new Date(),
        completedAt: new Date(),
      };

  const order = await Order.findOneAndUpdate(
    { _id: payment.order, paymentStatus: { $ne: 'REFUNDED' } },
    {
      $set: {
        paymentStatus: 'REFUNDED',
        orderStatus: 'REFUNDED',
        refundRequest: completedRequest,
      },
      $push: {
        statusHistory: {
          status: 'REFUNDED',
          note: `Stripe refund ${stripeRefund.id} completed`,
          updatedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (order) {
    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      )
    );
    await restoreCouponUsage(order);
    await order.populate('user', 'name email');
    emailService.sendRefundUpdateEmail(order, order.user).catch((error) =>
      console.error('Refund completion email error:', error)
    );
  }

  return order || Order.findById(payment.order);
};

const markRefundPending = async (payment, order, stripeRefund, reason) => {
  payment.paymentStatus = 'REFUND_PENDING';
  payment.refundInfo = {
    refundId: stripeRefund.id,
    amount: stripeRefund.amount / 100,
    reason,
    status: stripeRefund.status,
    refundedAt: null,
  };
  await payment.save();

  order.paymentStatus = 'REFUND_PENDING';
  order.refundRequest.status = 'REFUND_PENDING';
  order.statusHistory.push({
    status: order.orderStatus,
    note: `Stripe refund ${stripeRefund.id} is ${stripeRefund.status}`,
  });
  await order.save();
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      return res.status(400).json({ success: false, message: 'This order is already paid' });
    }

    if (order.orderStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This order can no longer be paid' });
    }

    const stripe = getStripe();
    const clientUrl = getClientUrl();
    const itemCount = order.orderItems.reduce((count, item) => count + item.quantity, 0);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      client_reference_id: order._id.toString(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AURA order ${order.orderNumber}`,
              description: `${itemCount} item${itemCount === 1 ? '' : 's'}, including shipping and tax`,
            },
            unit_amount: Math.round(order.totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        orderNumber: order.orderNumber,
      },
      success_url: `${clientUrl}/order-success/${order._id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout?payment=cancelled&orderId=${order._id}`,
    });

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          user: req.user._id,
          amount: order.totalAmount,
          currency: 'USD',
          provider: 'stripe',
          transactionId: session.id,
          stripeSessionId: session.id,
          paymentStatus: 'PENDING',
          gatewayResponse: { checkoutUrlCreatedAt: new Date().toISOString() },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const confirmStripePayment = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.metadata?.userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this payment' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(402).json({
        success: false,
        message: 'Stripe has not confirmed this payment',
        paymentStatus: session.payment_status,
      });
    }

    const order = await fulfillStripeOrder(session);
    res.status(200).json({ success: true, message: 'Stripe payment confirmed', order });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const cancelCheckoutSession = async (req, res, next) => {
  try {
    const order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      return res.status(400).json({ success: false, message: 'A paid order cannot be cancelled here' });
    }

    const payment = await Payment.findOne({ order: order._id });
    let session = { metadata: { orderId: order._id.toString() } };

    if (payment?.stripeSessionId) {
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);

      if (session.payment_status === 'paid') {
        await fulfillStripeOrder(session);
        return res.status(409).json({
          success: false,
          message: 'Stripe already completed this payment; the order cannot be cancelled',
        });
      }

      if (session.status === 'open') {
        session = await stripe.checkout.sessions.expire(payment.stripeSessionId);
      }
    }

    await expireUnpaidOrder(session);
    const cancelledOrder = await Order.findById(order._id);

    return res.status(200).json({
      success: true,
      message: 'Stripe Checkout cancelled; no payment was taken',
      order: cancelledOrder,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const stripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe webhook is not configured' });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await fulfillStripeOrder(event.data.object);
    } else if (event.type === 'checkout.session.expired') {
      await expireUnpaidOrder(event.data.object);
    } else if (event.type === 'refund.created' || event.type === 'refund.updated') {
      const stripeRefund = event.data.object;
      const paymentIntentId = typeof stripeRefund.payment_intent === 'string'
        ? stripeRefund.payment_intent
        : stripeRefund.payment_intent?.id;
      const payment = paymentIntentId
        ? await Payment.findOne({ stripePaymentIntentId: paymentIntentId })
        : null;

      if (payment && stripeRefund.status === 'succeeded') {
        await finalizeSuccessfulRefund(payment, stripeRefund);
      } else if (payment && ['failed', 'canceled'].includes(stripeRefund.status)) {
        payment.paymentStatus = 'SUCCESS';
        payment.refundInfo = {
          ...(payment.refundInfo?.toObject?.() || payment.refundInfo || {}),
          refundId: stripeRefund.id,
          amount: stripeRefund.amount / 100,
          status: stripeRefund.status,
        };
        await payment.save();
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentStatus = 'PAID';
          if (order.refundRequest) {
            order.refundRequest.status = order.refundRequest.type === 'RETURN' ? 'RECEIVED' : 'APPROVED';
            order.refundRequest.adminNote = `Stripe refund ${stripeRefund.status}. Please review and retry.`;
          }
          await order.save();
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return res.status(500).json({ received: false });
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { paymentId, orderId, reason } = req.body;
    const payment = paymentId
      ? await Payment.findById(paymentId)
      : await Payment.findOne({ order: orderId });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.paymentStatus !== 'SUCCESS' || !payment.stripePaymentIntentId) {
      return res.status(400).json({ success: false, message: 'Only successful Stripe payments can be refunded' });
    }

    const order = await Order.findById(payment.order);
    if (!order?.refundRequest) {
      return res.status(400).json({
        success: false,
        message: 'A customer cancellation or return request is required before refunding',
      });
    }

    const requestReady =
      (order.refundRequest.type === 'CANCELLATION' && order.refundRequest.status === 'APPROVED') ||
      (order.refundRequest.type === 'RETURN' && order.refundRequest.status === 'RECEIVED');
    if (!requestReady) {
      return res.status(409).json({
        success: false,
        message: order.refundRequest.type === 'RETURN'
          ? 'Approve the return and mark the parcel as received before refunding'
          : 'Approve the cancellation request before refunding',
      });
    }

    const refundReason = reason || order.refundRequest.reason || 'Customer requested refund';
    const stripeRefund = await getStripe().refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: Math.round(payment.amount * 100),
        reason: 'requested_by_customer',
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          internalReason: refundReason.slice(0, 500),
        },
      },
      { idempotencyKey: `order-refund-${order._id}-${order.refundRequest._id}` }
    );

    payment.refundInfo = {
      refundId: stripeRefund.id,
      amount: payment.amount,
      reason: refundReason,
      status: stripeRefund.status,
    };

    let updatedOrder;
    if (stripeRefund.status === 'succeeded') {
      updatedOrder = await finalizeSuccessfulRefund(payment, stripeRefund);
    } else {
      await markRefundPending(payment, order, stripeRefund, refundReason);
      updatedOrder = order;
    }

    res.status(200).json({
      success: true,
      message: stripeRefund.status === 'succeeded'
        ? 'Stripe payment refunded in full'
        : `Stripe refund is ${stripeRefund.status}`,
      payment,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
