import express from 'express';
import path from 'path';
// import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { connectDB } from './config/db.js';
import 'dotenv/config';

// import errorHandler from './middlewares/errorHandler.js';
import ProductRoutes from './routes/ProductRoutes.js';
import UserRoutes from './routes/userRoutes.js';
import AddressRoutes from './routes/AddressRoutes.js';
import CategoryRoutes from './routes/CategoryRoutes.js';
import ReviewRoutes from './routes/ReviewRoutes.js';
import CartRoutes from './routes/CartRoutes.js';
import OrderRoutes from './routes/OrderRoutes.js';

// import Redis from 'ioredis';

import passport from 'passport';
// import './config/passport.js';
// import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './docs/swagger.json';

// dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
// const redis = new Redis();
// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res, next) => {
    console.warn(`⚠️ Rate limit hit: IP ${req.ip} | URL: ${req.originalUrl}`);
    res.status(429).json({ message: 'Too many requests from this IP, please try again later.' });
  },
});

// Essential Middlewares
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Cookies & Session Allow
    exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  })
);
app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter);
app.use(passport.initialize());
app.use(compression());

// Set {__dirname} to current working directory
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API Docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', UserRoutes);
app.use('/api/address', AddressRoutes);
app.use('/api/product', ProductRoutes);
app.use('/api/category', CategoryRoutes);
app.use('/api/review', ReviewRoutes);
app.use('/api/cart', CartRoutes);
app.use('/api/order', OrderRoutes);
// Error Handling Middleware
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.status(200).json({ message: 'running' });
});
app.listen(PORT, () => {
  console.log('server [STARTED] ~ http://localhost:5000');
});

// // ------------------ Import Section ------------------
// import express from 'express';
// import path from 'path';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import compression from 'compression';
// import passport from 'passport';
// import { connectDB } from './config/db.js';
// import 'dotenv/config';

// // ------------------ Routes ------------------
// import ProductRoutes from './routes/ProductRoutes.js';
// import UserRoutes from './routes/userRoutes.js';
// import AddressRoutes from './routes/AddressRoutes.js';
// import CategoryRoutes from './routes/CategoryRoutes.js';
// import ReviewRoutes from './routes/ReviewRoutes.js';
// import CartRoutes from './routes/CartRoutes.js';
// import OrderRoutes from './routes/OrderRoutes.js';

// // ------------------ DB Connection ------------------
// connectDB(); // Connect MongoDB

// const app = express();
// const __dirname = path.resolve();

// // ------------------ Rate Limiter Configs ------------------

// // 1. Auth: protect login/register
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50, // Only 50 requests per IP for auth
//   message: 'Too many login/register attempts, please try again later.',
//   handler: (req, res) => {
//     console.warn(`🚨 Auth Rate Limit Hit: IP ${req.ip}`);
//     res.status(429).json({ message: 'Too many login/register attempts.' });
//   },
// });

// // 2. Product & Cart Browsing: allow high volume
// const productLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 1000, // Browse up to 1000 times per minute
//   message: 'Too many product/cart requests. Please slow down.',
// });

// // 3. Orders: limited but not too strict
// const orderLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 100,
//   message: 'Too many order actions. Please wait.',
// });

// // 4. Global fallback (other routes)
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 2000,
//   message: 'Too many requests from this IP. Please try again later.',
//   handler: (req, res) => {
//     console.warn(`🌐 Global Rate Limit Hit: IP ${req.ip} | URL: ${req.originalUrl}`);
//     res.status(429).json({ message: 'Rate limit exceeded. Try again later.' });
//   },
// });

// // ------------------ Global Middlewares ------------------
// app.use(
//   cors({
//     origin: 'http://localhost:5173', // Frontend URL
//     credentials: true,
//     exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
//   })
// );
// app.use(express.json());
// app.use(cookieParser());
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(passport.initialize());
// app.use(compression());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // ------------------ Apply Rate Limiters ------------------

// // 🔐 Auth route
// app.use('/api/auth', authLimiter);

// // 🛒 Product and Cart browsing
// app.use('/api/product', productLimiter);
// app.use('/api/cart', productLimiter);

// // 📦 Order placement
// app.use('/api/order', orderLimiter);

// // 🌐 Fallback global limiter for all others
// app.use(globalLimiter);

// // ------------------ API Routes ------------------
// app.use('/api/auth', UserRoutes);
// app.use('/api/address', AddressRoutes);
// app.use('/api/product', ProductRoutes);
// app.use('/api/category', CategoryRoutes);
// app.use('/api/review', ReviewRoutes);
// app.use('/api/cart', CartRoutes);
// app.use('/api/order', OrderRoutes);

// // ------------------ Test Route ------------------
// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'API Running ✅' });
// });

// // ------------------ Server Start ------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running → http://localhost:${PORT}`);
// });
