import express from 'express';
// import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { connectDB } from './config/db.js';
import 'dotenv/config';

// import errorHandler from './middlewares/errorHandler.js';
// import authRoutes from './routes/authRoutes.js';
import UserRoutes from './routes/userRoutes.js';
import AddressRoutes from './routes/AddressRoutes.js';


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
    message: 'Too many requests from this IP, please try again later.'
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter);
app.use(passport.initialize());
app.use(compression());

app.use(cors({
    origin: "http://localhost:5173", // তোমার Frontend URL
    credentials: true , // Cookies & Session Allow করার জন্য
    exposedHeaders: ['Set-Cookie', 'Date', 'ETag']
  }));

// Swagger API Docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', UserRoutes);
app.use('/api/address', AddressRoutes);



// Error Handling Middleware
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.get("/",(res)=>{
    res.status(200).json({message:'running'})
})
app.listen(PORT,()=>{
    console.log('server [STARTED] ~ http://localhost:5000');
})