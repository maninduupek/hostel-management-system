const RoomCard = ({ room, onBook, showBookButton }) => {
  return (
    <div className="card room-card">
      <div className="room-card-header">
        <h3>{room.roomNumber}</h3>
        <span className={`badge badge-${room.status}`}>{room.status}</span>
      </div>
      <p>{room.building} · Floor {room.floor} · {room.type}</p>
      <p>Capacity: {room.occupants?.length || 0}/{room.capacity}</p>
      <p>Gender: {room.genderRestriction}</p>
      <p className="room-price">LKR {room.pricePerSemester?.toLocaleString()}/semester</p>
      {room.amenities?.length > 0 && (
        <p className="room-amenities">{room.amenities.join(", ")}</p>
      )}
      {showBookButton && (
        <button
          className="btn btn-primary"
          disabled={room.status !== "available"}
          onClick={() => onBook(room)}
        >
          {room.status === "available" ? "Book This Room" : "Unavailable"}
        </button>
      )}
    </div>
  );
};

export default RoomCard;
