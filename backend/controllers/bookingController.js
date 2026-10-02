import Booking from "../models/Booking.js";
import Room from "../models/Room.js";

// @desc Create a booking request (student)
// @route POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { roomId, semester, preferences } = req.body;
    const room = await Room.findById(roomId);

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ message: "Room is already at full capacity" });
    }
    if (
      room.genderRestriction !== "any" &&
      req.user.gender &&
      room.genderRestriction !== req.user.gender
    ) {
      return res.status(400).json({ message: "This room does not match the gender restriction" });
    }

    const existing = await Booking.findOne({
      student: req.user._id,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(400).json({ message: "You already have an active or pending booking" });
    }

    const booking = await Booking.create({
      student: req.user._id,
      room: roomId,
      semester,
      preferences,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get bookings (admin sees all, student sees own)
// @route GET /api/bookings
export const getBookings = async (req, res) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user._id } : {};
    const bookings = await Booking.find(filter)
      .populate("student", "name email studentId gender")
      .populate("room", "roomNumber building floor type pricePerSemester")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Approve or reject a booking (admin/warden)
// @route PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected' | 'cancelled' | 'checked_out'
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status === "approved") {
      const room = await Room.findById(booking.room._id);
      if (room.occupants.length >= room.capacity) {
        return res.status(400).json({ message: "Room has no available slots" });
      }
      room.occupants.push(booking.student);
      if (room.occupants.length >= room.capacity) room.status = "full";
      await room.save();
      booking.checkInDate = new Date();
      booking.approvedBy = req.user._id;
    }

    if (["cancelled", "checked_out"].includes(status) && booking.status === "approved") {
      const room = await Room.findById(booking.room._id);
      room.occupants = room.occupants.filter(
        (occId) => occId.toString() !== booking.student.toString()
      );
      room.status = "available";
      await room.save();
      if (status === "checked_out") booking.checkOutDate = new Date();
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
