import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';
import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import { verifyEmail, generateHashPassword, verifyPassword } from '../utils/utils.js';
import { generateToken, verifyToken } from '../utils/generateToken.js';
import transporter from '../utils/emailsender.js';
// @desc     Auth user & get token
// @method   POST
// @endpoint /api/users/login
// @access   Public
// @desc     Register user
// @method   POST
// @endpoint /api/users
// @access   Public
const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: 'First name, last name, email and password are required',
      });
    }

    if (!verifyEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone: phone || '',
      password: hashedPassword,
    });

    await newUser.save();

    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      role: newUser.role,
    });

    res.status(201).json({
      message: 'New user created',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error registering user',
    });
    next(error);
  }
};

// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     const user = await User.findOne({ email }).lean(); // Lean will boost performance

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: 'Invalid email address. Please check your email and try again.' });
//     }

//     // const match = await bcrypt.compare(password, user.password |"");
//     const match = await verifyPassword(password, user.password);

//     if (!match) {
//       return res
//         .status(401)
//         .json({ message: 'Invalid password. Please check your password and try again.' });
//     }

//     const token = generateToken({
//       id: user._id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//     });

//     //  Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       // secure: process.env.NODE_ENV === "production", // Production হলে Secure হবে
//       secure: true,
//       // domain: 'localhost',
//       sameSite: 'none',
//       maxAge: 24 * 60 * 60 * 1000,
//     });
//     res.status(200).json({
//       message: 'Login successful',
//       user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
//       token,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Internal server error' });
//   }
// };

// **🔹 Session API**
// /api/auth/session",

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'Invalid email address. Please check your email and try again.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const match = await verifyPassword(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: 'Invalid password. Please check your password and try again.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

const sessionUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    // const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
};




const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({
    message: "Logged out successfully!",
  });
};

// @desc     Get users
// @method   GET
// @endpoint /api/users
// @access   Private/Admin
const getUsers = async (req, res, next) => {
  try {
    //   const users = await User.find({ isAdmin: false });
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found!' });
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc     Get user profile
// @method   GET
// @endpoint /api/users/profile
// @access   Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Get admins
// @method   GET
// @endpoint /api/users/admins
// @access   Private/Admin
const admins = async (req, res, next) => {
  try {
    const admins = await User.find({ isAdmin: true });

    if (!admins || admins.length === 0) {
      res.statusCode = 404;
      throw new Error('No admins found!');
    }
    res.status(200).json(admins);
  } catch (error) {
    next(error);
  }
};

// @desc     Get user
// @method   GET
// @endpoint /api/users/:id
// @access   Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    console.log(currentPassword, newPassword, confirmPassword);

    // Check all fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save new password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc     Update user
// @method   PUT
// @endpoint /api/users/:id
// @access   Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    const updatedUser = await user.save();

    res.status(200).json({ message: 'User updated', updatedUser });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
    next(error);
  }
};

// @desc     Update user profile
// @method   PUT
// @endpoint /api/users/profile
// @access   Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found. Unable to update profile.');
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();

    res.status(200).json({
  message: 'User profile updated successfully.',
  user: {
    id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    phone: updatedUser.phone || '',
    role: updatedUser.role,
    isActive: updatedUser.isActive,
  },
});
  } catch (error) {
    next(error);
  }
};

// @desc     Delete user
// @method   DELETE
// @endpoint /api/users/:id
// @access   Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    await User.deleteOne({ _id: user._id });
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};



// const getCustomers = async (req, res) => {
//   try {
//     const page = Math.max(Number(req.query.page) || 1, 1);
//     const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
//     const skip = (page - 1) * limit;

//     const search = req.query.search?.trim() || '';
//     const status = req.query.status || 'all';
//     const role = req.query.role || 'user';

//     const match = {};

//     if (role !== 'all') {
//       match.role = role;
//     }

//     if (status === 'active') {
//       match.isActive = true;
//     }

//     if (status === 'inactive') {
//       match.isActive = false;
//     }

//     if (search) {
//       match.$or = [
//         { firstName: { $regex: search, $options: 'i' } },
//         { lastName: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const customers = await User.aggregate([
//       { $match: match },
//       {
//         $lookup: {
//           from: 'orders',
//           localField: '_id',
//           foreignField: 'user',
//           as: 'orders',
//         },
//       },
//       {
//         $addFields: {
//           fullName: {
//             $concat: [
//               { $ifNull: ['$firstName', ''] },
//               ' ',
//               { $ifNull: ['$lastName', ''] },
//             ],
//           },
//           totalOrders: { $size: '$orders' },
//           totalSpend: { $sum: '$orders.totalPrice' },
//           paidOrders: {
//             $size: {
//               $filter: {
//                 input: '$orders',
//                 as: 'order',
//                 cond: { $eq: ['$$order.isPaid', true] },
//               },
//             },
//           },
//           pendingOrders: {
//             $size: {
//               $filter: {
//                 input: '$orders',
//                 as: 'order',
//                 cond: { $eq: ['$$order.Delivery', 'pending'] },
//               },
//             },
//           },
//           lastOrderAt: { $max: '$orders.createdAt' },
//         },
//       },
//       {
//         $project: {
//           password: 0,
//           wishlist: 0,
//           addresses: 0,
//           orders: 0,
//         },
//       },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: limit },
//     ]);

//     const totalCustomers = await User.countDocuments(match);

//     const stats = await User.aggregate([
//       { $match: role === 'all' ? {} : { role } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: 1 },
//           active: {
//             $sum: {
//               $cond: [{ $eq: ['$isActive', true] }, 1, 0],
//             },
//           },
//           inactive: {
//             $sum: {
//               $cond: [{ $eq: ['$isActive', false] }, 1, 0],
//             },
//           },
//         },
//       },
//     ]);

//     res.status(200).json({
//       customers,
//       pagination: {
//         page,
//         limit,
//         total: totalCustomers,
//         pages: Math.ceil(totalCustomers / limit),
//       },
//       stats: stats[0] || {
//         total: 0,
//         active: 0,
//         inactive: 0,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message || 'Failed to fetch customers',
//     });
//   }
// };


const getCustomers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || '';
    const status = req.query.status || 'all';
    const role = req.query.role || 'user';

    const match = {};

    if (role !== 'all') {
      match.role = role;
    }

    if (status === 'active') {
      match.isActive = true;
    }

    if (status === 'inactive') {
      match.isActive = false;
    }

    if (search) {
      match.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const statsMatch = {};

    if (role !== 'all') {
      statsMatch.role = role;
    }

    if (search) {
      statsMatch.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await User.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'orders',
          let: { customerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$user', '$$customerId'],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $project: {
                orderId: 1,
                totalPrice: 1,
                isPaid: 1,
                Delivery: 1,
                createdAt: 1,
                shippingAddress: 1,
                manualPayment: 1,
              },
            },
          ],
          as: 'orders',
        },
      },
      {
        $addFields: {
          fullName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$firstName', ''] },
                  ' ',
                  { $ifNull: ['$lastName', ''] },
                ],
              },
            },
          },

          totalOrders: {
            $size: '$orders',
          },

          totalSpend: {
            $sum: '$orders.totalPrice',
          },

          paidOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: {
                  $eq: ['$$order.isPaid', true],
                },
              },
            },
          },

          pendingOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: {
                  $eq: ['$$order.Delivery', 'pending'],
                },
              },
            },
          },

          lastOrder: {
            $arrayElemAt: ['$orders', 0],
          },
        },
      },
      {
        $addFields: {
          lastOrderAt: '$lastOrder.createdAt',
          lastShippingPhone: '$lastOrder.shippingAddress.phone',
          lastManualPaymentPhone: '$lastOrder.manualPayment.senderNumber',
        },
      },
      {
        $addFields: {
          displayPhone: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $ne: ['$phone', null] },
                      { $ne: ['$phone', ''] },
                    ],
                  },
                  then: '$phone',
                },
                {
                  case: {
                    $and: [
                      { $ne: ['$lastShippingPhone', null] },
                      { $ne: ['$lastShippingPhone', ''] },
                    ],
                  },
                  then: '$lastShippingPhone',
                },
                {
                  case: {
                    $and: [
                      { $ne: ['$lastManualPaymentPhone', null] },
                      { $ne: ['$lastManualPaymentPhone', ''] },
                    ],
                  },
                  then: '$lastManualPaymentPhone',
                },
              ],
              default: '',
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          wishlist: 0,
          addresses: 0,
          orders: 0,
          lastOrder: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totalCustomers = await User.countDocuments(match);

    const stats = await User.aggregate([
      {
        $match: statsMatch,
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      customers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit),
      },
      stats: stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch customers',
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id).select('-password');

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      });
    }

    const orders = await Order.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalOrders = await Order.countDocuments({ user: id });

    const spendStats = await Order.aggregate([
      {
        $match: {
          user: customer._id,
        },
      },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$totalPrice' },
          paidSpend: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$Delivery', 'pending'] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      customer,
      orders,
      summary: {
        totalOrders,
        totalSpend: spendStats[0]?.totalSpend || 0,
        paidSpend: spendStats[0]?.paidSpend || 0,
        pendingOrders: spendStats[0]?.pendingOrders || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch customer details',
    });
  }
};

const updateCustomerByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, isActive } = req.body;

    const customer = await User.findById(id);

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      });
    }

    const isSelf = req.user._id.toString() === customer._id.toString();

    if (isSelf && isActive === false) {
      return res.status(400).json({
        message: 'You cannot deactivate your own admin account',
      });
    }

    if (isSelf && role === 'user') {
      return res.status(400).json({
        message: 'You cannot remove your own admin role',
      });
    }

    if (email && email !== customer.email) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: 'Email already exists',
        });
      }

      customer.email = email;
    }

    customer.firstName = firstName ?? customer.firstName;
    customer.lastName = lastName ?? customer.lastName;
    customer.phone = phone ?? customer.phone;

    if (role && ['user', 'admin'].includes(role)) {
      customer.role = role;
    }

    if (typeof isActive === 'boolean') {
      customer.isActive = isActive;
    }

    const updatedCustomer = await customer.save();

    res.status(200).json({
      message: 'Customer updated successfully',
      customer: {
        _id: updatedCustomer._id,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        role: updatedCustomer.role,
        isActive: updatedCustomer.isActive,
        lastLogin: updatedCustomer.lastLogin,
        createdAt: updatedCustomer.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update customer',
    });
  }
};

const deleteCustomerByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      });
    }

    if (req.user._id.toString() === customer._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own admin account',
      });
    }

    const orderCount = await Order.countDocuments({ user: id });

    if (orderCount > 0) {
      customer.isActive = false;
      await customer.save();

      return res.status(200).json({
        message:
          'Customer has order history, so account was deactivated instead of deleted',
      });
    }

    await User.deleteOne({ _id: id });

    res.status(200).json({
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to delete customer',
    });
  }
};






// @desc     Send reset password email
// @method   POST
// @endpoint /api/users/reset-password/request
// @access   Public
const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User email not found!' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });
    const passwordResetLink = `http://localhost:5173/reset-password/${user._id}/${token}`;
    // console.log(passwordResetLink);
    // res.json({token:passwordResetLink})
    await transporter.sendMail({
      from: `"MERN Shop" ${process.env.EMAIL_FROM}`, // sender address
      to: user.email, // list of receivers
      subject: 'Password Reset -ZOTAC FURY', // Subject line
      html: `
     <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ZOTAC FURY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; margin: 32px auto;">
    <tr>
      <td style="padding: 32px; background: linear-gradient(145deg, #fff9db 0%, #fff3a3 100%); border-radius: 16px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">ZOTAC FURY</h1>
              <p style="color: #555; font-size: 14px; margin: 8px 0 0;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 16px;">Hello ${user.firstName},</h2>
              <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 20px;">
                We received a request to reset the password for your <strong>ZOTAC FURY</strong> account.
              </p>
              <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 32px;">
                Click the button below to reset your password. This link will expire in <strong>15 minutes</strong> for your security.
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="text-align: center; margin: 32px 0;">
                    <a href="${passwordResetLink}" target="_blank" style="display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
                      🔐 Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 16px;">
                If the button doesn’t work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #0055cc; word-break: break-all; margin: 0 0 24px;">
                <a href="${passwordResetLink}" target="_blank" style="color: #0055cc; text-decoration: none; font-weight: 500;">${passwordResetLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 13px; color: #777; line-height: 1.6; text-align: center; margin: 0 0 16px;">
                If you didn’t request a password reset, please ignore this email. Your account remains secure.
              </p>
              <p style="font-size: 14px; color: #333; line-height: 1.6; text-align: center; margin: 0;">
                Warm regards,<br><strong>The ZOTAC FURY Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    res.status(200).json({ message: 'Password reset email sent, please check your email.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log('tokecccccccccccccccccc', token, decodedToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else {
        return res.status(400).json({ message: 'Token verification failed' });
      }
    }

    if (decodedToken.id !== id) {
      return res.status(403).json({ message: 'Token does not match user ID' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    console.log('JWT Error:', err.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc     Reset password
// @method   POST
// @endpoint /api/users/reset-password/reset/:id/:token
// @access   Private
// const resetPassword = async (req, res, next) => {
//   try {
//     const { password } = req.body;
//     const { id, token } = req.params;
//     console.log('user', id, token, password);
//     const user = await User.findById(id);
//     console.log(user);
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decodedToken) {
//       res.statusCode = 401;
//       throw new Error('Invalid or expired token');
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     await user.save();

//     res.status(200).json({ message: 'Password successfully reset' });
//   } catch (error) {
//     next(error);
//   }
// };

export {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  getUsers,
  getUserById,
  updateUser,
  updateUserProfile,
  deleteUser,
  admins,
  resetPasswordRequest,
  resetPassword,
  sessionUser,
  changePassword,

  // customer admin
  getCustomers,
  getCustomerById,
  updateCustomerByAdmin,
  deleteCustomerByAdmin,
};
