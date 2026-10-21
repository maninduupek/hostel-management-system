
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Building2,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Phone,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  BedDouble,
  ClipboardCheck,
} from "lucide-react";

import "./Auth.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  studentId: "",
  gender: "male",
};

const Register = () => {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        studentId: form.studentId.trim(),
        phone: form.phone.trim(),
      });

      navigate("/student", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
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
              CAMPUS ACCOMMODATION
            </span>

            <h1>
              Find your place.
              <br />
              Feel at home.
            </h1>

            <p>
              Create your student account and manage
              your hostel experience in one place.
            </p>

            <div className="hostel-auth-features">
              <div>
                <BedDouble size={20} />
                <span>Browse available rooms</span>
              </div>

              <div>
                <ClipboardCheck size={20} />
                <span>Track your room bookings</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <span>Manage payments and complaints</span>
              </div>
            </div>
          </div>

          <div className="hostel-auth-visual-footer">
            Better campus living starts here.
          </div>
        </aside>

        <main className="hostel-auth-main">
          <div className="hostel-auth-form-container hostel-register-form-container">
            <div className="hostel-auth-heading">
              <span className="hostel-auth-welcome">
                GET STARTED
              </span>

              <h2>Create your account</h2>

              <p>
                Register as a student to access hostel
                accommodation services.
              </p>
            </div>

            {error && (
              <div className="hostel-auth-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="hostel-auth-form hostel-register-grid"
              onSubmit={handleSubmit}
            >
              <div className="hostel-auth-field hostel-auth-full">
                <label htmlFor="register-name">
                  Full Name
                </label>

                <div className="hostel-auth-input">
                  <UserRound size={19} />

                  <input
                    id="register-name"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="hostel-auth-field hostel-auth-full">
                <label htmlFor="register-email">
                  Email Address
                </label>

                <div className="hostel-auth-input">
                  <Mail size={19} />

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="hostel-auth-field hostel-auth-full">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="hostel-auth-input">
                  <LockKeyhole size={19} />

                  <input
                    id="register-password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={6}
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
              </div>

              <div className="hostel-auth-field">
                <label htmlFor="register-student-id">
                  Student ID
                </label>

                <div className="hostel-auth-input">
                  <GraduationCap size={19} />

                  <input
                    id="register-student-id"
                    name="studentId"
                    placeholder="Student ID"
                    value={form.studentId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="hostel-auth-field">
                <label htmlFor="register-phone">
                  Phone Number
                </label>

                <div className="hostel-auth-input">
                  <Phone size={19} />

                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="hostel-auth-field hostel-auth-full">
                <label htmlFor="register-gender">
                  Gender
                </label>

                <select
                  id="register-gender"
                  className="hostel-auth-select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="hostel-auth-submit hostel-auth-full"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}

                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <p className="hostel-auth-switch">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Register;
