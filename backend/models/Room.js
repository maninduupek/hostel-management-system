import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    building: { type: String, required: true },
    floor: { type: Number, required: true },
    type: { type: String, enum: ["single", "double", "shared"], default: "shared" },
    capacity: { type: Number, required: true, default: 1 },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    genderRestriction: { type: String, enum: ["male", "female", "any"], default: "any" },
    pricePerSemester: { type: Number, required: true },
    amenities: [{ type: String }],
    status: { type: String, enum: ["available", "full", "maintenance"], default: "available" },
  },
  { timestamps: true }
);

roomSchema.virtual("availableSlots").get(function () {
  return this.capacity - this.occupants.length;
});
roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

export default mongoose.model("Room", roomSchema);
