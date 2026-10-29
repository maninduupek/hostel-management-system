
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import {
  Wallet,
  CreditCard,
  ReceiptText,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  FilterX,
  X,
  AlertCircle,
  TrendingUp,
  BedDouble,
  LockKeyhole,
  ArrowLeft,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import "./Payments.css";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

const money = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK")}`;

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

// DEMO ONLY. Never use actual payment card details.
const TEST_CARD = "4242424242424242";
const TEST_EXPIRY = "12/28";
const TEST_CVV = "123";

const Payments = () => {
  const { user } = useAuth();

  const isStaff =
    user?.role === "admin" || user?.role === "warden";

  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const resetCard = () => {
    setCardholder("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setShowCardForm(false);
  };

  const fetchData = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        const paymentRequest = api.get("/payments");

        if (isStaff) {
          const { data } = await paymentRequest;
          if (!Array.isArray(data)) {
            throw new Error("Invalid payment response");
          }

          setPayments(data);
          setBookings([]);
        } else {
          const [
            { data: paymentData },
            { data: bookingData },
          ] = await Promise.all([
            paymentRequest,
            api.get("/bookings"),
          ]);

          if (
            !Array.isArray(paymentData) ||
            !Array.isArray(bookingData)
          ) {
            throw new Error("Invalid payment or booking response");
          }

          setPayments(paymentData);
          setBookings(
            bookingData.filter(
              (booking) => booking.status === "approved"
            )
          );
        }

        setError("");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load payment information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isStaff]
  );

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const selectedRoomBooking = bookings.find(
    (booking) => booking._id === selectedBooking
  );

  const alreadyPaidBookingIds = useMemo(
    () =>
      new Set(
        payments
          .filter((payment) => payment.status === "paid")
          .map((payment) =>
            typeof payment.booking === "string"
              ? payment.booking
              : payment.booking?._id
          )
          .filter(Boolean)
      ),
    [payments]
  );

  const payableBookings = bookings.filter(
    (booking) => !alreadyPaidBookingIds.has(booking._id)
  );

  const price = Number(
    selectedRoomBooking?.room?.pricePerSemester || 0
  );

  const handleContinue = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRoomBooking) {
      setError("Please select an approved booking.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("This booking does not have a valid room price.");
      return;
    }

    if (alreadyPaidBookingIds.has(selectedBooking)) {
      setError("This booking has already been paid.");
      return;
    }

    resetCard();
    setShowCardForm(true);
  };

  const handleCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  };

  const handleExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);

    setExpiry(
      digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits
    );
  };

  const handlePay = async (event) => {
    event.preventDefault();

    if (!selectedRoomBooking || paying) return;

    if (!cardholder.trim()) {
      setError("Please enter a cardholder name.");
      return;
    }

    const enteredCard = cardNumber.replace(/\s/g, "");

    if (
      enteredCard !== TEST_CARD ||
      expiry !== TEST_EXPIRY ||
      cvv !== TEST_CVV
    ) {
      setError(
        "Invalid demo card details. Use the test card information shown below."
      );
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Invalid booking amount.");
      return;
    }

    if (alreadyPaidBookingIds.has(selectedBooking)) {
      setError("This booking has already been paid.");
      return;
    }

    setPaying(true);
    setMessage("");
    setError("");

    try {
      // Never send card number, expiry or CVV to backend.
      await api.post("/payments", {
        bookingId: selectedBooking,
        amount: price,
        method: "card",
      });

      resetCard();
      setSelectedBooking("");

      await fetchData();

      setMessage(
        "Demo card payment recorded successfully! No real money was charged."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  const summary = useMemo(() => {
    const paid = payments.filter(
      (payment) => payment.status === "paid"
    );

    return {
      total: payments.length,
      successful: paid.length,
      pending: payments.filter(
        (payment) => payment.status === "pending"
      ).length,
      revenue: paid.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0
      ),
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" ||
        payment.status === statusFilter;

      const text = [
        payment.student?.name,
        payment.booking?.room?.roomNumber,
        payment.transactionRef,
        payment.method,
        payment.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || text.includes(query));
    });
  }, [payments, search, statusFilter]);

  const statusChart = useMemo(() => {
    const counts = {};

    payments.forEach((payment) => {
      const status = payment.status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [payments]);

  const monthlyChart = useMemo(() => {
    const totals = {};

    payments
      .filter((payment) => payment.status === "paid")
      .forEach((payment) => {
        const date = new Date(
          payment.paidAt || payment.createdAt
        );

        if (Number.isNaN(date.getTime())) return;

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        totals[key] =
          (totals[key] || 0) + Number(payment.amount || 0);
      });

    return Object.keys(totals)
      .sort()
      .map((key) => ({
        month: key,
        revenue: totals[key],
      }));
  }, [payments]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="page professional-payments">
      {/* HEADER */}
      <div className="payments-header">
        <div>
          <span className="payments-eyebrow">
            HOSTEL MANAGEMENT
          </span>
          <h1>
            {isStaff ? "Payment Management" : "My Payments"}
          </h1>
          <p>
            {isStaff
              ? "Monitor hostel payments, transactions and revenue."
              : "View payment history and manage accommodation fees."}
          </p>
        </div>

        <button
          type="button"
          className="payments-refresh-btn"
          disabled={loading || refreshing}
          onClick={() => fetchData()}
        >
          <RefreshCw size={18} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ALERTS */}
      {message && (
        <div
          className="payments-alert payments-success"
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
          className="payments-alert payments-error"
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

      {/* SUMMARY */}
      <div className="payments-summary-grid">
        <div className="payments-summary-card">
          <div className="payments-summary-icon purple">
            <Wallet size={22} />
          </div>
          <strong>{money(summary.revenue)}</strong>
          <span>
            {isStaff ? "Total Revenue" : "Total Paid"}
          </span>
        </div>

        <div className="payments-summary-card">
          <div className="payments-summary-icon blue">
            <ReceiptText size={22} />
          </div>
          <strong>{summary.total}</strong>
          <span>Total Transactions</span>
        </div>

        <div className="payments-summary-card">
          <div className="payments-summary-icon green">
            <CheckCircle2 size={22} />
          </div>
          <strong>{summary.successful}</strong>
          <span>Successful Payments</span>
        </div>

        <div className="payments-summary-card">
          <div className="payments-summary-icon orange">
            <Clock3 size={22} />
          </div>
          <strong>{summary.pending}</strong>
          <span>Pending Payments</span>
        </div>
      </div>

      {/* STUDENT PAYMENT */}
      {!isStaff && (
        <section className="payments-form-panel">
          <div className="payments-section-heading">
            <div>
              <h2>
                <CreditCard size={21} />
                Make a Payment
              </h2>
              <p>
                Pay your hostel accommodation fee using
                the demo card checkout.
              </p>
            </div>

            <span className="payments-demo-badge">
              Demo Payment
            </span>
          </div>

          {loading ? (
            <p>Loading approved bookings...</p>
          ) : payableBookings.length === 0 ? (
            <div className="payments-no-booking">
              <BedDouble size={24} />
              <p>
                No unpaid approved bookings are available.
                Create a booking and get admin approval first.
              </p>
            </div>
          ) : !showCardForm ? (
            <form
              className="payments-form"
              onSubmit={handleContinue}
            >
              <label>
                Approved Booking
                <select
                  value={selectedBooking}
                  onChange={(event) =>
                    setSelectedBooking(event.target.value)
                  }
                  required
                >
                  <option value="">
                    Select an approved booking
                  </option>

                  {payableBookings.map((booking) => (
                    <option
                      key={booking._id}
                      value={booking._id}
                    >
                      {booking.room?.roomNumber || "Room"} -{" "}
                      {booking.room?.building || "Hostel"} (
                      {money(
                        booking.room?.pricePerSemester
                      )})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount (LKR)
                <input
                  type="text"
                  value={
                    selectedRoomBooking
                      ? money(price)
                      : ""
                  }
                  placeholder="Select a booking first"
                  readOnly
                />
              </label>

              <button
                type="submit"
                className="payments-pay-btn"
                disabled={!selectedBooking}
              >
                <CreditCard size={18} />
                Continue to Card Payment
              </button>
            </form>
          ) : (
            <div className="payments-card-checkout">
              <button
                type="button"
                className="payments-card-cancel"
                onClick={resetCard}
                disabled={paying}
              >
                <ArrowLeft size={15} />
                Back to Booking
              </button>

              <h3>Card Payment</h3>
              <p>
                Complete your accommodation payment
                using demo card information.
              </p>

              {/* CARD PREVIEW */}
              <div className="payments-card-preview">
                <div className="payments-card-preview-header">
                  <span className="payments-card-brand">
                    HOSTEL MS
                  </span>
                  <CreditCard size={28} />
                </div>

                <div className="payments-card-preview-number">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="payments-card-preview-footer">
                  <div>
                    <span>CARDHOLDER</span>
                    <strong>
                      {cardholder || "STUDENT NAME"}
                    </strong>
                  </div>

                  <div>
                    <span>EXPIRES</span>
                    <strong>{expiry || "MM/YY"}</strong>
                  </div>
                </div>
              </div>

              {/* CARD FORM */}
              <form
                className="payments-card-form"
                onSubmit={handlePay}
                autoComplete="off"
              >
                <label>
                  Cardholder Name
                  <input
                    type="text"
                    placeholder="Test Student"
                    value={cardholder}
                    onChange={(event) =>
                      setCardholder(event.target.value)
                    }
                    maxLength={60}
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  Card Number
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(event) =>
                      handleCardNumber(event.target.value)
                    }
                    maxLength={19}
                    autoComplete="off"
                    required
                  />
                </label>

                <div className="payments-card-form-row">
                  <label>
                    Expiry Date
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(event) =>
                        handleExpiry(event.target.value)
                      }
                      maxLength={5}
                      autoComplete="off"
                      required
                    />
                  </label>

                  <label>
                    CVV (Demo Only)
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="123"
                      value={cvv}
                      onChange={(event) =>
                        setCvv(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 3)
                        )
                      }
                      maxLength={3}
                      autoComplete="off"
                      required
                    />
                  </label>
                </div>

                <div className="payments-card-amount">
                  <span>Total Amount</span>
                  <strong>{money(price)}</strong>
                </div>

                <div className="payments-card-demo-notice">
                  <LockKeyhole size={18} />
                  <div>
                    <strong>Demo checkout only</strong>
                    <p>
                      Use only the test details below.
                      Never enter your actual card details.
                      No real money will be charged.
                    </p>
                    <p>
                      Test Card: 4242 4242 4242 4242
                      <br />
                      Expiry: 12/28
                      <br />
                      CVV: 123
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="payments-card-submit"
                  disabled={paying}
                >
                  <LockKeyhole size={18} />
                  {paying
                    ? "Processing Demo Payment..."
                    : `Pay ${money(price)} (Demo)`}
                </button>
              </form>
            </div>
          )}

          <p className="payments-demo-note">
            Demonstration payment system only.
            No real card is processed and no real money is charged.
          </p>
        </section>
      )}

      {/* CHARTS */}
      <div className="payments-charts-grid">
        <section className="payments-chart-card">
          <div className="payments-chart-heading">
            <div>
              <h2>Payment Status</h2>
              <p>Transaction distribution</p>
            </div>
            <ReceiptText size={19} />
          </div>

          <div className="payments-chart-content">
            {statusChart.length === 0 ? (
              <div className="payments-chart-empty">
                No payment data yet.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusChart.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="payments-chart-card">
          <div className="payments-chart-heading">
            <div>
              <h2>Revenue Overview</h2>
              <p>Monthly successful payments</p>
            </div>
            <TrendingUp size={19} />
          </div>

          <div className="payments-chart-content">
            {monthlyChart.length === 0 ? (
              <div className="payments-chart-empty">
                No revenue data yet.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <BarChart
                  data={monthlyChart}
                  margin={{
                    top: 10,
                    right: 12,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={65}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={65}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* SEARCH */}
      <div className="payments-toolbar">
        <div className="payments-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              isStaff
                ? "Search student, room, reference..."
                : "Search room, reference, method..."
            }
          />
        </div>

        <div className="payments-filter-group">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter payment status"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <button
            type="button"
            className="payments-clear-btn"
            onClick={clearFilters}
          >
            <FilterX size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* PAYMENT HISTORY */}
      <section className="payments-table-panel">
        <div className="payments-table-header">
          <div>
            <h2>Payment History</h2>
            <p>
              Showing {filteredPayments.length} of{" "}
              {payments.length} transactions
            </p>
          </div>

          <span className="payments-count">
            {filteredPayments.length} Records
          </span>
        </div>

        {loading ? (
          <div className="payments-empty">
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="payments-empty">
            <ReceiptText size={35} />
            <h3>No Payments Found</h3>
            <p>
              There are no matching payment records.
            </p>
          </div>
        ) : (
          <div className="payments-table-scroll">
            <table className="payments-table">
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
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    {isStaff && (
                      <td>
                        {payment.student?.name || "-"}
                      </td>
                    )}

                    <td>
                      <div className="payments-room-cell">
                        <BedDouble size={17} />
                        {payment.booking?.room
                          ?.roomNumber || "-"}
                      </div>
                    </td>

                    <td className="payments-amount-cell">
                      {money(payment.amount)}
                    </td>

                    <td>
                      <span className="payments-method">
                        <CreditCard size={15} />
                        {payment.method || "-"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`payments-status payments-status-${payment.status}`}
                      >
                        <span className="payments-status-dot" />
                        {payment.status || "Unknown"}
                      </span>
                    </td>

                    <td className="payments-ref">
                      {payment.transactionRef || "-"}
                    </td>

                    <td>
                      {formatDate(
                        payment.paidAt || payment.createdAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Payments;
