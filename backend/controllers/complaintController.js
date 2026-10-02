import Complaint from "../models/Complaint.js";

// @desc Create complaint (student)
// @route POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const { roomId, category, title, description, priority } = req.body;
    const complaint = await Complaint.create({
      student: req.user._id,
      room: roomId,
      category,
      title,
      description,
      priority,
    });
    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get complaints (admin sees all, student sees own)
// @route GET /api/complaints
export const getComplaints = async (req, res) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user._id } : {};
    const complaints = await Complaint.find(filter)
      .populate("student", "name email studentId")
      .populate("room", "roomNumber building")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update complaint status (admin/warden)
// @route PUT /api/complaints/:id
export const updateComplaint = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = status || complaint.status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === "resolved" || status === "closed") complaint.resolvedBy = req.user._id;

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
