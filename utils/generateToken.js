import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export const generateToken = (userInfo, expiresIn = '1h') => 
  jwt.sign({ userInfo }, jwtSecret, { expiresIn });


export const verifyToken = async (token) => {
  try {
    return await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};


// export const generateToken = (req, res, userId) => {
//     // Generating a JWT token for the authenticated user
//     const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//       expiresIn: req.body.remember ? 365 * 24 + 'h' : '24h'
//     });
  
//     // Setting the JWT as an HTTP-only cookie for enhanced security
//     res.cookie('jwt', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV !== 'development',
//       sameSite: 'strict',
//       maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
//     });
//   };