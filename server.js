import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import { protect } from "./middleware/authMiddleware.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { handleUSSD } from "./controllers/ussdController.js";
dotenv.config();
connectDB();
const app = express();
app.use(cors({
  origin: "*",
}));app.use(express.json());
app.get("/",(req,res)=>{
    res.send("Dialpay API running");
});
app.use("/api/auth",authRoutes);
app.use("/api/transactions",transactionRoutes);
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route 💳",
    user: req.user,
  });
});
app.use("/api/ussd",handleUSSD);
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});
