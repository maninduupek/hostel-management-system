import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    category: {
      type: String,
      enum: ["maintenance", "cleanliness", "noise", "security", "other"],
      default: "other",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
