import express from "express";
import {
  createComplaint,
  getComplaints,
  updateComplaint,
} from "../controllers/complaintController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createComplaint);
router.get("/", protect, getComplaints);
router.put("/:id", protect, authorize("admin", "warden"), updateComplaint);

export default router;
