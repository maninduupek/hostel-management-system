
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";

// @desc Create a secure mock payment
// @route POST /api/payments
// @access Student
export const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;

    // 1. Validate booking ID
    if (!bookingId) {
      return res.status(400).json({
        message: "Booking ID is required",
      });
    }

    // 2. Find booking and its room
    const booking = await Booking.findById(bookingId)
      .populate("room");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // 3. Verify booking ownership
    if (
      String(booking.student) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only pay for your own bookings",
      });
    }

    // 4. Check booking approval
    if (booking.status !== "approved") {
      return res.status(400).json({
        message:
          "Booking must be approved before payment",
      });
    }

    // 5. Verify room and actual price
    if (!booking.room) {
      return res.status(400).json({
        message: "Room information not found",
      });
    }

    const actualAmount = Number(
      booking.room.pricePerSemester
    );

    if (
      !Number.isFinite(actualAmount) ||
      actualAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid room payment amount",
      });
    }

    // 6. Validate submitted amount
    if (
      amount !== undefined &&
      amount !== null &&
      Number(amount) !== actualAmount
    ) {
      return res.status(400).json({
        message:
          `Payment amount must be LKR ${actualAmount}`,
      });
    }

    // 7. Prevent duplicate successful payments
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      status: "paid",
    });

    if (existingPayment) {
      return res.status(409).json({
        message: "This booking has already been paid",
      });
    }

    // 8. Validate payment method
    const allowedMethods = ["card"];

    const paymentMethod = method || "card";

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    // 9. Generate mock transaction reference
    const transactionRef =
      `TXN-${Date.now()}-${Math.floor(
        Math.random() * 1000000
      )}`;

    // 10. Create payment using SERVER amount
    const payment = await Payment.create({
      student: req.user._id,
      booking: booking._id,
      amount: actualAmount,
      method: paymentMethod,
      status: "paid",
      transactionRef,
      paidAt: new Date(),
    });

    return res.status(201).json(payment);

  } catch (error) {
    console.error("Create payment error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A payment already exists for this booking",
      });
    }

    return res.status(500).json({
      message: "Unable to process payment",
    });
  }
};

// @desc Get payments
// @route GET /api/payments
// @access Authenticated users
export const getPayments = async (req, res) => {
  try {
    // Students see only their own payments.
    // Admins and wardens retain existing access.
    const filter =
      req.user.role === "student"
        ? { student: req.user._id }
        : {};

    const payments = await Payment.find(filter)
      .populate("student", "name email studentId")
      .populate({
        path: "booking",
        populate: {
          path: "room",
          select: "roomNumber building",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(payments);

  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      message: "Failed to fetch payments",
    });
  }
};
