
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import {
  CalendarCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  LogOut,
  Search,
  RefreshCw,
  ClipboardList,
  Check,
  X,
  FilterX,
  UserRound,
  BedDouble,
} from "lucide-react";

import "./Bookings.css";

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const Bookings = () => {
  const { user } = useAuth();
  const isStaff =
    user?.role === "admin" || user?.role === "warden";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const { data } = await api.get("/bookings");

      if (!Array.isArray(data)) {
        throw new Error("Invalid bookings response");
      }

      setBookings(data);
      setError("");
    } catch (err) {
      console.error("Bookings API error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load bookings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const summary = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(
      (b) => b.status === "pending"
    ).length,
    approved: bookings.filter(
      (b) => b.status === "approved"
    ).length,
    rejected: bookings.filter(
      (b) => b.status === "rejected"
    ).length,
    checkedOut: bookings.filter(
      (b) => b.status === "checked_out"
    ).length,
  }), [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" ||
        booking.status === statusFilter;

      const searchableText = [
        booking.student?.name,
        booking.student?.email,
        booking.room?.roomNumber,
        booking.room?.building,
        booking.semester,
        booking.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus &&
        (!query || searchableText.includes(query));
    });
  }, [bookings, search, statusFilter]);

  const updateStatus = async (id, status) => {
    if (!isStaff || updatingId) return;

    const action = statusLabels[status] || status;

    if (
      !window.confirm(
        `Are you sure you want to mark this booking as ${action}?`
      )
    ) {
      return;
    }

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      await api.put(`/bookings/${id}/status`, { status });

      await fetchBookings();

      setMessage(`Booking updated to ${action} successfully!`);
    } catch (err) {
      console.error("Booking update error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update booking."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="page professional-bookings">
      {/* HEADER */}
      <div className="bookings-header">
        <div>
          <span className="bookings-eyebrow">
            HOSTEL MANAGEMENT
          </span>

          <h1>
            {isStaff ? "Booking Management" : "My Bookings"}
          </h1>

          <p>
            {isStaff
              ? "Review accommodation requests and manage room allocations."
              : "Track your accommodation requests and booking status."}
          </p>
        </div>

        <button
          type="button"
          className="bookings-refresh-btn"
          onClick={() => fetchBookings()}
          disabled={loading || refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* MESSAGES */}
      {message && (
        <div className="bookings-alert bookings-success" role="status">
          <CheckCircle2 size={19} />
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div className="bookings-alert bookings-error" role="alert">
          <XCircle size={19} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="bookings-summary-grid">
        <div className="bookings-summary-card">
          <div className="bookings-summary-icon purple">
            <ClipboardList size={22} />
          </div>
          <strong>{summary.total}</strong>
          <span>Total Bookings</span>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon orange">
            <Clock3 size={22} />
          </div>
          <strong>{summary.pending}</strong>
          <span>Pending</span>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon green">
            <CalendarCheck size={22} />
          </div>
          <strong>{summary.approved}</strong>
          <span>Approved</span>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon red">
            <XCircle size={22} />
          </div>
          <strong>{summary.rejected}</strong>
          <span>Rejected</span>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bookings-toolbar">
        <div className="bookings-search">
          <Search size={19} />
          <input
            type="search"
            placeholder={
              isStaff
                ? "Search student, room, semester..."
                : "Search room or semester..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bookings-filter-group">
          <select
            aria-label="Filter bookings by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            className="bookings-clear-btn"
            onClick={clearFilters}
          >
            <FilterX size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* TABLE */}
      <section className="bookings-table-panel">
        <div className="bookings-table-header">
          <div>
            <h2>Booking Directory</h2>
            <p>
              Showing {filteredBookings.length} of{" "}
              {bookings.length} bookings
            </p>
          </div>
          <span className="bookings-count">
            {filteredBookings.length} Records
          </span>
        </div>

        {loading ? (
          <div className="bookings-empty">
            <RefreshCw size={28} />
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bookings-empty">
            <ClipboardList size={36} />
            <h3>No Bookings Found</h3>
            <p>
              {bookings.length === 0
                ? "There are no booking records yet."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="bookings-table-scroll">
            <table className="bookings-table">
              <thead>
                <tr>
                  {isStaff && <th>Student</th>}
                  <th>Room</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Requested</th>
                  {isStaff && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    {isStaff && (
                      <td>
                        <div className="booking-person">
                          <span className="booking-person-icon">
                            <UserRound size={17} />
                          </span>
                          <span>
                            {booking.student?.name ||
                              "Unknown Student"}
                          </span>
                        </div>
                      </td>
                    )}

                    <td>
                      <div className="booking-room">
                        <BedDouble size={17} />
                        <div>
                          <strong>
                            {booking.room?.roomNumber ||
                              "Unknown Room"}
                          </strong>
                          {booking.room?.building && (
                            <small>
                              {booking.room.building}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>{booking.semester || "-"}</td>

                    <td>
                      <span
                        className={`booking-status booking-status-${booking.status}`}
                      >
                        <span className="booking-status-dot" />
                        {statusLabels[booking.status] ||
                          booking.status}
                      </span>
                    </td>

                    <td>{formatDate(booking.createdAt)}</td>

                    {isStaff && (
                      <td>
                        <div className="bookings-actions">
                          {booking.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="booking-action-approve"
                                disabled={updatingId !== null}
                                onClick={() =>
                                  updateStatus(
                                    booking._id,
                                    "approved"
                                  )
                                }
                              >
                                <Check size={15} />
                                Approve
                              </button>

                              <button
                                type="button"
                                className="booking-action-reject"
                                disabled={updatingId !== null}
                                onClick={() =>
                                  updateStatus(
                                    booking._id,
                                    "rejected"
                                  )
                                }
                              >
                                <X size={15} />
                                Reject
                              </button>
                            </>
                          )}

                          {booking.status === "approved" && (
                            <button
                              type="button"
                              className="booking-action-checkout"
                              disabled={updatingId !== null}
                              onClick={() =>
                                updateStatus(
                                  booking._id,
                                  "checked_out"
                                )
                              }
                            >
                              <LogOut size={15} />
                              {updatingId === booking._id
                                ? "Updating..."
                                : "Check Out"}
                            </button>
                          )}

                          {!["pending", "approved"].includes(
                            booking.status
                          ) && (
                            <span className="booking-no-action">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Bookings;
