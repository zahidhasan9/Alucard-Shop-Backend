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

