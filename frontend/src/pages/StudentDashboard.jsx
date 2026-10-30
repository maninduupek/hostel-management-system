import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, BedDouble, Building2, ChevronRight, ClipboardList, CreditCard, MessageSquare, RefreshCw, Search, Sparkles, Wallet, AlertCircle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./StudentDashboard.css";

const formatMoney = (amount) => `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
const formatDate = (value) => { if (!value) return "N/A"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); };
const formatStatus = (status) => ({ pending: "Pending", approved: "Approved", rejected: "Rejected", checked_out: "Checked Out", open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed", paid: "Paid" }[status] || status || "Unknown");

const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (initial = false) => {
    try {
      initial ? setLoading(true) : setRefreshing(true);
      const results = await Promise.allSettled([api.get("/bookings"), api.get("/payments"), api.get("/complaints"), api.get("/rooms")]);
      const setters = [setBookings, setPayments, setComplaints, setRooms];
      const labels = ["bookings", "payments", "complaints", "rooms"];
      const failed = [];
      results.forEach((result, index) => { if (result.status === "fulfilled" && Array.isArray(result.value.data)) setters[index](result.value.data); else failed.push(labels[index]); });
      setError(failed.length ? `Unable to load ${failed.join(", ")}. Please try refreshing.` : "");
    } catch (err) { setError(err.response?.data?.message || "Something went wrong while loading your dashboard."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDashboard(true); }, [fetchDashboard]);
  const activeBooking = useMemo(() => bookings.find((booking) => booking.status === "approved") || bookings.find((booking) => booking.status === "pending") || null, [bookings]);
  const stats = useMemo(() => { const paid = payments.filter((payment) => payment.status === "paid"); return { totalBookings: bookings.length, totalPaid: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), successfulPayments: paid.length, activeComplaints: complaints.filter((complaint) => ["open", "in_progress"].includes(complaint.status)).length, resolvedComplaints: complaints.filter((complaint) => complaint.status === "resolved").length }; }, [bookings, payments, complaints]);
  const latestPayment = useMemo(() => [...payments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0], [payments]);
  const firstName = user?.name?.split(" ")[0] || "Student";
  const showcaseRooms = rooms.slice(0, 3);

  return (
    <div className="portal-page student-portal">
      <section className="portal-hero student-hero" aria-labelledby="student-hero-title"><div className="portal-hero-content"><span className="portal-eyebrow"><Sparkles size={15} /> STUDENT ACCOMMODATION PORTAL</span><h1 id="student-hero-title">Your Campus.<br /><em>Your Space.</em></h1><p>Welcome back, {firstName}. Find your place on campus, manage your stay, and keep every hostel detail in one calm, connected space.</p><div className="portal-hero-actions"><Link to="/rooms" className="portal-button portal-button-light">Explore Rooms <ArrowRight size={17} /></Link><Link to="/bookings" className="portal-button portal-button-ghost">My Bookings <ChevronRight size={17} /></Link></div></div><div className="portal-scroll-hint"><span>Scroll to explore</span><ArrowDown size={17} /></div></section>
      {error && <div className="portal-alert"><AlertCircle size={18} />{error}</div>}

      <section id="overview" className="portal-section portal-overview-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">YOUR STAY AT A GLANCE</span><h2>Accommodation overview</h2></div><button type="button" className="portal-icon-button" onClick={() => fetchDashboard()} disabled={loading || refreshing} aria-label="Refresh dashboard"><RefreshCw size={17} /></button></div><div className="portal-stat-grid"><article className="portal-stat-card"><span className="portal-stat-icon purple"><ClipboardList size={21} /></span><strong>{loading ? "..." : stats.totalBookings}</strong><span>Total bookings</span><small>All room requests</small></article><article className="portal-stat-card"><span className="portal-stat-icon blue"><BedDouble size={21} /></span><strong>{loading ? "..." : activeBooking?.room?.roomNumber || "—"}</strong><span>Current room</span><small>{activeBooking ? formatStatus(activeBooking.status) : "No active booking"}</small></article><article className="portal-stat-card"><span className="portal-stat-icon green"><Wallet size={21} /></span><strong className="portal-stat-money">{loading ? "..." : formatMoney(stats.totalPaid)}</strong><span>Total paid</span><small>{stats.successfulPayments} successful payments</small></article><article className="portal-stat-card"><span className="portal-stat-icon orange"><MessageSquare size={21} /></span><strong>{loading ? "..." : stats.activeComplaints}</strong><span>Active complaints</span><small>{stats.resolvedComplaints} resolved</small></article></div></section>

      <section id="accommodation" className="portal-section portal-split-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">YOUR CURRENT ACCOMMODATION</span><h2>Make yourself at home.</h2><p>Your approved or pending room request, always within reach.</p></div><Link to="/bookings" className="portal-text-link">View booking details <ArrowRight size={16} /></Link></div><div className="portal-accommodation-card">{activeBooking ? <><div className="portal-room-mark"><Building2 size={28} /></div><div className="portal-room-main"><span className="portal-card-kicker">{activeBooking.status === "approved" ? "APPROVED ACCOMMODATION" : "REQUESTED ACCOMMODATION"}</span><h3>Room {activeBooking.room?.roomNumber || "N/A"}</h3><p>{activeBooking.room?.building || "Hostel building"} · Floor {activeBooking.room?.floor ?? "N/A"}</p></div><span className={`portal-status portal-status-${activeBooking.status}`}>{formatStatus(activeBooking.status)}</span><div className="portal-room-details"><div><span>Room type</span><strong>{activeBooking.room?.type || "N/A"}</strong></div><div><span>Semester fee</span><strong>{activeBooking.room?.pricePerSemester != null ? formatMoney(activeBooking.room.pricePerSemester) : "N/A"}</strong></div><div><span>Booking date</span><strong>{formatDate(activeBooking.createdAt)}</strong></div></div></> : <div className="portal-empty-state"><span className="portal-empty-icon"><Search size={25} /></span><div><h3>Your next room starts here.</h3><p>You do not have an active booking yet. Explore available rooms and submit your request.</p></div><Link to="/rooms" className="portal-button portal-button-dark">Browse rooms <ArrowRight size={16} /></Link></div>}</div></section>

      <section id="rooms-showcase" className="portal-section portal-dark-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">EXPLORE HOSTEL ROOMS</span><h2>Find your everyday base.</h2><p>Real room availability from your hostel directory.</p></div><Link to="/rooms" className="portal-text-link portal-text-link-light">View all rooms <ArrowRight size={16} /></Link></div><div className="portal-room-grid">{loading ? <div className="portal-empty-state portal-empty-dark">Loading available rooms...</div> : showcaseRooms.length ? showcaseRooms.map((room) => <article className="portal-showcase-card" key={room._id}><div className="portal-showcase-top"><span className="portal-room-number">Room {room.roomNumber}</span><span className={`portal-status portal-status-${room.status}`}>{formatStatus(room.status)}</span></div><h3>{room.type || "Hostel room"}</h3><p>{room.building || "Hostel building"} · Floor {room.floor ?? "N/A"}</p><div className="portal-showcase-meta"><span><BedDouble size={15} /> Capacity {room.capacity ?? "N/A"}</span><strong>{formatMoney(room.pricePerSemester)}<small>/semester</small></strong></div><Link to="/rooms" className="portal-card-link">View details <ArrowRight size={15} /></Link></article>) : <div className="portal-empty-state portal-empty-dark"><BedDouble size={28} /><p>No rooms are available to display right now.</p></div>}</div></section>

      <section id="journey" className="portal-section"><div className="portal-section-heading"><div><span className="portal-eyebrow">THE BOOKING JOURNEY</span><h2>From search to settled.</h2><p>A simple path to a better campus living experience.</p></div></div><div className="portal-journey">{[["01", "Explore rooms", "Browse real room availability."], ["02", "Submit booking", "Choose a room and send your request."], ["03", "Admin approval", "Your warden reviews the request."], ["04", "Demo payment", "Complete the secure demo checkout."], ["05", "Enjoy your stay", "Settle into your campus space."]].map(([number, title, copy], index) => <div className="portal-journey-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>{index < 4 && <ChevronRight className="portal-journey-arrow" size={20} />}</div>)}</div></section>

      <section id="payments-overview" className="portal-section portal-beige-section"><div className="portal-feature-grid"><div><span className="portal-eyebrow">PAYMENTS OVERVIEW</span><h2>Everything accounted for.</h2><p>Review your demo payment activity and keep your semester planning clear.</p><Link to="/payments" className="portal-button portal-button-dark">Open payment history <ArrowRight size={17} /></Link></div><div className="portal-payment-card"><div className="portal-payment-card-top"><CreditCard size={22} /><span>HOSTELMS / DEMO</span></div><strong>{formatMoney(stats.totalPaid)}</strong><span>Total paid to date</span><div className="portal-payment-row"><span>Latest payment</span><strong>{latestPayment ? formatMoney(latestPayment.amount) : "No payments yet"}</strong></div><div className="portal-payment-row"><span>Status</span><b className={`portal-status portal-status-${latestPayment?.status || "pending"}`}>{formatStatus(latestPayment?.status || "pending")}</b></div></div></div></section>

      <section id="support" className="portal-section portal-support-section"><div className="portal-support-card"><div><span className="portal-eyebrow">MAINTENANCE & SUPPORT</span><h2>Help keeping campus life comfortable.</h2><p>Raise an issue, follow its progress, and stay informed as the hostel team responds.</p></div><div className="portal-support-actions"><div className="portal-support-stat"><strong>{stats.activeComplaints}</strong><span>Active complaints</span></div><div className="portal-support-stat"><strong>{stats.resolvedComplaints}</strong><span>Resolved complaints</span></div><Link to="/complaints" className="portal-button portal-button-light">View complaints <ArrowRight size={17} /></Link></div></div></section>

      <footer className="portal-footer"><div><Link to="/student" className="portal-footer-brand"><Building2 size={22} /> Hostel MS</Link><p>A calmer, more connected way to manage university accommodation.</p></div><div className="portal-footer-links"><Link to="/rooms">Rooms</Link><Link to="/bookings">Bookings</Link><Link to="/payments">Payments</Link><Link to="/complaints">Support</Link></div><span>© {new Date().getFullYear()} Hostel Management System</span></footer>
    </div>
  );
};

export default StudentDashboard;
