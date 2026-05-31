


// import mongoose from 'mongoose';

// const trackingSchema = new mongoose.Schema({
//   status: {
//     type: String,
//     enum: ['confirmed', 'pending', 'shipped', 'delivered'],
//     default: 'pending',
//   },
//   message: {
//     type: String,
//     required: true,
//   },
//   date: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const orderItemSchema = new mongoose.Schema(
//   {
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     qty: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     image: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     slug: {
//       type: String,
//       required: true,
//     },
//     selectedVariants: {
//       type: Map,
//       of: String,
//       default: {},
//     },
//   },
//   { _id: true }
// );

// const couponSchema = new mongoose.Schema(
//   {
//     code: {
//       type: String,
//       uppercase: true,
//       trim: true,
//     },
//     type: {
//       type: String,
//       enum: ['percent', 'fixed', 'shipping'],
//     },
//     value: {
//       type: Number,
//       default: 0,
//     },
//     discountPrice: {
//       type: Number,
//       default: 0,
//     },
//     shippingDiscount: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { _id: false }
// );

// const manualPaymentSchema = new mongoose.Schema(
//   {
//     provider: {
//       type: String,
//       enum: ['bkash', 'nagad', 'rocket'],
//     },
//     senderNumber: {
//       type: String,
//       trim: true,
//     },
//     transactionId: {
//       type: String,
//       trim: true,
//     },
//     amount: {
//       type: Number,
//       default: 0,
//     },
//     submittedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     status: {
//       type: String,
//       enum: ['submitted', 'verified', 'rejected'],
//       default: 'submitted',
//     },
//     adminNote: String,
//   },
//   { _id: false }
// );

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User',
//     },

//     orderId: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     orderItems: [orderItemSchema],

//     shippingAddress: {
//       fullName: String,
//       phone: String,
//       email: String,
//       address: {
//         type: String,
//         required: true,
//       },
//       city: {
//         type: String,
//         required: true,
//       },
//       postalCode: {
//         type: String,
//         required: true,
//       },
//       division: {
//         type: String,
//         required: true,
//       },
//     },

//     paymentMethod: {
//       method: {
//         type: String,
//         enum: ['cod', 'manual', 'online', 'stripe', 'sslcommerz'],
//         default: 'cod',
//       },
//       status: {
//         type: String,
//         enum: ['pending', 'submitted', 'paid', 'failed'],
//         default: 'pending',
//       },
//       transactionId: String,
//       paidAt: Date,
//     },

//     manualPayment: manualPaymentSchema,

//     paymentResult: {
//       id: String,
//       status: String,
//       update_time: String,
//       email_address: String,
//     },

//     coupon: couponSchema,

//     itemsPrice: {
//       type: Number,
//       required: true,
//       default: 0,
//     },

//     taxPrice: {
//       type: Number,
//       required: true,
//       default: 0,
//     },

//     shippingPrice: {
//       type: Number,
//       required: true,
//       default: 0,
//     },

//     originalShippingPrice: {
//       type: Number,
//       default: 0,
//     },

//     discountPrice: {
//       type: Number,
//       default: 0,
//     },

//     totalPrice: {
//       type: Number,
//       required: true,
//       default: 0,
//     },

//     isPaid: {
//       type: Boolean,
//       required: true,
//       default: false,
//     },

//     paidAt: Date,

//     Delivery: {
//       type: String,
//       enum: ['confirmed', 'pending', 'shipped', 'delivered'],
//       default: 'pending',
//     },

//     deliveredAt: Date,

//     tracking: [trackingSchema],
//   },
//   { timestamps: true }
// );

// const Order = mongoose.model('Order', orderSchema);

// export default Order;






















import mongoose from 'mongoose';

const trackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'shipped', 'delivered'],
    default: 'pending',
  },

  message: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: '',
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    slug: {
      type: String,
      default: '',
      trim: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    variantLabel: {
      type: String,
      trim: true,
    },

    variantSku: {
      type: String,
      trim: true,
    },

    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['percent', 'fixed', 'shipping'],
    },

    value: {
      type: Number,
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    shippingDiscount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const manualPaymentSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['manual', 'bkash', 'nagad', 'rocket'],
      default: 'manual',
    },

    senderNumber: {
      type: String,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ['submitted', 'verified', 'rejected'],
      default: 'submitted',
    },

    adminNote: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    orderItems: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phone: String,
      email: String,

      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      postalCode: {
        type: String,
        required: true,
      },

      division: {
        type: String,
        required: true,
      },
    },

    paymentMethod: {
      method: {
        type: String,
        enum: ['cod', 'manual', 'online', 'stripe', 'sslcommerz'],
        default: 'cod',
      },

      status: {
        type: String,
        enum: ['pending', 'submitted', 'paid', 'failed'],
        default: 'pending',
      },

      transactionId: String,
      paidAt: Date,
    },

    manualPayment: manualPaymentSchema,

    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },

    coupon: couponSchema,

    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    originalShippingPrice: {
      type: Number,
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    paidAt: Date,

    Delivery: {
      type: String,
      enum: ['confirmed', 'pending', 'shipped', 'delivered'],
      default: 'pending',
    },

    deliveredAt: Date,

    tracking: [trackingSchema],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;