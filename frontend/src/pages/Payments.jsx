import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "warden";

  const fetchData = async () => {
    const { data } = await api.get("/payments");
    setPayments(data);
    if (!isStaff) {
      const { data: bookingData } = await api.get("/bookings");
      setBookings(bookingData.filter((b) => b.status === "approved"));
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/payments", {
        bookingId: selectedBooking,
        amount: Number(amount),
        method: "card",
      });
      setMessage("Payment successful!");
      setSelectedBooking("");
      setAmount("");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Payment failed");
    }
  };

  return (
    <div className="page">
      <h1>Payments</h1>

      {!isStaff && bookings.length > 0 && (
        <form className="card inline-form" onSubmit={handlePay}>
          <h3>Make a Payment</h3>
          {message && <p className="info-text">{message}</p>}
          <select value={selectedBooking} onChange={(e) => setSelectedBooking(e.target.value)} required>
            <option value="">Select an approved booking</option>
            {bookings.map((b) => (
              <option key={b._id} value={b._id}>
                {b.room?.roomNumber} - {b.room?.building} (LKR {b.room?.pricePerSemester})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount (LKR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">Pay Now (Mock)</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {isStaff && <th>Student</th>}
              <th>Room</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                {isStaff && <td>{p.student?.name}</td>}
                <td>{p.booking?.room?.roomNumber}</td>
                <td>LKR {p.amount?.toLocaleString()}</td>
                <td>{p.method}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td>{p.transactionRef}</td>
                <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={isStaff ? 7 : 6}>No payments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
