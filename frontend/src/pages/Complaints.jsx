
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import {
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  FilterX,
  Plus,
  X,
  Wrench,
  ShieldCheck,
  Sparkles,
  Volume2,
  ClipboardList,
  UserRound,
  CalendarDays,
  Send,
  Play,
  Lock,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import "./Complaints.css";

const initialForm = {
  category: "maintenance",
  title: "",
  description: "",
  priority: "medium",
};

const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const categoryLabels = {
  maintenance: "Maintenance",
  cleanliness: "Cleanliness",
  noise: "Noise",
  security: "Security",
  other: "Other",
};

const STATUS_COLORS = {
  open: "#ef4444",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  closed: "#94a3b8",
};

const categoryIcons = {
  maintenance: Wrench,
  cleanliness: Sparkles,
  noise: Volume2,
  security: ShieldCheck,
  other: ClipboardList,
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const Complaints = () => {
  const { user } = useAuth();

  const isStaff =
    user?.role === "admin" || user?.role === "warden";

  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchComplaints = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const { data } = await api.get("/complaints");

      if (!Array.isArray(data)) {
        throw new Error("Invalid complaints response");
      }

      setComplaints(data);
      setError("");
    } catch (err) {
      console.error("Complaints API error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load complaints."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(true);
  }, [fetchComplaints]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isStaff || submitting) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.post("/complaints", form);

      setForm(initialForm);
      setShowForm(false);

      await fetchComplaints();

      setMessage("Complaint submitted successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit complaint."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!isStaff || updatingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark this complaint as ${
        statusLabels[status]
      }?`
    );

    if (!confirmed) return;

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      await api.put(`/complaints/${id}`, { status });

      await fetchComplaints();

      setMessage(
        `Complaint marked as ${statusLabels[status]} successfully!`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update complaint."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = useMemo(
    () => ({
      total: complaints.length,
      open: complaints.filter(
        (complaint) => complaint.status === "open"
      ).length,
      inProgress: complaints.filter(
        (complaint) => complaint.status === "in_progress"
      ).length,
      resolved: complaints.filter(
        (complaint) => complaint.status === "resolved"
      ).length,
      closed: complaints.filter(
        (complaint) => complaint.status === "closed"
      ).length,
      highPriority: complaints.filter(
        (complaint) =>
          complaint.priority === "high" &&
          ["open", "in_progress"].includes(complaint.status)
      ).length,
    }),
    [complaints]
  );

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === "all" ||
        complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        complaint.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        complaint.category === categoryFilter;

      const searchableText = [
        complaint.title,
        complaint.description,
        complaint.category,
        complaint.priority,
        complaint.status,
        complaint.student?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        (!query || searchableText.includes(query))
      );
    });
  }, [
    complaints,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  const statusChartData = useMemo(
    () =>
      ["open", "in_progress", "resolved", "closed"]
        .map((status) => ({
          name: statusLabels[status],
          value: complaints.filter(
            (complaint) => complaint.status === status
          ).length,
          color: STATUS_COLORS[status],
        }))
        .filter((item) => item.value > 0),
    [complaints]
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="page professional-complaints">
      {/* PAGE HEADER */}
      <div className="complaints-header">
        <div>
          <span className="complaints-eyebrow">
            HOSTEL MANAGEMENT
          </span>

          <h1>
            {isStaff
              ? "Complaints Management"
              : "My Complaints"}
          </h1>

          <p>
            {isStaff
              ? "Monitor student concerns, track issues and manage resolutions."
              : "Report hostel issues and track their resolution status."}
          </p>
        </div>

        <div className="complaints-header-actions">
          <button
            type="button"
            className="complaints-refresh-btn"
            onClick={() => fetchComplaints()}
            disabled={loading || refreshing}
          >
            <RefreshCw size={18} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {!isStaff && (
            <button
              type="button"
              className="complaints-add-btn"
              onClick={() => setShowForm((value) => !value)}
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Cancel" : "Raise Complaint"}
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}
      {message && (
        <div
          className="complaints-alert complaints-success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div
          className="complaints-alert complaints-error"
          role="alert"
        >
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="complaints-summary-grid">
        <div className="complaints-summary-card">
          <div className="complaints-summary-icon purple">
            <MessageSquare size={22} />
          </div>
          <strong>{summary.total}</strong>
          <span>Total Complaints</span>
        </div>

        <div className="complaints-summary-card">
          <div className="complaints-summary-icon red">
            <AlertCircle size={22} />
          </div>
          <strong>{summary.open}</strong>
          <span>Open Complaints</span>
        </div>

        <div className="complaints-summary-card">
          <div className="complaints-summary-icon orange">
            <Clock3 size={22} />
          </div>
          <strong>{summary.inProgress}</strong>
          <span>In Progress</span>
        </div>

        <div className="complaints-summary-card">
          <div className="complaints-summary-icon green">
            <CheckCircle2 size={22} />
          </div>
          <strong>{summary.resolved}</strong>
          <span>Resolved</span>
        </div>
      </div>

      {/* STUDENT COMPLAINT FORM */}
      {!isStaff && showForm && (
        <section className="complaints-form-panel">
          <div className="complaints-section-heading">
            <div>
              <h2>
                <Plus size={21} />
                Raise a Complaint
              </h2>
              <p>
                Provide details about the issue you are facing.
              </p>
            </div>
          </div>

          <form
            className="complaints-form"
            onSubmit={handleSubmit}
          >
            <label>
              Complaint Title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Broken ceiling fan"
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="maintenance">Maintenance</option>
                <option value="cleanliness">Cleanliness</option>
                <option value="noise">Noise</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="complaints-description-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                rows={5}
                required
              />
            </label>

            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <div className="complaints-form-actions">
              <button
                type="submit"
                className="complaints-submit-btn"
                disabled={submitting}
              >
                <Send size={17} />
                {submitting
                  ? "Submitting..."
                  : "Submit Complaint"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CHART + OVERVIEW */}
      <div className="complaints-overview-grid">
        <section className="complaints-chart-card">
          <div className="complaints-section-heading">
            <div>
              <h2>Complaint Status Overview</h2>
              <p>Distribution of complaint statuses</p>
            </div>
            <MessageSquare size={19} />
          </div>

          {statusChartData.length === 0 ? (
            <div className="complaints-chart-empty">
              No complaint data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {statusChartData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="complaints-overview-card">
          <div className="complaints-section-heading">
            <div>
              <h2>Resolution Overview</h2>
              <p>Current complaint handling summary</p>
            </div>
            <CheckCircle2 size={19} />
          </div>

          <div className="complaints-overview-row">
            <span>Total Complaints</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="complaints-overview-row">
            <span>Active Complaints</span>
            <strong>
              {summary.open + summary.inProgress}
            </strong>
          </div>

          <div className="complaints-overview-row">
            <span>High Priority Active</span>
            <strong className="complaints-danger-value">
              {summary.highPriority}
            </strong>
          </div>

          <div className="complaints-overview-row">
            <span>Resolved Complaints</span>
            <strong>{summary.resolved}</strong>
          </div>

          <div className="complaints-overview-row">
            <span>Closed Complaints</span>
            <strong>{summary.closed}</strong>
          </div>

          <div className="complaints-progress-label">
            <span>Resolution Rate</span>
            <strong>
              {summary.total
                ? (
                    ((summary.resolved + summary.closed) /
                      summary.total) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </strong>
          </div>

          <div className="complaints-progress-track">
            <div
              className="complaints-progress-fill"
              style={{
                width: `${
                  summary.total
                    ? ((summary.resolved + summary.closed) /
                        summary.total) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </section>
      </div>

      {/* FILTERS */}
      <div className="complaints-toolbar">
        <div className="complaints-search">
          <Search size={19} />
          <input
            type="search"
            placeholder={
              isStaff
                ? "Search complaints, students, issues..."
                : "Search your complaints..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="complaints-filter-group">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="all">All Categories</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="noise">Noise</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>

          <button
            type="button"
            className="complaints-clear-btn"
            onClick={clearFilters}
          >
            <FilterX size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* COMPLAINT DIRECTORY */}
      <section className="complaints-directory">
        <div className="complaints-directory-heading">
          <div>
            <h2>Complaint Directory</h2>
            <p>
              Showing {filteredComplaints.length} of{" "}
              {complaints.length} complaints
            </p>
          </div>

          <span className="complaints-record-count">
            {filteredComplaints.length} Records
          </span>
        </div>

        {loading ? (
          <div className="complaints-empty">
            Loading complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="complaints-empty">
            <MessageSquare size={36} />
            <h3>No Complaints Found</h3>
            <p>
              {complaints.length === 0
                ? "There are no complaints recorded yet."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="complaints-card-grid">
            {filteredComplaints.map((complaint) => {
              const CategoryIcon =
                categoryIcons[complaint.category] ||
                ClipboardList;

              return (
                <article
                  className="complaint-item"
                  key={complaint._id}
                >
                  <div className="complaint-item-top">
                    <div className="complaint-category-icon">
                      <CategoryIcon size={21} />
                    </div>

                    <span
                      className={`complaint-status complaint-status-${complaint.status}`}
                    >
                      <span className="complaint-status-dot" />
                      {statusLabels[complaint.status] ||
                        complaint.status}
                    </span>
                  </div>

                  <h3>{complaint.title}</h3>

                  <p className="complaint-description">
                    {complaint.description}
                  </p>

                  <div className="complaint-meta">
                    <span>
                      <ClipboardList size={15} />
                      {categoryLabels[complaint.category] ||
                        complaint.category}
                    </span>

                    <span
                      className={`complaint-priority complaint-priority-${complaint.priority}`}
                    >
                      {complaint.priority} Priority
                    </span>
                  </div>

                  {isStaff && (
                    <div className="complaint-student">
                      <UserRound size={16} />
                      {complaint.student?.name ||
                        "Unknown Student"}
                    </div>
                  )}

                  <div className="complaint-date">
                    <CalendarDays size={15} />
                    {formatDate(complaint.createdAt)}
                  </div>

                  {isStaff &&
                    !["closed", "resolved"].includes(
                      complaint.status
                    ) && (
                      <div className="complaint-actions">
                        {complaint.status === "open" && (
                          <button
                            type="button"
                            className="complaint-start-btn"
                            disabled={updatingId !== null}
                            onClick={() =>
                              updateStatus(
                                complaint._id,
                                "in_progress"
                              )
                            }
                          >
                            <Play size={15} />
                            Start Work
                          </button>
                        )}

                        <button
                          type="button"
                          className="complaint-resolve-btn"
                          disabled={updatingId !== null}
                          onClick={() =>
                            updateStatus(
                              complaint._id,
                              "resolved"
                            )
                          }
                        >
                          <CheckCircle2 size={15} />
                          Mark Resolved
                        </button>

                        <button
                          type="button"
                          className="complaint-close-btn"
                          disabled={updatingId !== null}
                          onClick={() =>
                            updateStatus(
                              complaint._id,
                              "closed"
                            )
                          }
                        >
                          <Lock size={15} />
                          Close
                        </button>
                      </div>
                    )}

                  {isStaff && complaint.status === "resolved" && (
                    <div className="complaint-actions">
                      <button
                        type="button"
                        className="complaint-close-btn"
                        disabled={updatingId !== null}
                        onClick={() =>
                          updateStatus(
                            complaint._id,
                            "closed"
                          )
                        }
                      >
                        <Lock size={15} />
                        Close Complaint
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Complaints;
