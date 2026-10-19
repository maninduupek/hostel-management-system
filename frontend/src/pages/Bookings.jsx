
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const { user } = useAuth();

  const isStaff =
    user?.role === "admin" || user?.role === "warden";

  // Fetch bookings from backend
  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/bookings");

      console.log("Bookings API response:", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid bookings response");
      }

      setBookings(data);
    } catch (err) {
      console.error("Bookings API error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load bookings."
      );

      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update booking status (Admin / Warden)
  const updateStatus = async (id, status) => {
    if (!isStaff || updatingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${status.replace(
        "_",
        " "
      )} this booking?`
    );

    if (!confirmed) return;

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      await api.put(`/bookings/${id}/status`, {
        status,
      });

      setMessage(
        `Booking ${status.replace("_", " ")} successfully!`
      );

      await fetchBookings();
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

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="page">
      <h1>{isStaff ? "All Bookings" : "My Bookings"}</h1>

      {loading && <p>Loading bookings...</p>}

      {error && (
        <p className="error-text">{error}</p>
      )}

      {message && (
        <p className="info-text">{message}</p>
      )}

      {!loading && !error && (
        <div className="table-wrap">
          <table>
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
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  {isStaff && (
                    <td>
                      {booking.student?.name || "Unknown Student"}
                    </td>
                  )}

                  <td>
                    {booking.room?.roomNumber || "Unknown Room"}
                    {booking.room?.building
                      ? ` (${booking.room.building})`
                      : ""}
                  </td>

                  <td>{booking.semester}</td>

                  <td>
                    <span
                      className={`badge badge-${booking.status}`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>

                  <td>{formatDate(booking.createdAt)}</td>

                  {isStaff && (
                    <td className="actions">
                      {booking.status === "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={updatingId !== null}
                            onClick={() =>
                              updateStatus(booking._id, "approved")
                            }
                          >
                            {updatingId === booking._id
                              ? "Updating..."
                              : "Approve"}
                          </button>

                          <button
                            className="btn btn-sm btn-outline"
                            disabled={updatingId !== null}
                            onClick={() =>
                              updateStatus(booking._id, "rejected")
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {booking.status === "approved" && (
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={updatingId !== null}
                          onClick={() =>
                            updateStatus(
                              booking._id,
                              "checked_out"
                            )
                          }
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 6 : 4}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bookings;
