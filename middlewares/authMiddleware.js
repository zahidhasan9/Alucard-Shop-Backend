// import User from '../models/UserModel.js';
// // import Order from "../models/Order.js";
// import jwt from 'jsonwebtoken';

// // Middleware to protect routes by verifying JWT authentication token.
// const protect = async (req, res, next) => {
//   try {
//     const token = req.cookies.token;

//     if (!token) {
//       res.statusCode = 401;
//       throw new Error('Authentication failed: Token not provided.');
//     }

//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decodedToken) {
//       res.statusCode = 401;
//       throw new Error('Authentication failed: Invalid token.');
//     }
//     req.user = await User.findById(decodedToken.id).select('-password');

//     next();
//   } catch (error) {
//     next(error);
//   }
// };


// const admin = (req, res, next) => {
//   try {
//     if (req.user.role !== 'admin') {
//       res.statusCode = 401;
//       throw new Error('Authorization failed: Not authorized as an admin.');
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// // Middleware to protect routes by verifying JWT authentication token  same like protect upu can use both.
// const authRoute = (req, res, next) => {
//   const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

//   if (!token) return res.status(401).json({ message: 'Unauthorized' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = decoded.id;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// export { protect, admin, authRoute };





import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;

  const authHeader = req.headers?.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  return cookieToken || bearerToken;
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      res.statusCode = 401;
      throw new Error('Authentication failed: Token not provided.');
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.id).select('-password');

    if (!user) {
      res.statusCode = 401;
      throw new Error('Authentication failed: User not found.');
    }

    if (user.isActive === false) {
      res.statusCode = 403;
      throw new Error('Your account has been deactivated.');
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    next(error);
  }
};

const admin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.statusCode = 403;
      throw new Error('Authorization failed: Not authorized as an admin.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

const authRoute = protect;

export { protect, admin, authRoute };

