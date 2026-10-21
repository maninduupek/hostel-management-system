
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import RoomCard from "../components/RoomCard";
import { useAuth } from "../context/AuthContext";

import {
  BedDouble,
  Building2,
  CheckCircle2,
  Wrench,
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  DoorOpen,
} from "lucide-react";

import "./Rooms.css";

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
  const { user } = useAuth();

  const canManage =
    user?.role === "admin" || user?.role === "warden";

  const isAdmin = user?.role === "admin";

  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    type: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  // Keep the existing backend filters.
  const fetchRooms = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const { data } = await api.get("/rooms", { params });

      setRooms(data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load rooms."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.status, filters.type]);

  useEffect(() => {
    fetchRooms(true);
  }, [fetchRooms]);

  // Search is applied to the rooms returned by the API.
  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rooms;

    return rooms.filter((room) => {
      const searchable = [
        room.roomNumber,
        room.building,
        room.type,
        room.status,
        room.floor,
        ...(room.amenities || []),
      ]
        .filter((value) => value != null)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rooms, search]);

  // These totals describe the currently selected filters.
  const summary = useMemo(() => ({
    total: filteredRooms.length,
    available: filteredRooms.filter(
      (room) => room.status === "available"
    ).length,
    full: filteredRooms.filter(
      (room) => room.status === "full"
    ).length,
    maintenance: filteredRooms.filter(
      (room) => room.status === "maintenance"
    ).length,
  }), [filteredRooms]);

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
      roomNumber: room.roomNumber || "",
      building: room.building || "",
      floor: room.floor ?? 1,
      type: room.type || "single",
      capacity: room.capacity ?? 1,
      genderRestriction: room.genderRestriction || "any",
      pricePerSemester: room.pricePerSemester ?? "",
      amenities: room.amenities?.join(", ") || "",
      status: room.status || "available",
    });

    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        roomNumber: form.roomNumber.trim(),
        building: form.building.trim(),
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        pricePerSemester: Number(form.pricePerSemester),
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (
        !payload.roomNumber ||
        !payload.building ||
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

      closeForm();
      await fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save room."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (!isAdmin || deletingId) return;

    if (room.occupants?.length > 0) {
      setError("Cannot delete a room with occupants.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete room ${room.roomNumber}?`
    );

    if (!confirmed) return;

    setDeletingId(room._id);
    setError("");
    setMessage("");

    try {
      await api.delete(`/rooms/${room._id}`);
      setMessage(
        `Room ${room.roomNumber} deleted successfully.`
      );
      await fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete room."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleBook = async (room) => {
    if (bookingId) return;

    setBookingId(room._id);
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
        err.response?.data?.message || "Booking failed."
      );
    } finally {
      setBookingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({ status: "", type: "" });
  };

  return (
    <div className="page professional-rooms">

      {/* PAGE HEADER */}
      <div className="rooms-header">
        <div>
          <span className="rooms-eyebrow">
            HOSTEL MANAGEMENT
          </span>

          <h1>
            {canManage ? "Room Management" : "Explore Rooms"}
          </h1>

          <p>
            {canManage
              ? "Manage accommodation, room availability and facilities."
              : "Find suitable accommodation and request a room booking."}
          </p>
        </div>

        <div className="rooms-header-actions">
          <button
            type="button"
            className="rooms-refresh-btn"
            onClick={() => fetchRooms()}
            disabled={loading || refreshing}
          >
            <RefreshCw size={17} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {canManage && (
            <button
              type="button"
              className="rooms-add-btn"
              onClick={openAddForm}
            >
              <Plus size={19} />
              Add Room
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {message && (
        <div className="rooms-alert rooms-alert-success" role="status">
          <CheckCircle2 size={19} />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="rooms-alert rooms-alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="rooms-summary-grid">
        <div className="rooms-summary-card">
          <div className="rooms-summary-icon purple">
            <Building2 size={22} />
          </div>
          <strong>{summary.total}</strong>
          <span>Rooms Shown</span>
        </div>

        <div className="rooms-summary-card">
          <div className="rooms-summary-icon green">
            <CheckCircle2 size={22} />
          </div>
          <strong>{summary.available}</strong>
          <span>Available</span>
        </div>

        <div className="rooms-summary-card">
          <div className="rooms-summary-icon red">
            <BedDouble size={22} />
          </div>
          <strong>{summary.full}</strong>
          <span>Full Rooms</span>
        </div>

        <div className="rooms-summary-card">
          <div className="rooms-summary-icon orange">
            <Wrench size={22} />
          </div>
          <strong>{summary.maintenance}</strong>
          <span>Maintenance</span>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      {canManage && showForm && (
        <section className="rooms-form-panel">
          <div className="rooms-panel-heading">
            <div>
              <h2>
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h2>
              <p>
                Enter the accommodation details below.
              </p>
            </div>

            <button
              type="button"
              className="rooms-icon-btn"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rooms-professional-form"
          >
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
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="full">Full</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label className="rooms-form-wide">
              Amenities (comma-separated)
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="Wi-Fi, Study Desk, Fan"
              />
            </label>

            <div className="rooms-form-buttons">
              <button
                type="submit"
                className="rooms-add-btn"
                disabled={saving}
              >
                <Save size={18} />
                {saving
                  ? "Saving..."
                  : editingRoom
                  ? "Update Room"
                  : "Save Room"}
              </button>

              <button
                type="button"
                className="rooms-cancel-btn"
                onClick={closeForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SEARCH AND FILTERS */}
      <section className="rooms-toolbar">
        <div className="rooms-search">
          <Search size={20} />

          <input
            type="search"
            placeholder="Search rooms, buildings, amenities..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search rooms"
          />
        </div>

        <div className="rooms-filter-controls">
          <SlidersHorizontal size={19} />

          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status: event.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select
            aria-label="Filter by room type"
            value={filters.type}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                type: event.target.value,
              }))
            }
          >
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="shared">Shared</option>
          </select>

          <button
            type="button"
            className="rooms-clear-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </section>

      {/* ROOM LIST HEADER */}
      <div className="rooms-list-heading">
        <div>
          <h2>Room Directory</h2>
          <p>
            {loading
              ? "Loading rooms..."
              : `Showing ${filteredRooms.length} room${
                  filteredRooms.length === 1 ? "" : "s"
                }`}
          </p>
        </div>
      </div>

      {/* ROOM CARDS */}
      {loading ? (
        <div className="rooms-empty-state">
          <RefreshCw size={30} />
          <p>Loading rooms...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rooms-empty-state">
          <DoorOpen size={38} />
          <h3>No Rooms Found</h3>
          <p>
            Try changing your search or filters.
          </p>
          <button
            type="button"
            className="rooms-cancel-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="rooms-directory-grid">
          {filteredRooms.map((room) => (
            <div
              className="rooms-directory-item"
              key={room._id}
            >
              <RoomCard
                room={room}
                onBook={handleBook}
                showBookButton={
                  user?.role === "student" && !bookingId
                }
              />

              {bookingId === room._id && (
                <p className="rooms-working-text">
                  Sending booking request...
                </p>
              )}

              {canManage && (
                <div className="rooms-directory-actions">
                  <button
                    type="button"
                    className="rooms-edit-btn"
                    onClick={() => openEditForm(room)}
                  >
                    <Pencil size={16} />
                    Edit Room
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="rooms-delete-btn"
                      onClick={() => handleDelete(room)}
                      disabled={deletingId !== null}
                    >
                      <Trash2 size={16} />
                      {deletingId === room._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;
