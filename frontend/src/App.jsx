
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Authentication
import Login from "./pages/Login";
import Register from "./pages/Register";

// Management Pages
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";

// 404 Page
import NotFound from "./pages/NotFound";

// Redirect users to the correct dashboard
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin" || user.role === "warden") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
};

const ScrollRevealObserver = () => {
  const location = useLocation();

  useEffect(() => {
    const targets = document.querySelectorAll(
      ".page > *, .page section, .page .card, .page .dashboard-stat-card, .page .student-stat-card, .portal-page > *, .portal-page section, .portal-page .portal-stat-card, .portal-page .portal-showcase-card, .portal-page .admin-action-card"
    );

    if (!targets.length) return undefined;

    targets.forEach((element) => element.classList.add("reveal-ready"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6%" }
    );

    targets.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      {/* Navigation Sidebar */}
      <Navbar />
      <ScrollRevealObserver />

      {/* Application Routes */}
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<HomeRedirect />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Admin / Warden Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "warden"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Dashboard */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Room Management */}
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />

        {/* Booking Management */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        {/* Complaints */}
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />

        {/* 404 - Page Not Found */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
