import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { emailService } from '../utils/emailService.js';
import { normalizePhoneNumber } from '../utils/phone.js';

// Helper to generate unique order number (e.g. AUR-202610-8291)
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AUR-${dateStr}-${randomSuffix}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'stripe', couponCode } = req.body;

    if (paymentMethod !== 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'Stripe is the only supported payment method',
      });
    }

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    shippingAddress.phone = normalizePhoneNumber(shippingAddress.phone, {
      required: true,
      fieldName: 'Shipping phone',
    });

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty' });
    }

    // 2. Validate products, stock, and fetch latest database prices
    let subtotal = 0;
    const orderItems = [];
    const stockToReduce = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.product.name || 'Unknown'}" is no longer available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} units remaining.`,
        });
      }

      const currentPrice =
        product.discountPrice !== null && product.discountPrice !== undefined
          ? product.discountPrice
          : product.price;

      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        price: currentPrice,
        quantity: item.quantity,
        selectedSize: item.selectedSize || 'M',
        selectedColor: item.selectedColor || '',
        total: Math.round(itemTotal * 100) / 100,
      });

      stockToReduce.push({ product, quantity: item.quantity });
    }

    // 3. Coupon validation & discount calculation
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      });

      if (coupon) {
        const now = new Date();
        const isValidDate = now >= coupon.startDate && now <= coupon.endDate;
        const isUnderLimit = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        const userUsage = coupon.usedBy.find(
          (u) => u.user.toString() === req.user._id.toString()
        );
        const isUserEligible = !userUsage || userUsage.count < coupon.perUserLimit;

        if (isValidDate && isUnderLimit && meetsMin && isUserEligible) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          discountAmount = Math.min(discountAmount, subtotal);
          appliedCoupon = coupon;
        }
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    discountAmount = Math.round(discountAmount * 100) / 100;

    // Complimentary shipping over $150, else $15
    const shippingAmount = subtotal >= 150 ? 0 : 15.0;
    // Estimated tax (e.g. 5%)
    const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal - discountAmount + shippingAmount + taxAmount) * 100) / 100;

    // 4. Reduce stock
    for (const item of stockToReduce) {
      item.product.stock -= item.quantity;
      await item.product.save();
    }

    // 5. Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usageCount += 1;
      const userIndex = appliedCoupon.usedBy.findIndex(
        (u) => u.user.toString() === req.user._id.toString()
      );
      if (userIndex > -1) {
        appliedCoupon.usedBy[userIndex].count += 1;
      } else {
        appliedCoupon.usedBy.push({ user: req.user._id, count: 1 });
      }
      await appliedCoupon.save();
    }

    // 6. Create Order
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: 'stripe',
      paymentStatus: 'PENDING',
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingAmount,
      taxAmount,
      totalAmount,
      orderStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          note: 'Order created; awaiting secure Stripe payment',
        },
      ],
      isPaid: false,
      paidAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Order created. Continue to Stripe to complete payment.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const query = { user: req.user._id };
    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limitNum) || 1;
    const safePage = Math.min(pageNum, pages);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: safePage,
      pages,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ensure customer can only view their own order unless admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(200).json({
        success: true,
        message: 'Order is already cancelled',
        order,
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Paid Stripe orders must be refunded by an administrator before cancellation',
      });
    }

    // Cancellation business rule: Customer can only cancel if status is PENDING or CONFIRMED
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}`,
      });
    }

    order.orderStatus = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: `Cancelled by customer: ${reason || 'Customer request'}`,
    });

    await order.save();

    // Restore inventory stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode });
      if (coupon) {
        coupon.usageCount = Math.max(0, coupon.usageCount - 1);
        const userUsage = coupon.usedBy.find(
          (entry) => entry.user.toString() === req.user._id.toString()
        );
        if (userUsage) {
          userUsage.count = Math.max(0, userUsage.count - 1);
        }
        await coupon.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestRefund = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason of at least 10 characters',
      });
    }

    if (!order.isPaid || order.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order has no completed Stripe payment to refund',
      });
    }

    if (['CANCELLED', 'REFUNDED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `This order is already ${order.orderStatus.toLowerCase()}`,
      });
    }

    const activeRequestStatuses = [
      'REQUESTED',
      'APPROVED',
      'RECEIVED',
      'REFUND_PENDING',
      'COMPLETED',
    ];
    if (order.refundRequest && activeRequestStatuses.includes(order.refundRequest.status)) {
      return res.status(409).json({
        success: false,
        message: `A refund request is already ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}`,
      });
    }

    const preShipmentStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    let requestType;

    if (preShipmentStatuses.includes(order.orderStatus)) {
      requestType = 'CANCELLATION';
    } else if (order.orderStatus === 'DELIVERED') {
      const deliveredAt = order.deliveredAt || order.updatedAt;
      const returnWindowEndsAt = new Date(deliveredAt).getTime() + 30 * 24 * 60 * 60 * 1000;
      if (Date.now() > returnWindowEndsAt) {
        return res.status(400).json({
          success: false,
          message: 'The 30-day return window for this order has expired',
        });
      }
      requestType = 'RETURN';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Orders in transit cannot be cancelled. Request a return after delivery or contact support.',
      });
    }

    order.refundRequest = {
      type: requestType,
      status: 'REQUESTED',
      reason,
      requestedAt: new Date(),
    };
    order.statusHistory.push({
      status: order.orderStatus,
      note: `${requestType === 'RETURN' ? 'Return' : 'Cancellation'} and refund requested by customer`,
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: requestType === 'RETURN'
        ? 'Return request submitted for administrator review'
        : 'Cancellation and refund request submitted for administrator review',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewRefundRequestAdmin = async (req, res, next) => {
  try {
    const action = String(req.body.action || '').toUpperCase();
    const adminNote = String(req.body.adminNote || '').trim();
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.refundRequest) {
      return res.status(404).json({ success: false, message: 'No refund request exists for this order' });
    }

    if (action === 'APPROVE' || action === 'REJECT') {
      if (order.refundRequest.status !== 'REQUESTED') {
        return res.status(409).json({
          success: false,
          message: 'Only a pending refund request can be approved or rejected',
        });
      }
      if (action === 'REJECT' && adminNote.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason for rejecting this request',
        });
      }

      order.refundRequest.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      order.refundRequest.adminNote = adminNote;
      order.refundRequest.reviewedAt = new Date();
    } else if (action === 'MARK_RECEIVED') {
      if (order.refundRequest.type !== 'RETURN' || order.refundRequest.status !== 'APPROVED') {
        return res.status(409).json({
          success: false,
          message: 'Only an approved delivered-order return can be marked as received',
        });
      }
      order.refundRequest.status = 'RECEIVED';
      order.refundRequest.adminNote = adminNote || order.refundRequest.adminNote;
      order.refundRequest.receivedAt = new Date();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action must be APPROVE, REJECT, or MARK_RECEIVED',
      });
    }

    order.statusHistory.push({
      status: order.orderStatus,
      note: `Refund request ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}${adminNote ? `: ${adminNote}` : ''}`,
    });
    await order.save();

    emailService.sendRefundUpdateEmail(order, order.user).catch((error) =>
      console.error('Refund request email error:', error)
    );

    res.status(200).json({
      success: true,
      message: `Refund request ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Endpoints
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { status, note, carrier, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    if (status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Use the Stripe refund endpoint so the customer is actually refunded before the order is updated',
      });
    }

    if (status === 'CANCELLED' && order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Paid Stripe orders must be refunded, not manually cancelled',
      });
    }

    const allowedTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (
      status !== order.orderStatus &&
      !allowedTransitions[order.orderStatus]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot move from ${order.orderStatus} to ${status}`,
      });
    }

    if (
      ['REQUESTED', 'APPROVED'].includes(order.refundRequest?.status) &&
      order.refundRequest?.type === 'CANCELLATION' &&
      status !== order.orderStatus
    ) {
      return res.status(409).json({
        success: false,
        message: 'Resolve the active cancellation/refund request before continuing fulfillment',
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (carrier) order.carrier = carrier;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    if (status === 'DELIVERED') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      order.cancelledAt = new Date();
      order.cancellationReason = note || 'Cancelled by administrator';
      // Restore stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode });
        if (coupon) {
          coupon.usageCount = Math.max(0, coupon.usageCount - 1);
          const userUsage = coupon.usedBy.find(
            (entry) => entry.user.toString() === order.user._id.toString()
          );
          if (userUsage) userUsage.count = Math.max(0, userUsage.count - 1);
          await coupon.save();
        }
      }
    }

    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedAt: new Date(),
    });

    await order.save();

    // Trigger email notifications according to status
    if (status === 'SHIPPED') {
      emailService.sendShippingNotification(order, order.user).catch((err) =>
        console.error('Shipping email error:', err)
      );
    } else if (status === 'DELIVERED') {
      emailService.sendDeliveryNotification(order, order.user).catch((err) =>
        console.error('Delivery email error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};
