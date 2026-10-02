import { useEffect, useState } from "react";
import api from "../api/axios";
import RoomCard from "../components/RoomCard";
import { useAuth } from "../context/AuthContext";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ status: "", type: "" });
  const { user } = useAuth();

  const fetchRooms = async () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    const { data } = await api.get("/rooms", { params });
    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleBook = async (room) => {
    setMessage("");
    try {
      await api.post("/bookings", {
        roomId: room._id,
        semester: "2026-Semester-1",
        preferences: "",
      });
      setMessage(`Booking request sent for room ${room.roomNumber}. Await admin approval.`);
      fetchRooms();
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div className="page">
      <h1>Available Rooms</h1>
      {message && <p className="info-text">{message}</p>}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="full">Full</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="shared">Shared</option>
        </select>
      </div>
      <div className="grid">
        {rooms.map((room) => (
          <RoomCard
            key={room._id}
            room={room}
            onBook={handleBook}
            showBookButton={user?.role === "student"}
          />
        ))}
        {rooms.length === 0 && <p>No rooms found.</p>}
      </div>
    </div>
  );
};

export default Rooms;
