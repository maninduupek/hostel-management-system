import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

// @desc Get admin dashboard analytics
// @route GET /api/dashboard/stats
export const getStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: "available" });
    const fullRooms = await Room.countDocuments({ status: "full" });

    const totalStudents = await User.countDocuments({ role: "student" });

    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const approvedBookings = await Booking.countDocuments({ status: "approved" });

    const revenueAgg = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const openComplaints = await Complaint.countDocuments({ status: "open" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "in_progress" });

    const allRooms = await Room.find();
    const totalCapacity = allRooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = allRooms.reduce((sum, r) => sum + r.occupants.length, 0);
    const occupancyRate =
      totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0;

    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      totalRooms,
      availableRooms,
      fullRooms,
      totalStudents,
      pendingBookings,
      approvedBookings,
      totalRevenue,
      openComplaints,
      inProgressComplaints,
      occupancyRate,
      complaintsByCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
