import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Revenue calculation from confirmed, processing, shipped, delivered orders
    const revenueStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['CANCELLED', 'REFUNDED'] },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // Order status breakdown
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['PENDING', 'CONFIRMED'] } });
    const processingOrders = await Order.countDocuments({ orderStatus: { $in: ['PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'] } });
    const completedOrders = await Order.countDocuments({ orderStatus: 'DELIVERED' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'REFUNDED'] } });

    // Low stock products (< 5 items)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select('name sku stock price images')
      .limit(10);

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 users
    const recentUsers = await User.find({ role: 'customer' })
      .select('name email createdAt isBlocked')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly sales data for charts (last 6 months)
    const salesByMonth = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['CANCELLED', 'REFUNDED'] },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
      },
      lowStockProducts,
      recentOrders,
      recentUsers,
      salesByMonth,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = false;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatusAdmin = async (req, res, next) => {
  try {
    const { isBlocked, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent blocking or demoting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own administrative status' });
    }

    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (role && ['customer', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};
