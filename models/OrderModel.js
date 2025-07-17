import mongoose from 'mongoose';

// Tracking sub-schema
const trackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'shipped', 'delivered'],
    default: 'pending',
    // required: true,
  },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

// Define the schema for orders
const orderSchema = new mongoose.Schema(
  {
    // Reference to the user who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderId: { type: String, required: true, unique: true },
    // Array of order items, each containing product details
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        slug: { type: String, required: true },
        // product: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   required: true,
        //   ref: 'Product',
        // },
      },
    ],
    // Shipping address details
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      division: { type: String, required: true },
    },
    // Payment method used for the order
    paymentMethod: {
      method: String, // cod / stripe / sslcommerz etc
      status: String,
      paidAt: Date,
    },
    // Details of the payment result
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    // Prices and totals
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    // Payment and delivery status
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    // isDelivered: { type: Boolean, required: true, default: false },
    Delivery: {
      type: String,
      enum: ['confirmed', 'pending', 'shipped'],
      default: 'pending',
    },
    deliveredAt: { type: Date },
    tracking: [trackingSchema],
  },
  {
    // Include timestamps for createdAt and updatedAt
    timestamps: true,
  }
);

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

export default Order;

// import mongoose from 'mongoose';

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User',
//     },
//     orderId: { type: String, required: true, unique: true },

//     orderItems: [
//       {
//         name: { type: String, required: true },
//         qty: { type: Number, required: true },
//         image: { type: String, required: true },
//         price: { type: Number, required: true },
//         slug: { type: String, required: true },
//       },
//     ],

//     shippingAddress: {
//       address: { type: String, required: true },
//       city: { type: String, required: true },
//       postalCode: { type: String, required: true },
//       division: { type: String, required: true },
//     },

//     paymentMethod: {
//       method: {
//         type: String,
//         enum: ['cod', 'stripe', 'sslcommerz'],
//         default: 'cod',
//       },
//       status: {
//         type: String,
//         enum: ['pending', 'paid', 'failed'],
//         default: 'pending',
//       },
//       paidAt: Date,
//     },

//     paymentResult: {
//       id: String,
//       status: String,
//       update_time: String,
//       email_address: String,
//     },

//     itemsPrice: { type: Number, required: true, default: 0.0 },
//     taxPrice: { type: Number, required: true, default: 0.0 },
//     shippingPrice: { type: Number, required: true, default: 0.0 },
//     totalPrice: { type: Number, required: true, default: 0.0 },

//     isPaid: { type: Boolean, default: false },
//     paidAt: Date,

//     deliveryStatus: {
//       type: String,
//       enum: ['confirmed', 'pending', 'shipped'],
//       default: 'pending',
//     },
//     deliveredAt: Date,
//   },
//   {
//     timestamps: true,
//   }
// );

// const Order = mongoose.model('Order', orderSchema);

// export default Order;

// refine kora lagbe?
