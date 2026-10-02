import { useEffect, useState } from "react";
import api from "../api/axios";
import StatCard from "../components/StatCard";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div className="page">Loading dashboard...</div>;

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <StatCard label="Total Rooms" value={stats.totalRooms} />
        <StatCard label="Available Rooms" value={stats.availableRooms} accent="green" />
        <StatCard label="Full Rooms" value={stats.fullRooms} accent="red" />
        <StatCard label="Occupancy Rate" value={`${stats.occupancyRate}%`} accent="blue" />
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Pending Bookings" value={stats.pendingBookings} accent="orange" />
        <StatCard label="Approved Bookings" value={stats.approvedBookings} accent="green" />
        <StatCard label="Total Revenue" value={`LKR ${stats.totalRevenue.toLocaleString()}`} accent="blue" />
        <StatCard label="Open Complaints" value={stats.openComplaints} accent="red" />
        <StatCard label="In-progress Complaints" value={stats.inProgressComplaints} accent="orange" />
      </div>

      <div className="card">
        <h3>Complaints by Category</h3>
        <ul className="simple-list">
          {stats.complaintsByCategory.map((c) => (
            <li key={c._id}>
              {c._id}: {c.count}
            </li>
          ))}
          {stats.complaintsByCategory.length === 0 && <li>No complaints recorded yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
