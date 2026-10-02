import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "checked_out"],
      default: "pending",
    },
    semester: { type: String, required: true },
    preferences: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
