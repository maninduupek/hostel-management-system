import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";

// @desc Create a (mock) payment for a booking
// @route POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "approved") {
      return res.status(400).json({ message: "Booking must be approved before payment" });
    }

    // Mock payment gateway: always succeeds, generates a fake reference
    const transactionRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const payment = await Payment.create({
      student: req.user._id,
      booking: bookingId,
      amount,
      method,
      status: "paid",
      transactionRef,
      paidAt: new Date(),
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get payments (admin sees all, student sees own)
// @route GET /api/payments
export const getPayments = async (req, res) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user._id } : {};
    const payments = await Payment.find(filter)
      .populate("student", "name email studentId")
      .populate({
        path: "booking",
        populate: { path: "room", select: "roomNumber building" },
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
