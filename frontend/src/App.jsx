
import { Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <AuthProvider>
      {/* Navigation Sidebar */}
      <Navbar />

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
