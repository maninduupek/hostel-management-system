
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BedDouble,
  ClipboardCheck,
} from "lucide-react";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const data = await login(email.trim(), password);

      if (data.role === "admin" || data.role === "warden") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hostel-auth-page">
      <div className="hostel-auth-container">
        <aside className="hostel-auth-visual">
          <Link to="/" className="hostel-auth-brand">
            <span className="hostel-auth-brand-icon">
              <Building2 size={23} />
            </span>
            <span>HostelMS</span>
          </Link>

          <div className="hostel-auth-visual-content">
            <span className="hostel-auth-kicker">
              SMART HOSTEL MANAGEMENT
            </span>

            <h1>
              Your hostel,
              <br />
              simplified.
            </h1>

            <p>
              One platform to manage accommodation,
              bookings, payments, and student support.
            </p>

            <div className="hostel-auth-features">
              <div>
                <BedDouble size={20} />
                <span>Easy room management</span>
              </div>

              <div>
                <ClipboardCheck size={20} />
                <span>Seamless booking experience</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <span>Secure account access</span>
              </div>
            </div>
          </div>

          <div className="hostel-auth-visual-footer">
            A smarter way to manage campus living.
          </div>
        </aside>

        <main className="hostel-auth-main">
          <div className="hostel-auth-form-container">
            <div className="hostel-auth-heading">
              <span className="hostel-auth-welcome">
                WELCOME BACK
              </span>

              <h2>Sign in to your account</h2>

              <p>
                Enter your credentials to access your
                hostel management dashboard.
              </p>
            </div>

            {error && (
              <div className="hostel-auth-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="hostel-auth-form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="hostel-auth-input">
                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <label htmlFor="login-password">
                Password
              </label>

              <div className="hostel-auth-input">
                <LockKeyhole size={19} />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="hostel-auth-eye"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="hostel-auth-submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <p className="hostel-auth-switch">
              Don't have an account?{" "}
              <Link to="/register">
                Create an account
              </Link>
            </p>

            <div className="hostel-auth-demo">
              <strong>Demo Access</strong>
              <p>
                Use the administrator demo credentials
                provided by your project setup.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
