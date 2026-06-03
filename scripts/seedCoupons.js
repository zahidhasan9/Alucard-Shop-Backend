import 'dotenv/config';

import { connectDB } from '../config/db.js';
import Coupon from '../models/CouponModel.js';

const seedCoupons = async () => {
  try {
    await connectDB();

    const coupons = [
      {
        code: 'SAVE10',
        type: 'percent',
        value: 10,
        minOrder: 500,
        maxDiscount: 300,
        usageLimit: 1000,
        perUserLimit: 3,
        isActive: true,
      },
      {
        code: 'NEWUSER',
        type: 'fixed',
        value: 100,
        minOrder: 700,
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'FREESHIP',
        type: 'shipping',
        value: 0,
        minOrder: 1000,
        usageLimit: 1000,
        perUserLimit: 3,
        isActive: true,
      },
    ];

    for (const coupon of coupons) {
      await Coupon.findOneAndUpdate(
        { code: coupon.code },
        coupon,
        { upsert: true, new: true }
      );
    }

    console.log('Coupons seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Coupon seed failed:', error);
    process.exit(1);
  }
};

seedCoupons();