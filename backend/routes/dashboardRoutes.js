import express from "express";
import { getStats } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, authorize("admin", "warden"), getStats);

export default router;
