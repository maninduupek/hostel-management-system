
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const homePath = !user
    ? "/login"
    : user.role === "admin" || user.role === "warden"
      ? "/admin"
      : "/student";

  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="notfound-icon">
          <SearchX size={44} />
        </div>

        <h1>404</h1>
        <h2>Oops! Page Not Found</h2>

        <p>
          The page you're looking for doesn't exist
          or may have been moved.
        </p>

        <div className="notfound-actions">
          <Link to={homePath} className="notfound-home-btn">
            <Home size={18} />
            Go to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="notfound-back-btn"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
