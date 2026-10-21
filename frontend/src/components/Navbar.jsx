
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Building2,
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  UserRound,
  ChevronRight,
} from "lucide-react";

import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const dashboardPath =
    user?.role === "student" ? "/student" : "/admin";

  const navItems = [
    {
      label: user?.role === "student" ? "My Space" : "Dashboard",
      path: dashboardPath,
      icon: LayoutDashboard,
    },
    {
      label: "Rooms",
      path: "/rooms",
      icon: BedDouble,
    },
    {
      label: "Bookings",
      path: "/bookings",
      icon: CalendarCheck,
    },
    {
      label: "Payments",
      path: "/payments",
      icon: CreditCard,
    },
    {
      label: "Complaints",
      path: "/complaints",
      icon: MessageSquare,
    },
  ];

  // Public pages retain a simple top navigation.
  if (!user) {
    return (
      <nav className="public-navbar">
        <Link to="/" className="public-brand">
          <Building2 size={25} />
          <span>Hostel MS</span>
        </Link>

        <div className="public-nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="public-register">
            Register
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="mobile-topbar">
        <Link
          to={dashboardPath}
          className="mobile-brand"
          onClick={closeMenu}
        >
          <Building2 size={24} />
          <span>Hostel MS</span>
        </Link>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      {/* MOBILE BACKDROP */}
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeMenu}
          aria-label="Close navigation"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}
      >
        <Link
          to={dashboardPath}
          className="sidebar-brand"
          onClick={closeMenu}
        >
          <div className="sidebar-brand-icon">
            <Building2 size={25} />
          </div>

          <div className="sidebar-brand-text">
            <strong>Hostel MS</strong>
            <span>Management System</span>
          </div>
        </Link>

        <div className="sidebar-content">
          <p className="sidebar-section-title">
            MAIN MENU
          </p>

          <nav className="sidebar-nav" aria-label="Main navigation">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                onClick={closeMenu}
                className={({ isActive }) =>
                  `sidebar-nav-link ${
                    isActive ? "sidebar-nav-active" : ""
                  }`
                }
              >
                <Icon size={20} />
                <span>{label}</span>
                <ChevronRight
                  size={15}
                  className="sidebar-link-arrow"
                />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <UserRound size={20} />
            </div>

            <div className="sidebar-profile-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
