import express from 'express';
import {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getUsers,
    sessionUser,
    getUserById,
    updateUser,
    updateUserProfile,
    deleteUser,
    admins,
    changePassword,
    resetPasswordRequest,
    resetPassword} from '../controllers/UserController.js';
    import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/register", registerUser)
router.post("/login", loginUser);
router.get("/users", getUsers);
router.get("/me", sessionUser);
router.post("/logout", logoutUser);
router.post("/resetPasswordRequest", resetPasswordRequest);
router.post("/reset-password/:id/:token", resetPassword);
router.post("/user/:id",protect, getUserById);
router.put("/user",protect, updateUserProfile);
router.put("/changepassword",protect, changePassword);




export default router;
