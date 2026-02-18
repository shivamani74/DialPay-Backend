import express from "express";
import { registerUser,verifyOTP,loginUser } from "../controllers/authController.js";
import { checkBalance } from "../controllers/balanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register",registerUser);
router.post("/verifyotp",verifyOTP);
router.post("/login",loginUser);
router.get("/balance",protect,checkBalance);
export default router;