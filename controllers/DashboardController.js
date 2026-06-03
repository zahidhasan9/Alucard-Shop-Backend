import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import User from '../models/UserModel.js';
import Review from '../models/ReviewModel.js';
import Question from '../models/QuestionModel.js';
import ReturnRequest from '../models/ReturnRequestModel.js';
import Coupon from '../models/CouponModel.js';
import Cart from '../models/CartModel.js';

const RANGE_TO_DAYS = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  yearly: 365,
};

const safeNumber = (value) => Number(value || 0);

const getStartDate = (days) => {
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPreviousStartDate = (currentStart, days) => {
  const previous = new Date(currentStart);
  previous.setDate(previous.getDate() - days);
  return previous;
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const buildDateBuckets = (startDate, days) => {
  const buckets = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    buckets.push({
      date: formatDateKey(date),
      revenue: 0,
      orders: 0,
      customers: 0,
    });
  }

  return buckets;
};

const percentChange = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (!previousValue && !currentValue) return 0;
  if (!previousValue) return 100;

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
};

const mapOrderStatus = (rawStatuses) => {
  const defaultStatuses = {
    pending: { count: 0, revenue: 0 },
    confirmed: { count: 0, revenue: 0 },
    shipped: { count: 0, revenue: 0 },
    delivered: { count: 0, revenue: 0 },
  };

  rawStatuses.forEach((item) => {
    const key = item._id || 'pending';

    defaultStatuses[key] = {
      count: safeNumber(item.count),
      revenue: safeNumber(item.revenue),
    };
  });

  return defaultStatuses;
};

const mapSalesTrend = (rawTrend, periodStart, days) => {
  const buckets = buildDateBuckets(periodStart, days);
  const rawMap = new Map(rawTrend.map((item) => [item._id, item]));

  return buckets.map((bucket) => {
    const matched = rawMap.get(bucket.date);

    return {
      date: bucket.date,
      revenue: safeNumber(matched?.revenue),
      orders: safeNumber(matched?.orders),
    };
  });
};

const mapCustomerGrowth = (rawGrowth, periodStart, days) => {
  const buckets = buildDateBuckets(periodStart, days);
  const rawMap = new Map(rawGrowth.map((item) => [item._id, item.customers]));

  return buckets.map((bucket) => ({
    date: bucket.date,
    customers: safeNumber(rawMap.get(bucket.date)),
  }));
};

export const getDashboardStats = async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const days = RANGE_TO_DAYS[range] || 7;
    const lowStockLimit = Math.max(Number(req.query.lowStockLimit || 5), 1);

    const periodStart = getStartDate(days);
    const previousPeriodStart = getPreviousStartDate(periodStart, days);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const [
      allSalesAgg,
      currentSalesAgg,
      previousSalesAgg,
      todaySalesAgg,
      orderStatusAgg,
      salesTrendAgg,
      recentOrders,
      topSellingProducts,
      lowStockProducts,
      totalProducts,
      activeProducts,
      totalCustomers,
      newCustomers,
      totalReviews,
      reviewRatingAgg,
      latestReviews,
      unansweredQuestions,
      latestQuestions,
      pendingReturnRequests,
      recentReturnRequests,
      activeCoupons,
      couponUsageAgg,
      abandonedCarts,
      customerGrowthAgg,
      paymentMethodAgg,
    ] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            itemsPrice: { $sum: '$itemsPrice' },
            discount: { $sum: '$discountPrice' },
            shipping: { $sum: '$shippingPrice' },
            tax: { $sum: '$taxPrice' },
            orders: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: previousPeriodStart, $lt: periodStart } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lt: tomorrowStart } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: '$Delivery',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('user', 'firstName lastName email phone')
        .lean(),

      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            name: { $first: '$orderItems.name' },
            image: { $first: '$orderItems.image' },
            slug: { $first: '$orderItems.slug' },
            soldQty: { $sum: '$orderItems.qty' },
            revenue: {
              $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] },
            },
          },
        },
        { $sort: { soldQty: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: { $ifNull: ['$product.name', '$name'] },
            image: { $ifNull: ['$product.thumbnail', '$image'] },
            slug: { $ifNull: ['$product.slug', '$slug'] },
            price: { $ifNull: ['$product.price', 0] },
            stock: { $ifNull: ['$product.countInStock', 0] },
            soldQty: 1,
            revenue: 1,
          },
        },
      ]),

      Product.find({ isActive: true, countInStock: { $lte: lowStockLimit } })
        .select('name slug thumbnail price countInStock sold sku')
        .sort({ countInStock: 1, updatedAt: -1 })
        .limit(10)
        .lean(),

      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),

      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: periodStart } }),

      Review.countDocuments({}),

      Review.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),

      Review.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .populate('product', 'name slug thumbnail')
        .lean(),

      Question.countDocuments({
        answers: { $not: { $elemMatch: { isAdminAnswer: true } } },
      }),

      Question.find({
        answers: { $not: { $elemMatch: { isAdminAnswer: true } } },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .populate('product', 'name slug thumbnail')
        .lean(),

      ReturnRequest.countDocuments({ status: 'pending' }),

      ReturnRequest.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .populate('order', 'orderId totalPrice Delivery')
        .lean(),

      Coupon.countDocuments({ isActive: true }),

      Coupon.aggregate([
        {
          $group: {
            _id: null,
            totalUsed: { $sum: '$usedCount' },
            activeCoupons: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0],
              },
            },
          },
        },
      ]),

      Cart.countDocuments({ 'items.0': { $exists: true } }),

      User.aggregate([
        { $match: { role: 'user', createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            customers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: '$paymentMethod.method',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),
    ]);

    const allSales = allSalesAgg[0] || {};
    const currentSales = currentSalesAgg[0] || {};
    const previousSales = previousSalesAgg[0] || {};
    const todaySales = todaySalesAgg[0] || {};
    const reviewSummary = reviewRatingAgg[0] || {};
    const couponSummary = couponUsageAgg[0] || {};

    const orderStatus = mapOrderStatus(orderStatusAgg);
    const salesTrend = mapSalesTrend(salesTrendAgg, periodStart, days);
    const customerGrowth = mapCustomerGrowth(customerGrowthAgg, periodStart, days);

    return res.status(200).json({
      success: true,
      data: {
        range,
        summary: {
          totalSales: safeNumber(allSales.revenue),
          totalRevenue: safeNumber(allSales.revenue),
          totalOrders: safeNumber(allSales.orders),

          todaySales: safeNumber(todaySales.revenue),
          todayOrders: safeNumber(todaySales.orders),

          periodSales: safeNumber(currentSales.revenue),
          periodOrders: safeNumber(currentSales.orders),

          revenueGrowth: percentChange(currentSales.revenue, previousSales.revenue),
          orderGrowth: percentChange(currentSales.orders, previousSales.orders),

          pendingOrders: orderStatus.pending.count,
          confirmedOrders: orderStatus.confirmed.count,
          shippedOrders: orderStatus.shipped.count,
          deliveredOrders: orderStatus.delivered.count,

          totalCustomers,
          newCustomers,

          totalProducts,
          activeProducts,
          lowStockProducts: lowStockProducts.length,
          outOfStockProducts: lowStockProducts.filter(
            (product) => Number(product.countInStock || 0) === 0
          ).length,

          totalReviews,
          averageRating: Number((reviewSummary.averageRating || 0).toFixed(2)),

          unansweredQuestions,
          pendingReturnRequests,

          activeCoupons,
          couponUsedCount: safeNumber(couponSummary.totalUsed),
          abandonedCarts,

          grossSales: safeNumber(allSales.itemsPrice),
          totalDiscount: safeNumber(allSales.discount),
          totalShipping: safeNumber(allSales.shipping),
          totalTax: safeNumber(allSales.tax),
        },

        charts: {
          salesTrend,
          customerGrowth,
          orderStatus,
          paymentMethods: paymentMethodAgg.map((item) => ({
            method: item._id || 'unknown',
            count: safeNumber(item.count),
            revenue: safeNumber(item.revenue),
          })),
        },

        recentOrders,
        topSellingProducts,
        lowStockProducts,
        latestReviews,
        latestQuestions,
        recentReturnRequests,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Dashboard stats fetch failed',
    });
  }
};