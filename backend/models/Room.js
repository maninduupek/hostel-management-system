
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    building: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["single", "double", "shared"],
      default: "shared",
    },

    capacity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    genderRestriction: {
      type: String,
      enum: ["male", "female", "any"],
      default: "any",
    },

    pricePerSemester: {
      type: Number,
      required: true,
      min: 0,
    },

    amenities: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["available", "full", "maintenance"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate available room slots safely
roomSchema.virtual("availableSlots").get(function () {
  // Occupants may not be selected in some queries
  if (!Array.isArray(this.occupants)) {
    return null;
  }

  return this.capacity - this.occupants.length;
});

// Include virtual fields in JSON responses
roomSchema.set("toJSON", {
  virtuals: true,
});

// Include virtual fields when converting to objects
roomSchema.set("toObject", {
  virtuals: true,
});

export default mongoose.model("Room", roomSchema);
