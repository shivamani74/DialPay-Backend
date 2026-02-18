import express from "express";
import { handleUSSD } from "../controllers/ussdController.js";

const router = express.Router();

router.post("/", handleUSSD);

export default router;
