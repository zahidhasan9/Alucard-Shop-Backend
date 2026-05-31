// // import express from 'express';
// // import {
// //     loginUser,
// //     registerUser,
// //     logoutUser,
// //     getUserProfile,
// //     getUsers,
// //     sessionUser,
// //     getUserById,
// //     updateUser,
// //     updateUserProfile,
// //     deleteUser,
// //     admins,
// //     changePassword,
// //     resetPasswordRequest,
// //     resetPassword} from '../controllers/UserController.js';
// //     import { protect, admin } from '../middlewares/authMiddleware.js';

// // const router = express.Router();

// // router.post("/register", registerUser)
// // router.post("/login", loginUser);
// // router.get("/users", getUsers);
// // router.get("/me", sessionUser);
// // router.post("/logout", logoutUser);
// // router.post("/resetPasswordRequest", resetPasswordRequest);
// // router.post("/reset-password/:id/:token", resetPassword);
// // router.post("/user/:id",protect, getUserById);
// // router.put("/user",protect, updateUserProfile);
// // router.put("/changepassword",protect, changePassword);




// // export default router;






// import express from 'express';
// import {
//   loginUser,
//   registerUser,
//   logoutUser,
//   sessionUser,
//   getUsers,
//   getUserById,
//   updateUserProfile,
//   changePassword,
//   resetPasswordRequest,
//   resetPassword,
//   getCustomers,
//   getCustomerById,
//   updateCustomerByAdmin,
//   deleteCustomerByAdmin,
// } from '../controllers/UserController.js';

// import { protect, admin } from '../middlewares/authMiddleware.js';

// const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', loginUser);
// router.post('/logout', logoutUser);

// router.get('/me', protect, sessionUser);

// router.post('/resetPasswordRequest', resetPasswordRequest);
// router.post('/reset-password/:id/:token', resetPassword);

// router.get('/customers', protect, admin, getCustomers);
// router.get('/customers/:id', protect, admin, getCustomerById);
// router.put('/customers/:id', protect, admin, updateCustomerByAdmin);
// router.delete('/customers/:id', protect, admin, deleteCustomerByAdmin);

// router.get('/users', protect, admin, getUsers);
// router.get('/users/:id', protect, admin, getUserById);

// router.put('/user', protect, updateUserProfile);
// router.put('/changepassword', protect, changePassword);

// export default router;




import express from 'express';

import {
  loginUser,
  registerUser,
  logoutUser,
  sessionUser,
  getUsers,
  getUserById,
  updateUserProfile,
  changePassword,
  resetPasswordRequest,
  resetPassword,
  getCustomers,
  getCustomerById,
  updateCustomerByAdmin,
  deleteCustomerByAdmin,
} from '../controllers/UserController.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.get('/me', protect, sessionUser);

router.post('/resetPasswordRequest', resetPasswordRequest);
router.post('/reset-password/:id/:token', resetPassword);

// existing user routes
router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUserById);

// new customer admin routes
router.get('/customers', protect, admin, getCustomers);
router.get('/customers/:id', protect, admin, getCustomerById);
router.put('/customers/:id', protect, admin, updateCustomerByAdmin);
router.delete('/customers/:id', protect, admin, deleteCustomerByAdmin);

router.put('/user', protect, updateUserProfile);
router.put('/changepassword', protect, changePassword);

export default router;