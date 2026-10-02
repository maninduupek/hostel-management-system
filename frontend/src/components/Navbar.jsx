import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏠 Hostel MS</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            {(user.role === "admin" || user.role === "warden") && (
              <Link to="/admin">Dashboard</Link>
            )}
            {user.role === "student" && <Link to="/student">My Space</Link>}
            <Link to="/rooms">Rooms</Link>
            <Link to="/bookings">Bookings</Link>
            <Link to="/payments">Payments</Link>
            <Link to="/complaints">Complaints</Link>
            <span className="navbar-user">{user.name} ({user.role})</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
