
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BedDouble,
  Building2,
  CalendarDays,
  CreditCard,
  Wallet,
  MessageSquare,
  ClipboardList,
  ArrowRight,
  RefreshCw,
  Clock3,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./StudentDashboard.css";

// Format currency
const formatMoney = (amount) => {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
};

// Format date
const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Display status nicely
const formatStatus = (status) => {
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    checked_out: "Checked Out",
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    paid: "Paid",
  };

  return labels[status] || status || "Unknown";
};

const StudentDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch dashboard information
  const fetchDashboard = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const results = await Promise.allSettled([
        api.get("/bookings"),
        api.get("/payments"),
        api.get("/complaints"),
      ]);

      const failed = [];

      if (
        results[0].status === "fulfilled" &&
        Array.isArray(results[0].value.data)
      ) {
        setBookings(results[0].value.data);
      } else {
        failed.push("bookings");
      }

      if (
        results[1].status === "fulfilled" &&
        Array.isArray(results[1].value.data)
      ) {
        setPayments(results[1].value.data);
      } else {
        failed.push("payments");
      }

      if (
        results[2].status === "fulfilled" &&
        Array.isArray(results[2].value.data)
      ) {
        setComplaints(results[2].value.data);
      } else {
        failed.push("complaints");
      }

      if (failed.length > 0) {
        setError(
          `Unable to load ${failed.join(", ")}. Please try refreshing.`
        );
      } else {
        setError("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  // Find active booking
  const activeBooking = useMemo(() => {
    const approved = bookings.find(
      (booking) => booking.status === "approved"
    );

    const pending = bookings.find(
      (booking) => booking.status === "pending"
    );

    return approved || pending || null;
  }, [bookings]);

  // Calculate statistics
  const stats = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) => payment.status === "paid"
    );

    return {
      totalBookings: bookings.length,

      approvedBookings: bookings.filter(
        (booking) => booking.status === "approved"
      ).length,

      totalPaid: paidPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),

      successfulPayments: paidPayments.length,

      activeComplaints: complaints.filter((complaint) =>
        ["open", "in_progress"].includes(complaint.status)
      ).length,

      resolvedComplaints: complaints.filter(
        (complaint) => complaint.status === "resolved"
      ).length,
    };
  }, [bookings, payments, complaints]);

  // Recent bookings
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 4);
  }, [bookings]);

  // Recent complaints
  const recentComplaints = useMemo(() => {
    return [...complaints]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 3);
  }, [complaints]);

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className="page student-dashboard">
      {/* HEADER */}
      <div className="student-dashboard-header">
        <div>
          <span className="student-dashboard-eyebrow">
            STUDENT PORTAL
          </span>

          <h1>Welcome back, {firstName}!</h1>

          <p>
            Manage your accommodation and stay updated
            with your hostel activities.
          </p>
        </div>

        <button
          type="button"
          className="student-dashboard-refresh"
          onClick={() => fetchDashboard()}
          disabled={loading || refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="student-dashboard-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* STATISTICS */}
      <div className="student-stats-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon purple">
            <ClipboardList size={22} />
          </div>

          <strong>
            {loading ? "..." : stats.totalBookings}
          </strong>

          <span>Total Bookings</span>

          <small>
            {stats.approvedBookings} approved bookings
          </small>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon blue">
            <BedDouble size={22} />
          </div>

          <strong>
            {loading
              ? "..."
              : activeBooking?.room?.roomNumber || "—"}
          </strong>

          <span>Current Room</span>

          <small>
            {activeBooking
              ? formatStatus(activeBooking.status)
              : "No active booking"}
          </small>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon green">
            <Wallet size={22} />
          </div>

          <strong className="student-stat-money">
            {loading ? "..." : formatMoney(stats.totalPaid)}
          </strong>

          <span>Total Payments</span>

          <small>
            {stats.successfulPayments} successful transactions
          </small>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon orange">
            <MessageSquare size={22} />
          </div>

          <strong>
            {loading ? "..." : stats.activeComplaints}
          </strong>

          <span>Active Complaints</span>

          <small>
            {stats.resolvedComplaints} resolved complaints
          </small>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="student-main-grid">
        {/* ACCOMMODATION */}
        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h2>
                <Building2 size={20} />
                My Accommodation
              </h2>

              <p>
                Your current hostel booking information
              </p>
            </div>

            <Link
              to="/bookings"
              className="student-text-link"
            >
              View Details
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="student-empty">
              Loading accommodation...
            </div>
          ) : activeBooking ? (
            <>
              <div className="student-room-highlight">
                <div className="student-room-icon">
                  <BedDouble size={28} />
                </div>

                <div className="student-room-info">
                  <span>
                    {activeBooking.status === "approved"
                      ? "YOUR APPROVED ROOM"
                      : "REQUESTED ROOM"}
                  </span>

                  <h3>
                    Room{" "}
                    {activeBooking.room?.roomNumber || "N/A"}
                  </h3>

                  <p>
                    {activeBooking.room?.building ||
                      "Hostel Building"}
                  </p>
                </div>

                <span
                  className={`student-status student-status-${activeBooking.status}`}
                >
                  {formatStatus(activeBooking.status)}
                </span>
              </div>

              <div className="student-room-details">
                <div>
                  <span>
                    <CalendarDays size={16} />
                    Semester
                  </span>

                  <strong>
                    {activeBooking.semester || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>
                    <CreditCard size={16} />
                    Semester Fee
                  </span>

                  <strong>
                    {activeBooking.room?.pricePerSemester != null
                      ? formatMoney(
                          activeBooking.room.pricePerSemester
                        )
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <span>
                    <Clock3 size={16} />
                    Booking Date
                  </span>

                  <strong>
                    {formatDate(activeBooking.createdAt)}
                  </strong>
                </div>
              </div>

              {activeBooking.status === "approved" ? (
                <Link
                  to="/payments"
                  className="student-primary-link"
                >
                  <CreditCard size={18} />
                  View Payments
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="student-pending-note">
                  <Clock3 size={18} />
                  Your booking is waiting for approval.
                </div>
              )}
            </>
          ) : (
            <div className="student-no-booking">
              <div className="student-no-booking-icon">
                <Search size={28} />
              </div>

              <h3>No Active Booking</h3>

              <p>
                You don't have an active booking yet.
                Browse available rooms to request
                your accommodation.
              </p>

              <Link
                to="/rooms"
                className="student-primary-link"
              >
                <BedDouble size={18} />
                Browse Available Rooms
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Access your hostel services</p>
            </div>
          </div>

          <div className="student-actions-list">
            <Link
              to="/rooms"
              className="student-action-item"
            >
              <span className="student-action-icon purple">
                <BedDouble size={20} />
              </span>

              <div>
                <strong>Browse Rooms</strong>
                <small>Find available accommodation</small>
              </div>

              <ArrowRight size={18} />
            </Link>

            <Link
              to="/bookings"
              className="student-action-item"
            >
              <span className="student-action-icon blue">
                <ClipboardList size={20} />
              </span>

              <div>
                <strong>My Bookings</strong>
                <small>Check your booking status</small>
              </div>

              <ArrowRight size={18} />
            </Link>

            <Link
              to="/payments"
              className="student-action-item"
            >
              <span className="student-action-icon green">
                <CreditCard size={20} />
              </span>

              <div>
                <strong>Payments</strong>
                <small>View and manage your payments</small>
              </div>

              <ArrowRight size={18} />
            </Link>

            <Link
              to="/complaints"
              className="student-action-item"
            >
              <span className="student-action-icon orange">
                <MessageSquare size={20} />
              </span>

              <div>
                <strong>Complaints</strong>
                <small>Report and track hostel issues</small>
              </div>

              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="student-bottom-grid">
        {/* RECENT BOOKINGS */}
        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h2>
                <ClipboardList size={20} />
                Recent Bookings
              </h2>

              <p>Your latest booking requests</p>
            </div>

            <Link
              to="/bookings"
              className="student-text-link"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="student-empty">
              Loading bookings...
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="student-empty">
              No booking history available.
            </div>
          ) : (
            <div className="student-activity-list">
              {recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="student-activity-item"
                >
                  <div className="student-activity-icon">
                    <BedDouble size={19} />
                  </div>

                  <div className="student-activity-content">
                    <strong>
                      Room{" "}
                      {booking.room?.roomNumber || "N/A"}
                    </strong>

                    <small>
                      {booking.semester || "N/A"}
                      {" • "}
                      {formatDate(booking.createdAt)}
                    </small>
                  </div>

                  <span
                    className={`student-status student-status-${booking.status}`}
                  >
                    {formatStatus(booking.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMPLAINT UPDATES */}
        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h2>
                <CheckCircle2 size={20} />
                Complaint Updates
              </h2>

              <p>Track your submitted complaints</p>
            </div>

            <Link
              to="/complaints"
              className="student-text-link"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="student-empty">
              Loading complaints...
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="student-empty">
              No complaints submitted yet.
            </div>
          ) : (
            <div className="student-activity-list">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="student-activity-item"
                >
                  <div className="student-activity-icon">
                    <MessageSquare size={19} />
                  </div>

                  <div className="student-activity-content">
                    <strong>{complaint.title}</strong>

                    <small>
                      {complaint.category}
                      {" • "}
                      {formatDate(complaint.createdAt)}
                    </small>
                  </div>

                  <span
                    className={`student-status student-status-${complaint.status}`}
                  >
                    {formatStatus(complaint.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
