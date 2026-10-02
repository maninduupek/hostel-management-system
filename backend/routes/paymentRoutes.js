import express from "express";
import { createPayment, getPayments } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createPayment);
router.get("/", protect, getPayments);

export default router;
