
import mongoose from "mongoose";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";

// Validate room information
const validateRoom = (data, existingRoom = null) => {
  const roomNumber = data.roomNumber?.trim();
  const building = data.building?.trim();

  if (!roomNumber || !building) {
    return "Room number and building are required.";
  }

  if (!Number.isInteger(data.floor) || data.floor < 0) {
    return "Floor must be a non-negative whole number.";
  }

  if (!Number.isInteger(data.capacity) || data.capacity < 1) {
    return "Capacity must be at least 1.";
  }

  if (
    typeof data.pricePerSemester !== "number" ||
    !Number.isFinite(data.pricePerSemester) ||
    data.pricePerSemester < 0
  ) {
    return "Price must be a valid non-negative number.";
  }

  if (
    !["single", "double", "shared"].includes(data.type)
  ) {
    return "Invalid room type.";
  }

  if (
    !["male", "female", "any"].includes(
      data.genderRestriction
    )
  ) {
    return "Invalid gender restriction.";
  }

  if (
    !["available", "full", "maintenance"].includes(
      data.status
    )
  ) {
    return "Invalid room status.";
  }

  if (
    !Array.isArray(data.amenities) ||
    !data.amenities.every(
      (item) => typeof item === "string"
    )
  ) {
    return "Amenities must be a list of strings.";
  }

  if (
    existingRoom &&
    data.capacity < existingRoom.occupants.length
  ) {
    return "Capacity cannot be less than current occupancy.";
  }

  if (
    existingRoom?.occupants.length > 0 &&
    data.status === "maintenance"
  ) {
    return "Cannot set an occupied room to maintenance.";
  }

  return null;
};

// @desc Get all rooms with optional filters
// @route GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const { status, building, type } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (building) filter.building = building;
    if (type) filter.type = type;

    const rooms = await Room.find(filter).populate(
      "occupants",
      "name email studentId"
    );

    res.json(rooms);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc Get room by ID
// @route GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid room ID.",
      });
    }

    const room = await Room.findById(
      req.params.id
    ).populate("occupants", "name email studentId");

    if (!room) {
      return res.status(404).json({
        message: "Room not found.",
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc Create a new room
// @route POST /api/rooms
// @access Admin / Warden
export const createRoom = async (req, res) => {
  try {
    const allowedFields = [
      "roomNumber",
      "building",
      "floor",
      "type",
      "capacity",
      "genderRestriction",
      "pricePerSemester",
      "amenities",
      "status",
    ];

    const data = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    const roomData = {
      roomNumber: data.roomNumber,
      building: data.building,
      floor: data.floor,
      type: data.type ?? "shared",
      capacity: data.capacity ?? 1,
      genderRestriction: data.genderRestriction ?? "any",
      pricePerSemester: data.pricePerSemester,
      amenities: data.amenities ?? [],
      status: data.status ?? "available",
    };

    const validationError = validateRoom(roomData);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const existingRoom = await Room.findOne({
      roomNumber: roomData.roomNumber,
    });

    if (existingRoom) {
      return res.status(409).json({
        message: "Room number already exists.",
      });
    }

    const room = await Room.create(roomData);

    res.status(201).json(room);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Room number already exists.",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
};

// @desc Update an existing room
// @route PUT /api/rooms/:id
// @access Admin / Warden
export const updateRoom = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid room ID.",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found.",
      });
    }

    const allowedFields = [
      "roomNumber",
      "building",
      "floor",
      "type",
      "capacity",
      "genderRestriction",
      "pricePerSemester",
      "amenities",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedData = {
      roomNumber: updates.roomNumber ?? room.roomNumber,
      building: updates.building ?? room.building,
      floor: updates.floor ?? room.floor,
      type: updates.type ?? room.type,
      capacity: updates.capacity ?? room.capacity,
      genderRestriction:
        updates.genderRestriction ?? room.genderRestriction,
      pricePerSemester:
        updates.pricePerSemester ?? room.pricePerSemester,
      amenities: updates.amenities ?? room.amenities,
      status: updates.status ?? room.status,
    };

    const validationError = validateRoom(
      updatedData,
      room
    );

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const activeBookings = await Booking.countDocuments({
      room: room._id,
      status: { $in: ["pending", "approved"] },
    });

    if (
      activeBookings > 0 &&
      (
        updatedData.capacity !== room.capacity ||
        updatedData.genderRestriction !==
          room.genderRestriction ||
        updatedData.status === "maintenance"
      )
    ) {
      return res.status(400).json({
        message:
          "Cannot change capacity, gender restriction, or set maintenance while active bookings exist.",
      });
    }

    Object.assign(room, updates);

    await room.save();

    res.json(room);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Room number already exists.",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
};

// @desc Delete room
// @route DELETE /api/rooms/:id
// @access Admin only
export const deleteRoom = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid room ID.",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found.",
      });
    }

    // Prevent deleting occupied rooms
    if (room.occupants.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete a room with occupants.",
      });
    }

    // Prevent deleting rooms with active bookings
    const activeBooking = await Booking.exists({
      room: room._id,
      status: { $in: ["pending", "approved"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message:
          "Cannot delete a room with pending or approved bookings.",
      });
    }

    // Preserve historical booking references
    const bookingHistory = await Booking.exists({
      room: room._id,
    });

    if (bookingHistory) {
      return res.status(400).json({
        message:
          "Cannot delete a room with booking history. Consider marking it as maintenance instead.",
      });
    }

    await Room.findByIdAndDelete(room._id);

    res.json({
      message: "Room deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
