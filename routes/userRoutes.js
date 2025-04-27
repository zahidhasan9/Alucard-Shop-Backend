import express from 'express';
import {
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
    resetPassword} from '../controllers/UserController.js';

const router = express.Router();

router.post("/register", registerUser)
router.post("/login", loginUser);
router.get("/users", getUsers);
// router.post("/session", sessionUser);
router.post("/logout", logoutUser);



export default router;
