import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    api.get("/bookings").then(({ data }) => {
      const active = data.find((b) => ["pending", "approved"].includes(b.status));
      setBooking(active || null);
    });
  }, []);

  return (
    <div className="page">
      <h1>Welcome, {user?.name}</h1>
      <div className="card">
        <h3>Your Accommodation Status</h3>
        {booking ? (
          <>
            <p>Room: {booking.room?.roomNumber} ({booking.room?.building})</p>
            <p>Status: <span className={`badge badge-${booking.status}`}>{booking.status}</span></p>
            <p>Semester: {booking.semester}</p>
          </>
        ) : (
          <>
            <p>You don't have an active booking yet.</p>
            <Link className="btn btn-primary" to="/rooms">Browse Rooms</Link>
          </>
        )}
      </div>
      <div className="quick-links">
        <Link className="card link-card" to="/rooms">🏠 Browse Rooms</Link>
        <Link className="card link-card" to="/bookings">📋 My Bookings</Link>
        <Link className="card link-card" to="/payments">💳 Payments</Link>
        <Link className="card link-card" to="/complaints">🛠️ Complaints</Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
