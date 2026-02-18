import express from "express";
import { sendMoney,getTransactionHistory } from "../controllers/transactionControllers.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/send",protect,sendMoney);
router.get("/history",protect,getTransactionHistory);
export default router;