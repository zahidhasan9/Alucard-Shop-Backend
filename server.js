import express from 'express';
import path from 'path';
// import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { connectDB } from './config/db.js';
import 'dotenv/config';

// import errorHandler from './middlewares/errorHandler.js';
import ProductRoutes from './routes/ProductRoutes.js';
import UserRoutes from './routes/userRoutes.js';
import AddressRoutes from './routes/AddressRoutes.js';
import CategoryRoutes from './routes/CategoryRoutes.js';
import BrandRoutes from './routes/BrandRoutes.js';
import ReviewRoutes from './routes/ReviewRoutes.js';
import CartRoutes from './routes/CartRoutes.js';
import OrderRoutes from './routes/OrderRoutes.js';

import passport from 'passport';
connectDB(); // Connect to MongoDB

const app = express();

// Essential Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'app-fury-2k25.netlify.app',
];
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
app.use(helmet());
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(compression());

// Set {__dirname} to current working directory
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Routes
app.use('/api/auth', UserRoutes);
app.use('/api/address', AddressRoutes);
app.use('/api/product', ProductRoutes);
app.use('/api/category', CategoryRoutes);
app.use('/api/brand', BrandRoutes);
app.use('/api/review', ReviewRoutes);
app.use('/api/cart', CartRoutes);
app.use('/api/order', OrderRoutes);

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.status(200).json({ message: 'running' });
});
app.listen(PORT, () => {
  console.log('server [STARTED] ~ http://localhost:5000');
});
