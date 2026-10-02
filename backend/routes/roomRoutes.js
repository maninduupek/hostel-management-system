import express from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getRooms);
router.get("/:id", protect, getRoomById);
router.post("/", protect, authorize("admin", "warden"), createRoom);
router.put("/:id", protect, authorize("admin", "warden"), updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

export default router;
