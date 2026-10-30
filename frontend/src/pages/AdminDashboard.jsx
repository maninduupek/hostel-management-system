import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BedDouble, Building2, CalendarCheck, CheckCircle2, Clock3, CreditCard, LayoutGrid, MessageSquare, RefreshCw, ShieldCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
const formatMoney = (value) => `LKR ${formatNumber(value)}`;
const labelStatus = (value) => ({ pending: "Pending", approved: "Approved", rejected: "Rejected", checked_out: "Checked Out", open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed", paid: "Paid" }[value] || value || "Unknown");
const chartColors = ["#6366f1", "#22c55e", "#f16a32", "#ef4444", "#06b6d4", "#a855f7"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = async (initial = false) => {
    try {
      initial ? setLoading(true) : setRefreshing(true);
      const results = await Promise.allSettled([api.get("/dashboard/stats"), api.get("/bookings"), api.get("/payments"), api.get("/complaints")]);
      if (results[0].status !== "fulfilled") throw results[0].reason;
      setStats(results[0].value.data);
      if (results[1].status === "fulfilled" && Array.isArray(results[1].value.data)) setBookings(results[1].value.data);
      if (results[2].status === "fulfilled" && Array.isArray(results[2].value.data)) setPayments(results[2].value.data);
      if (results[3].status === "fulfilled" && Array.isArray(results[3].value.data)) setComplaints(results[3].value.data);
      setError("");
    } catch (err) { setError(err.response?.data?.message || "Unable to load dashboard statistics."); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchDashboard(true); }, []);
  const values = useMemo(() => ({ totalRooms: Number(stats?.totalRooms || 0), availableRooms: Number(stats?.availableRooms || 0), fullRooms: Number(stats?.fullRooms || 0), totalStudents: Number(stats?.totalStudents || 0), occupancyRate: Number(stats?.occupancyRate || 0), totalRevenue: Number(stats?.totalRevenue || 0), pendingBookings: Number(stats?.pendingBookings || 0), approvedBookings: Number(stats?.approvedBookings || 0), activeComplaints: Number(stats?.openComplaints || 0) + Number(stats?.inProgressComplaints || 0) }), [stats]);
  const roomData = [{ name: "Available", value: values.availableRooms }, { name: "Full", value: values.fullRooms }];
  const bookingData = [{ name: "Pending", value: values.pendingBookings }, { name: "Approved", value: values.approvedBookings }];
  const complaintData = [{ name: "Open", value: Number(stats?.openComplaints || 0) }, { name: "In progress", value: Number(stats?.inProgressComplaints || 0) }];
  const categoryData = (stats?.complaintsByCategory || []).map((item) => ({ name: item._id || "Other", value: Number(item.count || 0) }));
  const paymentData = useMemo(() => [{ name: "Paid", value: payments.filter((payment) => payment.status === "paid").length }, { name: "Pending", value: payments.filter((payment) => payment.status === "pending").length }, { name: "Failed", value: payments.filter((payment) => payment.status === "failed").length }].filter((item) => item.value > 0), [payments]);
  const recentBookings = bookings.slice(0, 5);
  const recentComplaints = complaints.slice(0, 4);
  const adminName = user?.name || "Administrator";

  if (loading && !stats) return <div className="page"><div className="dashboard-loading">Loading dashboard...</div></div>;
  if (!stats) return <div className="page"><p className="error-text">{error}</p><button className="btn btn-primary" onClick={() => fetchDashboard(true)}>Try Again</button></div>;

  return <div className="portal-page admin-portal">
    <section className="portal-hero admin-hero"><div className="portal-hero-content"><span className="portal-eyebrow"><ShieldCheck size={15} /> OPERATIONS COMMAND CENTER</span><h1>Accommodation<br /><em>Management Center.</em></h1><p>Good morning, {adminName}. Keep rooms, bookings, payments, and student support moving with one clear operational view.</p><div className="portal-hero-actions"><Link to="/rooms" className="portal-button portal-button-light">Manage rooms <ArrowRight size={17} /></Link><Link to="/bookings" className="portal-button portal-button-ghost">Review bookings <ChevronIcon /></Link></div></div><div className="portal-scroll-hint"><span>Scroll through your overview</span><ArrowDownIcon /></div></section>
    {error && <div className="portal-alert"><AlertCircle size={18} />{error}</div>}

    <section id="admin-overview" className="portal-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">MANAGEMENT OVERVIEW</span><h2>Everything important, together.</h2><p>A real-time snapshot of your accommodation operation.</p></div><button type="button" className="portal-icon-button" onClick={() => fetchDashboard()} disabled={refreshing} aria-label="Refresh dashboard"><RefreshCw size={17} /></button></div><div className="portal-stat-grid admin-stat-grid"><AdminStat icon={Building2} title="Total rooms" value={formatNumber(values.totalRooms)} note="Registered accommodation" color="purple" /><AdminStat icon={BedDouble} title="Available rooms" value={formatNumber(values.availableRooms)} note="Ready for allocation" color="green" /><AdminStat icon={TrendingUp} title="Occupancy rate" value={`${values.occupancyRate}%`} note="Current bed occupancy" color="blue" /><AdminStat icon={Users} title="Total students" value={formatNumber(values.totalStudents)} note="Registered students" color="orange" /><AdminStat icon={Wallet} title="Total revenue" value={formatMoney(values.totalRevenue)} note="Recorded payments" color="green" /><AdminStat icon={Clock3} title="Pending bookings" value={formatNumber(values.pendingBookings)} note="Awaiting approval" color="orange" /><AdminStat icon={CalendarCheck} title="Approved bookings" value={formatNumber(values.approvedBookings)} note="Confirmed requests" color="purple" /><AdminStat icon={AlertCircle} title="Active complaints" value={formatNumber(values.activeComplaints)} note="Open and in progress" color="red" /></div></section>

    <section id="occupancy-analytics" className="portal-section portal-dark-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">OCCUPANCY ANALYTICS</span><h2>See the pressure points early.</h2><p>Use the live room and booking mix to plan the next move.</p></div></div><div className="admin-chart-grid"><div className="portal-chart-card"><div className="portal-card-heading"><div><h3>Room occupancy</h3><p>Available versus full rooms</p></div><Building2 size={19} /></div>{values.totalRooms ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={roomData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={102} paddingAngle={4}>{roomData.map((item, index) => <Cell key={item.name} fill={index ? "#f16a32" : "#22c55e"} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <EmptyChart text="No room data available." />}</div><div className="portal-chart-card"><div className="portal-card-heading"><div><h3>Booking pipeline</h3><p>Requests requiring attention</p></div><CalendarCheck size={19} /></div>{values.pendingBookings + values.approvedBookings ? <ResponsiveContainer width="100%" height={280}><BarChart data={bookingData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334566" /><XAxis dataKey="name" stroke="#b9c3d8" /><YAxis allowDecimals={false} stroke="#b9c3d8" /><Tooltip /><Bar dataKey="value" radius={[8, 8, 0, 0]}>{bookingData.map((item, index) => <Cell key={item.name} fill={index ? "#6366f1" : "#f16a32"} />)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart text="No booking requests yet." />}</div><div className="portal-chart-card"><div className="portal-card-heading"><div><h3>Complaint activity</h3><p>Open and in-progress issues</p></div><AlertCircle size={19} /></div>{values.activeComplaints ? <ResponsiveContainer width="100%" height={280}><BarChart data={complaintData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334566" /><XAxis dataKey="name" stroke="#b9c3d8" /><YAxis allowDecimals={false} stroke="#b9c3d8" /><Tooltip /><Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart text="No active complaints." />}</div>{categoryData.length > 0 && <div className="portal-chart-card"><div className="portal-card-heading"><div><h3>Complaints by category</h3><p>Distribution across service areas</p></div><TrendingUp size={19} /></div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={92}>{categoryData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}</div></section>

    <section id="booking-preview" className="portal-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">BOOKING MANAGEMENT</span><h2>Requests at a glance.</h2><p>Review the latest student room requests before opening the full directory.</p></div><Link to="/bookings" className="portal-text-link">Open booking directory <ArrowRight size={16} /></Link></div><div className="admin-list-card">{recentBookings.length ? recentBookings.map((booking) => <div className="admin-list-row" key={booking._id}><span className="admin-list-icon"><BedDouble size={17} /></span><div><strong>Room {booking.room?.roomNumber || "N/A"}</strong><small>{booking.student?.name || "Student request"} · {booking.semester || "Current semester"}</small></div><span className={`portal-status portal-status-${booking.status}`}>{labelStatus(booking.status)}</span><Link to="/bookings" className="admin-row-link">Manage <ArrowRight size={15} /></Link></div>) : <div className="portal-empty-state"><CalendarCheck size={28} /><p>No booking requests are available yet.</p></div>}</div></section>

    <section id="revenue" className="portal-section portal-beige-section"><div className="portal-feature-grid"><div><span className="portal-eyebrow">REVENUE & PAYMENTS</span><h2>Financial clarity for every semester.</h2><p>Track recorded revenue and payment outcomes from the existing payment ledger.</p><strong className="admin-revenue-value">{formatMoney(values.totalRevenue)}</strong><span className="admin-revenue-label">Total recorded revenue</span><Link to="/payments" className="portal-button portal-button-dark">View payments <ArrowRight size={17} /></Link></div><div className="portal-chart-card portal-chart-card-light"><div className="portal-card-heading"><div><h3>Payment status</h3><p>Current payment outcomes</p></div><CreditCard size={19} /></div>{paymentData.length ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88}>{paymentData.map((item, index) => <Cell key={item.name} fill={chartColors[index]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <EmptyChart text="No payment records available." />}</div></div></section>

    <section id="complaints" className="portal-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">STUDENT SUPPORT</span><h2>Close the loop on every issue.</h2><p>Prioritize the most recent student requests and keep service visible.</p></div><Link to="/complaints" className="portal-text-link">Manage complaints <ArrowRight size={16} /></Link></div><div className="admin-complaint-grid">{recentComplaints.length ? recentComplaints.map((complaint) => <article className="admin-complaint-card" key={complaint._id}><div className="admin-complaint-top"><span className="admin-list-icon"><MessageSquare size={17} /></span><span className={`portal-status portal-status-${complaint.status}`}>{labelStatus(complaint.status)}</span></div><h3>{complaint.title}</h3><p>{complaint.description}</p><div><span>{complaint.category || "General"}</span><b>{complaint.priority || "medium"} priority</b></div></article>) : <div className="portal-empty-state"><CheckCircle2 size={28} /><p>No complaints are available yet.</p></div>}</div></section>

    <section id="quick-actions" className="portal-section portal-dark-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">QUICK MANAGEMENT ACTIONS</span><h2>Move work forward.</h2></div></div><div className="admin-action-grid">{[["Add room", "Create new accommodation inventory", "/rooms", Building2], ["Manage rooms", "Review capacity and availability", "/rooms", BedDouble], ["Manage bookings", "Approve or check out students", "/bookings", CalendarCheck], ["View payments", "Review the payment ledger", "/payments", CreditCard], ["Manage complaints", "Resolve student support requests", "/complaints", MessageSquare]].map(([title, copy, path, Icon]) => <Link to={path} className="admin-action-card" key={title}><span><Icon size={21} /></span><div><h3>{title}</h3><p>{copy}</p></div><ArrowRight size={18} /></Link>)}</div></section>

    <footer className="portal-footer"><div><Link to="/admin" className="portal-footer-brand"><Building2 size={22} /> Hostel MS</Link><p>A calm operational center for better university accommodation.</p></div><div className="portal-footer-links"><Link to="/rooms">Rooms</Link><Link to="/bookings">Bookings</Link><Link to="/payments">Payments</Link><Link to="/complaints">Support</Link></div><span>© {new Date().getFullYear()} Hostel Management System</span></footer>
  </div>;
};

const AdminStat = ({ icon: Icon, title, value, note, color }) => <article className="portal-stat-card"><span className={`portal-stat-icon ${color}`}><Icon size={21} /></span><strong>{value}</strong><span>{title}</span><small>{note}</small></article>;
const EmptyChart = ({ text }) => <div className="portal-chart-empty">{text}</div>;
const ChevronIcon = () => <ArrowRight size={17} />;
const ArrowDownIcon = () => <span className="portal-arrow-down"><ArrowRight size={17} /></span>;

export default AdminDashboard;
