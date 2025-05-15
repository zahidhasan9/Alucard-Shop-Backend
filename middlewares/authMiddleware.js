import User from '../models/UserModel.js';
// import Order from "../models/Order.js";
import jwt from 'jsonwebtoken';

// Middleware to protect routes by verifying JWT authentication token.
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.statusCode = 401;
      throw new Error('Authentication failed: Token not provided.');
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      res.statusCode = 401;
      throw new Error('Authentication failed: Invalid token.');
    }
    req.user = await User.findById(decodedToken.id).select('-password');

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if the user is an admin.
const admin = (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.statusCode = 401;
      throw new Error('Authorization failed: Not authorized as an admin.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to protect routes by verifying JWT authentication token  same like protect upu can use both.
const authRoute = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export { protect, admin, authRoute };

// check product purchased after add reviwe
// export const hasPurchased = async (req, res, next) => {
//   const userId = req.user._id;
//   const productId = req.body.product;

//   const order = await Order.findOne({
//     user: userId,
//     'items.product': productId,
//   });

//   if (!order) {
//     return res.status(403).json({ message: 'You can only review purchased products.' });
//   }

//   next();
// };
