import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ category: "maintenance", title: "", description: "", priority: "medium" });
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "warden";

  const fetchComplaints = async () => {
    const { data } = await api.get("/complaints");
    setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/complaints", form);
      setMessage("Complaint submitted.");
      setForm({ category: "maintenance", title: "", description: "", priority: "medium" });
      fetchComplaints();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit complaint");
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/complaints/${id}`, { status });
    fetchComplaints();
  };

  return (
    <div className="page">
      <h1>Complaints</h1>

      {!isStaff && (
        <form className="card inline-form" onSubmit={handleSubmit}>
          <h3>Raise a Complaint</h3>
          {message && <p className="info-text">{message}</p>}
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="maintenance">Maintenance</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="noise">Noise</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <textarea
            name="description"
            placeholder="Describe the issue"
            value={form.description}
            onChange={handleChange}
            required
          />
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="btn btn-primary" type="submit">Submit</button>
        </form>
      )}

      <div className="grid">
        {complaints.map((c) => (
          <div className="card" key={c._id}>
            <div className="room-card-header">
              <h3>{c.title}</h3>
              <span className={`badge badge-${c.status}`}>{c.status}</span>
            </div>
            <p>{c.description}</p>
            <p>Category: {c.category} · Priority: {c.priority}</p>
            {isStaff && <p>By: {c.student?.name}</p>}
            {isStaff && c.status !== "closed" && (
              <div className="actions">
                {c.status === "open" && (
                  <button className="btn btn-sm btn-primary" onClick={() => updateStatus(c._id, "in_progress")}>
                    Start Work
                  </button>
                )}
                {c.status !== "resolved" && (
                  <button className="btn btn-sm btn-primary" onClick={() => updateStatus(c._id, "resolved")}>
                    Mark Resolved
                  </button>
                )}
                <button className="btn btn-sm btn-outline" onClick={() => updateStatus(c._id, "closed")}>
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
        {complaints.length === 0 && <p>No complaints found.</p>}
      </div>
    </div>
  );
};

export default Complaints;
