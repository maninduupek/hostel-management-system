import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "warden";

  const fetchBookings = async () => {
    const { data } = await api.get("/bookings");
    setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    fetchBookings();
  };

  return (
    <div className="page">
      <h1>{isStaff ? "All Bookings" : "My Bookings"}</h1>
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
            {bookings.map((b) => (
              <tr key={b._id}>
                {isStaff && <td>{b.student?.name}</td>}
                <td>{b.room?.roomNumber} ({b.room?.building})</td>
                <td>{b.semester}</td>
                <td>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </td>
                <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                {isStaff && (
                  <td className="actions">
                    {b.status === "pending" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => updateStatus(b._id, "approved")}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => updateStatus(b._id, "rejected")}>
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === "approved" && (
                      <button className="btn btn-sm btn-outline" onClick={() => updateStatus(b._id, "checked_out")}>
                        Check Out
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={isStaff ? 6 : 4}>No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
