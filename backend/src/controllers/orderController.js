import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { Payment } from '../models/Payment.js';
import { emailService } from '../utils/emailService.js';

// Helper to generate unique order number (e.g. AUR-202610-8291)
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AUR-${dateStr}-${randomSuffix}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod = 'card_online',
      couponCode,
    } = req.body;

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

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
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'PAID', // In simulated card checkout, marked PAID
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingAmount,
      taxAmount,
      totalAmount,
      orderStatus: 'CONFIRMED',
      statusHistory: [
        {
          status: 'PENDING',
          note: 'Order initiated',
        },
        {
          status: 'CONFIRMED',
          note: 'Payment verified and order confirmed',
        },
      ],
      isPaid: paymentMethod !== 'cod',
      paidAt: paymentMethod !== 'cod' ? new Date() : null,
    });

    // 7. Create Payment record for transaction audit
    await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: totalAmount,
      currency: 'USD',
      provider: paymentMethod === 'cod' ? 'cod' : 'mock_gateway',
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'SUCCESS',
      gatewayResponse: { paymentMethod, verified: true },
    });

    // 8. Clear user cart
    cart.items = [];
    await cart.save();

    // 9. Send order confirmation email
    emailService.sendOrderConfirmationEmail(order, req.user).catch((err) =>
      console.error('Order email error:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
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

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
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
    }

    if (status === 'REFUNDED') {
      order.paymentStatus = 'REFUNDED';
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
