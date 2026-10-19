import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { convertCurrency } from '../utils/exchangeRateService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const paidOrderFilter = {
      isPaid: true,
      paymentStatus: 'PAID',
      orderStatus: { $nin: ['CANCELLED', 'REFUNDED'] },
    };

    // Run independent dashboard queries together to avoid a slow waterfall on first load.
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      settings,
      revenueStats,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      lowStockCatalog,
      recentOrders,
      recentUsers,
      monthlySalesDescending,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      SiteSettings.findOne(),
      Order.aggregate([
        { $match: paidOrderFilter },
        { $group: { _id: { $ifNull: ['$currency', 'EUR'] }, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ orderStatus: { $in: ['PENDING', 'CONFIRMED'] } }),
      Order.countDocuments({ orderStatus: { $in: ['PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'] } }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'REFUNDED'] } }),
      Product.find({
        isActive: true,
        $or: [
          { variants: { $elemMatch: { isActive: true, stock: { $lte: 5 } } } },
          { 'variants.0': { $exists: false }, stock: { $lte: 5 } },
        ],
      })
        .select('name sku stock price images variants')
        .sort({ stock: 1, name: 1 })
        .limit(30)
        .lean(),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.find({ role: 'customer' })
        .select('name email createdAt isBlocked')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([
      {
        $match: paidOrderFilter,
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            currency: { $ifNull: ['$currency', 'EUR'] },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': -1 } },
      { $limit: 24 },
      ]),
    ]);

    const reportingCurrency = String(settings?.commerce?.currencyCode || 'EUR').toUpperCase();
    const reportSettings = settings || await SiteSettings.create({});
    const totalRevenue = (await Promise.all(revenueStats.map((entry) => convertCurrency(
      entry.totalRevenue,
      entry._id,
      reportingCurrency,
      reportSettings
    )))).reduce((sum, value) => sum + value, 0);
    const monthlyTotals = new Map();
    for (const entry of monthlySalesDescending) {
      const month = entry._id.month;
      const convertedRevenue = await convertCurrency(entry.revenue, entry._id.currency, reportingCurrency, reportSettings);
      const existing = monthlyTotals.get(month) || { _id: month, revenue: 0, count: 0 };
      existing.revenue += convertedRevenue;
      existing.count += entry.count;
      monthlyTotals.set(month, existing);
    }
    const salesByMonth = [...monthlyTotals.values()].sort((a, b) => a._id.localeCompare(b._id));
    const lowStockProducts = lowStockCatalog
      .flatMap((product) => product.variants?.length
        ? product.variants
            .filter((variant) => variant.isActive && variant.stock <= 5)
            .map((variant) => ({
              _id: `${product._id}-${variant._id}`,
              productId: product._id,
              name: product.name,
              sku: variant.sku,
              stock: variant.stock,
              size: variant.size,
              color: variant.color,
              image: variant.images?.[0] || product.images?.[0] || '',
              isVariant: true,
            }))
        : [{
            _id: product._id,
            productId: product._id,
            name: product.name,
            sku: product.sku,
            stock: product.stock,
            image: product.images?.[0] || '',
            isVariant: false,
          }])
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 15);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency: reportingCurrency,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
      },
      lowStockProducts,
      recentOrders,
      recentUsers,
      salesByMonth,
      currency: reportingCurrency,
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
