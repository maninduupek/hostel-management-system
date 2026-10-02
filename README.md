# Hostel / Accommodation Management System

A full-stack MERN (MongoDB, Express, React, Node) web application for managing hostel/accommodation
bookings, built for EC4307 Web Application Development.

## Features

- **Authentication & Roles** — JWT-based login/register, with `admin`, `warden`, and `student` roles.
- **Room Management** — CRUD for rooms with building, floor, type, capacity, gender restriction, amenities, pricing.
- **Booking Engine** — Students request a room; admin/warden approves or rejects. Approval automatically
  fills the room's occupant list and updates its status (available/full). Cancellation/check-out frees the slot again.
- **Payments** — Students pay for an approved booking (mock payment gateway that generates a transaction reference).
- **Complaints / Maintenance Tickets** — Students raise issues by category/priority; staff track status
  (open → in_progress → resolved → closed).
- **Admin Analytics Dashboard** — Live stats: occupancy rate, total revenue, pending bookings, complaints
  breakdown by category, etc.

## Tech Stack

- **Frontend:** React 18 (Vite), React Router, Axios, plain CSS
- **Backend:** Node.js, Express, JWT, bcrypt
- **Database:** MongoDB (Mongoose ODM)

## Project Structure

```
hostel-management-system/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Room, Booking, Payment, Complaint
│   ├── controllers/            # Business logic for each resource
│   ├── routes/                 # Express route definitions
│   ├── middleware/auth.js      # JWT protect + role-based authorize
│   ├── seed/seedData.js        # Creates an admin account + sample rooms
│   └── server.js               # App entry point
└── frontend/
    └── src/
        ├── api/axios.js        # Axios instance with auth header injection
        ├── context/AuthContext.jsx
        ├── components/         # Navbar, RoomCard, StatCard, ProtectedRoute
        ├── pages/               # Login, Register, Rooms, Bookings, Payments, Complaints, Dashboards
        └── styles/index.css
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally (`mongodb://127.0.0.1:27017`) OR a MongoDB Atlas connection string
- VS Code (or any editor)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your `MONGO_URI` and a strong `JWT_SECRET`. Then seed an admin account and sample rooms:

```bash
npm run seed
```

This creates:
- Admin login: `admin@hostel.com` / `admin123`
- 3 sample rooms across two buildings

Start the backend (runs on `http://localhost:5000`):

```bash
npm run dev
```

### 2. Frontend Setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend automatically
(see `vite.config.js`).

### 3. Using the App

1. Go to `http://localhost:5173`
2. Register as a student, or log in as admin (`admin@hostel.com` / `admin123`)
3. As a student: browse rooms → book a room → wait for admin approval → pay → raise complaints if needed
4. As admin: approve/reject bookings, manage rooms via API (or extend the UI — see "Next Steps"), resolve
   complaints, and view the analytics dashboard

## API Overview

| Method | Endpoint                     | Access          | Description                    |
|--------|-------------------------------|-----------------|---------------------------------|
| POST   | /api/auth/register            | Public          | Register a student              |
| POST   | /api/auth/login                | Public          | Login, returns JWT              |
| GET    | /api/auth/me                   | Logged in       | Current user profile            |
| GET    | /api/rooms                     | Logged in       | List rooms (filterable)         |
| POST   | /api/rooms                     | Admin/Warden    | Create room                     |
| PUT    | /api/rooms/:id                 | Admin/Warden    | Update room                     |
| DELETE | /api/rooms/:id                 | Admin           | Delete room                     |
| POST   | /api/bookings                  | Student         | Request a booking               |
| GET    | /api/bookings                  | Logged in       | List bookings (own or all)      |
| PUT    | /api/bookings/:id/status       | Admin/Warden    | Approve/reject/checkout         |
| POST   | /api/payments                  | Student         | Pay for an approved booking     |
| GET    | /api/payments                  | Logged in       | List payments (own or all)      |
| POST   | /api/complaints                | Student         | Raise a complaint                |
| GET    | /api/complaints                | Logged in       | List complaints (own or all)     |
| PUT    | /api/complaints/:id            | Admin/Warden    | Update complaint status          |
| GET    | /api/dashboard/stats           | Admin/Warden    | Aggregated analytics             |

## Suggested Extensions (to push the project further for "advanced" marks)

- Add a room-management admin UI (currently CRUD works via API, e.g. Postman — a form-based admin page
  would round this out nicely)
- Email notifications (e.g. via Nodemailer) on booking approval / payment confirmation
- Exportable PDF/Excel occupancy and revenue reports
- Roommate-matching logic based on stated preferences
- Pagination and search on the rooms/bookings tables
- Unit/integration tests (Jest + Supertest for backend, React Testing Library for frontend)

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- Payments use a **mock** gateway (no real transactions) — swap in a real provider (Stripe, PayHere, etc.)
  if your course requires a live integration.
- CORS is open (`cors()`) for local development; restrict allowed origins before any real deployment.
