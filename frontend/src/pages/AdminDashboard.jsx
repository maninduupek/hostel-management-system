
import { useEffect, useState } from "react";
import api from "../api/axios";

import {
  Building2,
  BedDouble,
  Users,
  CalendarCheck,
  Clock3,
  Wallet,
  AlertCircle,
  Activity,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./AdminDashboard.css";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US");

const formatMoney = (value) =>
  `LKR ${formatNumber(value)}`;

function DashboardCard({
  title,
  value,
  icon: Icon,
  color = "purple",
  subtitle,
}) {
  return (
    <div className={`dashboard-stat-card ${color}`}>
      <div className="dashboard-stat-top">
        <div className={`dashboard-icon ${color}`}>
          <Icon size={21} />
        </div>
      </div>

      <h2>{value}</h2>
      <p>{title}</p>

      {subtitle && (
        <span className="dashboard-stat-subtitle">
          {subtitle}
        </span>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/dashboard/stats");

      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="page">
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <p className="error-text">{error}</p>
        <button
          className="btn btn-primary"
          onClick={fetchStats}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Actual backend statistics
  const totalRooms = Number(stats.totalRooms || 0);
  const availableRooms = Number(stats.availableRooms || 0);
  const fullRooms = Number(stats.fullRooms || 0);
  const totalStudents = Number(stats.totalStudents || 0);

  const pendingBookings = Number(
    stats.pendingBookings || 0
  );

  const approvedBookings = Number(
    stats.approvedBookings || 0
  );

  const totalRevenue = Number(
    stats.totalRevenue || 0
  );

  const openComplaints = Number(
    stats.openComplaints || 0
  );

  const inProgressComplaints = Number(
    stats.inProgressComplaints || 0
  );

  const occupancyRate = Number(
    stats.occupancyRate || 0
  );

  // Room status chart: counts of full and non-full rooms.
  // This is different from the bed occupancy rate.
  const roomData = [
    { name: "Available Rooms", value: availableRooms },
    { name: "Full Rooms", value: fullRooms },
  ];

  // Booking chart
  const bookingData = [
    { name: "Pending", count: pendingBookings },
    { name: "Approved", count: approvedBookings },
  ];

  // Complaint chart
  const complaintData = [
    { name: "Open", count: openComplaints },
    { name: "In Progress", count: inProgressComplaints },
  ];

  // Complaint categories from backend
  const categoryData = (
    stats.complaintsByCategory || []
  ).map((item) => ({
    name: item._id || "Other",
    value: Number(item.count || 0),
  }));

  const totalBookings =
    pendingBookings + approvedBookings;

  const activeComplaints =
    openComplaints + inProgressComplaints;

  return (
    <div className="page professional-dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            MANAGEMENT OVERVIEW
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor hostel rooms, students, bookings,
            payments and complaints.
          </p>
        </div>

        <button
          className="dashboard-refresh-btn"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="error-text">{error}</p>
      )}

      {/* SUMMARY CARDS */}
      <div className="dashboard-summary-grid">

        <DashboardCard
          title="Total Rooms"
          value={formatNumber(totalRooms)}
          icon={Building2}
          color="purple"
          subtitle="Registered hostel rooms"
        />

        <DashboardCard
          title="Available Rooms"
          value={formatNumber(availableRooms)}
          icon={BedDouble}
          color="green"
          subtitle="Rooms not at full capacity"
        />

        <DashboardCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={Activity}
          color="blue"
          subtitle="Current bed occupancy"
        />

        <DashboardCard
          title="Total Students"
          value={formatNumber(totalStudents)}
          icon={Users}
          color="orange"
          subtitle="Registered students"
        />

        <DashboardCard
          title="Total Revenue"
          value={formatMoney(totalRevenue)}
          icon={Wallet}
          color="green"
          subtitle="Recorded payment revenue"
        />

        <DashboardCard
          title="Approved Bookings"
          value={formatNumber(approvedBookings)}
          icon={CalendarCheck}
          color="purple"
          subtitle="Approved room requests"
        />

        <DashboardCard
          title="Pending Bookings"
          value={formatNumber(pendingBookings)}
          icon={Clock3}
          color="orange"
          subtitle="Awaiting approval"
        />

        <DashboardCard
          title="Active Complaints"
          value={formatNumber(activeComplaints)}
          icon={AlertCircle}
          color="red"
          subtitle="Open and in-progress issues"
        />

      </div>

      {/* CHART SECTION */}
      <div className="dashboard-chart-grid">

        {/* ROOM STATUS PIE CHART */}
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <div>
              <h3>Room Availability</h3>
              <p>Available and full rooms</p>
            </div>
            <Building2 size={19} />
          </div>

          {availableRooms + fullRooms > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <PieChart>
                  <Pie
                    data={roomData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="chart-empty">
              No room data available.
            </p>
          )}
        </div>

        {/* BOOKINGS BAR CHART */}
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <div>
              <h3>Booking Overview</h3>
              <p>Current booking status</p>
            </div>
            <CalendarCheck size={19} />
          </div>

          {totalBookings > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <BarChart data={bookingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="name" />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Bookings"
                    radius={[7, 7, 0, 0]}
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#6366f1" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="chart-empty">
              No pending or approved bookings.
            </p>
          )}
        </div>

        {/* COMPLAINT STATUS CHART */}
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <div>
              <h3>Active Complaints</h3>
              <p>Open and in-progress complaints</p>
            </div>
            <AlertCircle size={19} />
          </div>

          {activeComplaints > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <BarChart data={complaintData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Complaints"
                    fill="#ef4444"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-empty-success">
              <CalendarCheck size={32} />
              <h4>No Active Complaints</h4>
              <p>
                All recorded complaints are
                currently closed or resolved.
              </p>
            </div>
          )}
        </div>

        {/* COMPLAINT CATEGORY CHART */}
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <div>
              <h3>Complaints by Category</h3>
              <p>Distribution across categories</p>
            </div>
            <TrendingUp size={19} />
          </div>

          {categoryData.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                  >
                    {categoryData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="chart-empty">
              No complaints recorded yet.
            </p>
          )}
        </div>

      </div>

      {/* LOWER SUMMARY */}
      <div className="dashboard-bottom-grid">

        <div className="dashboard-info-card">
          <h3>Hostel Overview</h3>

          <div className="dashboard-info-row">
            <span>Total Rooms</span>
            <strong>{totalRooms}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Full Rooms</span>
            <strong>{fullRooms}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Available Rooms</span>
            <strong>{availableRooms}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Occupancy Rate</span>
            <strong>{occupancyRate}%</strong>
          </div>
        </div>

        <div className="dashboard-info-card">
          <h3>Financial & Booking Summary</h3>

          <div className="dashboard-info-row">
            <span>Total Revenue</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Approved Bookings</span>
            <strong>{approvedBookings}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Pending Bookings</span>
            <strong>{pendingBookings}</strong>
          </div>

          <div className="dashboard-info-row">
            <span>Active Complaints</span>
            <strong>{activeComplaints}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
