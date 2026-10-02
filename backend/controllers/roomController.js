import Room from "../models/Room.js";

// @desc Get all rooms (with optional filters)
// @route GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const { status, building, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (building) filter.building = building;
    if (type) filter.type = type;

    const rooms = await Room.find(filter).populate("occupants", "name email studentId");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single room
// @route GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("occupants", "name email studentId");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create room (admin only)
// @route POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Update room (admin only)
// @route PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Delete room (admin only)
// @route DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
