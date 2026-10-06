import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';

export const processPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      const existingPayment = await Payment.findOne({ order: order._id });
      return res.status(200).json({
        success: true,
        message: 'Order is already verified and paid',
        payment: existingPayment,
        order,
      });
    }

    // Server-side payment processing / verification
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: order.totalAmount,
      currency: 'USD',
      provider: paymentMethod || 'mock_gateway',
      transactionId,
      paymentStatus: 'SUCCESS',
      gatewayResponse: {
        method: paymentMethod,
        cardLast4: paymentDetails?.cardNumber ? paymentDetails.cardNumber.slice(-4) : '4242',
        processedAt: new Date().toISOString(),
      },
    });

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = 'PAID';
    order.paymentResult = {
      id: payment._id.toString(),
      status: 'SUCCESS',
      updateTime: new Date().toISOString(),
      method: paymentMethod || 'Card',
      transactionId,
    };

    if (order.orderStatus === 'PENDING') {
      order.orderStatus = 'CONFIRMED';
      order.statusHistory.push({
        status: 'CONFIRMED',
        note: `Payment verified via ${paymentMethod || 'gateway'}. Transaction #${transactionId}`,
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and processed successfully',
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const order = await Order.findById(payment.order);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found' });
    }

    payment.paymentStatus = 'REFUNDED';
    payment.refundInfo = {
      refundId: `REF-${Date.now()}`,
      amount: amount || payment.amount,
      reason: reason || 'Customer refund granted',
      refundedAt: new Date(),
    };
    await payment.save();

    order.orderStatus = 'REFUNDED';
    order.paymentStatus = 'REFUNDED';
    order.statusHistory.push({
      status: 'REFUNDED',
      note: `Refund of $${amount || payment.amount} issued. Reason: ${reason || 'N/A'}`,
    });
    await order.save();

    // Optionally restore stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment refund processed and stock restored',
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};
