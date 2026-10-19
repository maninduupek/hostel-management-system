
import { useEffect, useState } from "react";
import api from "../api/axios";
import RoomCard from "../components/RoomCard";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  roomNumber: "",
  building: "",
  floor: 1,
  type: "single",
  capacity: 1,
  genderRestriction: "any",
  pricePerSemester: "",
  amenities: "",
  status: "available",
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    type: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();

  const canManage =
    user?.role === "admin" || user?.role === "warden";

  const isAdmin = user?.role === "admin";

  const fetchRooms = async () => {
    try {
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const { data } = await api.get("/rooms", { params });
      setRooms(data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load rooms"
      );
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openAddForm = () => {
    setEditingRoom(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (room) => {
    setEditingRoom(room);

    setForm({
      roomNumber: room.roomNumber,
      building: room.building,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity,
      genderRestriction: room.genderRestriction,
      pricePerSemester: room.pricePerSemester,
      amenities: room.amenities?.join(", ") || "",
      status: room.status,
    });

    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManage || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        pricePerSemester: Number(form.pricePerSemester),
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (
        !payload.roomNumber.trim() ||
        !payload.building.trim() ||
        !Number.isInteger(payload.floor) ||
        !Number.isInteger(payload.capacity) ||
        payload.capacity < 1 ||
        !Number.isFinite(payload.pricePerSemester) ||
        payload.pricePerSemester < 0 ||
        String(form.pricePerSemester).trim() === ""
      ) {
        setError("Please enter valid room details.");
        return;
      }

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, payload);
        setMessage("Room updated successfully!");
      } else {
        await api.post("/rooms", payload);
        setMessage("Room added successfully!");
      }

      setShowForm(false);
      setEditingRoom(null);
      setForm({ ...emptyForm });
      await fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save room"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (!isAdmin) return;

    if (room.occupants?.length > 0) {
      setError("Cannot delete a room with occupants.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete room ${room.roomNumber}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/rooms/${room._id}`);
      setMessage(`Room ${room.roomNumber} deleted successfully.`);
      setError("");
      await fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete room"
      );
    }
  };

  const handleBook = async (room) => {
    setMessage("");
    setError("");

    try {
      await api.post("/bookings", {
        roomId: room._id,
        semester: "2026-Semester-1",
        preferences: "",
      });

      setMessage(
        `Booking request sent for room ${room.roomNumber}. Await admin approval.`
      );

      await fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Booking failed"
      );
    }
  };

  return (
    <div className="page">
      <div className="room-page-header">
        <h1>Available Rooms</h1>

        {canManage && (
          <button
            type="button"
            className="primary-btn"
            onClick={openAddForm}
          >
            + Add Room
          </button>
        )}
      </div>

      {message && <p className="info-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {canManage && showForm && (
        <div className="room-form-card">
          <h2>
            {editingRoom ? "Edit Room" : "Add New Room"}
          </h2>

          <form onSubmit={handleSubmit} className="room-form">
            <label>
              Room Number
              <input
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="A103"
                required
              />
            </label>

            <label>
              Building
              <input
                name="building"
                value={form.building}
                onChange={handleChange}
                placeholder="Block A"
                required
              />
            </label>

            <label>
              Floor
              <input
                type="number"
                name="floor"
                value={form.floor}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Room Type
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="shared">Shared</option>
              </select>
            </label>

            <label>
              Capacity
              <input
                type="number"
                name="capacity"
                min="1"
                step="1"
                value={form.capacity}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Gender Restriction
              <select
                name="genderRestriction"
                value={form.genderRestriction}
                onChange={handleChange}
              >
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label>
              Price Per Semester (LKR)
              <input
                type="number"
                name="pricePerSemester"
                min="0"
                value={form.pricePerSemester}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Amenities (comma-separated)
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="Wi-Fi, Study Desk"
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="full">Full</option>
                <option value="maintenance">
                  Maintenance
                </option>
              </select>
            </label>

            <div className="room-form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingRoom
                  ? "Update Room"
                  : "Save Room"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value,
            })
          }
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="full">Full</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) =>
            setFilters({
              ...filters,
              type: e.target.value,
            })
          }
        >
          <option value="">All Types</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      <div className="grid">
        {rooms.map((room) => (
          <div key={room._id}>
            <RoomCard
              room={room}
              onBook={handleBook}
              showBookButton={user?.role === "student"}
            />

            {canManage && (
              <div className="room-actions">
                <button
                  type="button"
                  onClick={() => openEditForm(room)}
                >
                  Edit
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(room)}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {rooms.length === 0 && <p>No rooms found.</p>}
      </div>
    </div>
  );
};

export default Rooms;
