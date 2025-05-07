import express from "express";
import {
  createAddress,
  getAllAddresses,
  getAddressByType,
  updateAddress,
  deleteAddress
} from "../controllers/AddressController.js";
import { protect,authRoute } from "../middlewares/authMiddleware.js";

// protect,authRoute same funcetion
const router = express.Router();

router.post("/add", authRoute, createAddress);
router.get("/", authRoute, getAllAddresses);
router.get("/:type", authRoute, getAddressByType); 
router.put("/:id", authRoute, updateAddress);
router.delete("/:id", authRoute, deleteAddress);

export default router;
