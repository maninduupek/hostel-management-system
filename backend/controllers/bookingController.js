
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";

// ========================================
// CREATE BOOKING - STUDENT
// POST /api/bookings
// ========================================

export const createBooking = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can create bookings",
      });
    }

    const { roomId, semester, preferences = "" } = req.body;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        message: "Invalid room ID",
      });
    }

    if (!semester || !String(semester).trim()) {
      return res.status(400).json({
        message: "Semester is required",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    if (room.status === "maintenance") {
      return res.status(400).json({
        message: "This room is under maintenance",
      });
    }

    if (
      room.status === "full" ||
      room.occupants.length >= room.capacity
    ) {
      return res.status(400).json({
        message: "Room is already at full capacity",
      });
    }

    if (
      room.genderRestriction !== "any" &&
      req.user.gender &&
      room.genderRestriction !== req.user.gender
    ) {
      return res.status(400).json({
        message: "This room does not match the gender restriction",
      });
    }

    const existingBooking = await Booking.findOne({
      student: req.user._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active or pending booking",
      });
    }

    const booking = await Booking.create({
      student: req.user._id,
      room: roomId,
      semester: String(semester).trim(),
      preferences,
      status: "pending",
    });

    return res.status(201).json({
      message: "Booking request submitted successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

// ========================================
// GET BOOKINGS
// GET /api/bookings
// ========================================

export const getBookings = async (req, res) => {
  try {
    const filter =
      req.user.role === "student"
        ? { student: req.user._id }
        : {};

    const bookings = await Booking.find(filter)
      .populate("student", "name email studentId gender")
      .populate(
        "room",
        "roomNumber building floor type pricePerSemester"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      message: "Failed to retrieve bookings",
    });
  }
};

// ========================================
// UPDATE BOOKING STATUS - ADMIN / WARDEN
// PUT /api/bookings/:id/status
// ========================================

export const updateBookingStatus = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not authorized to update bookings",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const allowedStatuses = [
      "approved",
      "rejected",
      "cancelled",
      "checked_out",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid booking status",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Prevent updating the same status twice
    if (booking.status === status) {
      return res.status(400).json({
        message: `Booking is already ${status}`,
      });
    }

    // Define valid status transitions
    const validTransitions = {
      pending: ["approved", "rejected", "cancelled"],
      approved: ["checked_out", "cancelled"],
      rejected: [],
      cancelled: [],
      checked_out: [],
    };

    const possibleTransitions =
      validTransitions[booking.status] || [];

    if (!possibleTransitions.includes(status)) {
      return res.status(400).json({
        message: `Cannot change booking from ${booking.status} to ${status}`,
      });
    }

    const room = await Room.findById(booking.room);

    if (!room) {
      return res.status(404).json({
        message: "Room associated with booking not found",
      });
    }

    // ====================================
    // APPROVE BOOKING
    // ====================================

    if (status === "approved") {
      if (room.status === "maintenance") {
        return res.status(400).json({
          message: "Room is under maintenance",
        });
      }

      if (
        room.status === "full" ||
        room.occupants.length >= room.capacity
      ) {
        return res.status(400).json({
          message: "Room has no available slots",
        });
      }

      const alreadyOccupant = room.occupants.some(
        (occupantId) =>
          occupantId.toString() === booking.student.toString()
      );

      if (alreadyOccupant) {
        return res.status(400).json({
          message: "Student is already assigned to this room",
        });
      }

      room.occupants.push(booking.student);

      if (room.occupants.length >= room.capacity) {
        room.status = "full";
      } else {
        room.status = "available";
      }

      await room.save();

      booking.checkInDate = new Date();
      booking.approvedBy = req.user._id;
    }

    // ====================================
    // CHECK OUT OR CANCEL APPROVED BOOKING
    // ====================================

    if (
      ["checked_out", "cancelled"].includes(status) &&
      booking.status === "approved"
    ) {
      room.occupants = room.occupants.filter(
        (occupantId) =>
          occupantId.toString() !== booking.student.toString()
      );

      if (room.status !== "maintenance") {
        room.status =
          room.occupants.length >= room.capacity
            ? "full"
            : "available";
      }

      await room.save();

      if (status === "checked_out") {
        booking.checkOutDate = new Date();
      }
    }

    // ====================================
    // SAVE BOOKING STATUS
    // ====================================

    booking.status = status;

    await booking.save();

    return res.status(200).json({
      message: `Booking ${status.replace("_", " ")} successfully`,
      booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      message: "Failed to update booking status",
    });
  }
};
