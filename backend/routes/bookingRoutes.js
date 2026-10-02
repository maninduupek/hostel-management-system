import express from "express";
import {
  createBooking,
  getBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createBooking);
router.get("/", protect, getBookings);
router.put("/:id/status", protect, authorize("admin", "warden"), updateBookingStatus);

export default router;
