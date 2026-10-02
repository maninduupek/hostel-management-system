// Run with: npm run seed
// Creates one admin account and a handful of sample rooms.
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Room from "../models/Room.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  await User.deleteMany({ role: "admin" });
  await Room.deleteMany();

  await User.create({
    name: "System Admin",
    email: "admin@hostel.com",
    password: "admin123",
    role: "admin",
  });

  await Room.insertMany([
    {
      roomNumber: "A101",
      building: "Block A",
      floor: 1,
      type: "double",
      capacity: 2,
      genderRestriction: "male",
      pricePerSemester: 35000,
      amenities: ["Wi-Fi", "Attached Bathroom"],
    },
    {
      roomNumber: "A102",
      building: "Block A",
      floor: 1,
      type: "single",
      capacity: 1,
      genderRestriction: "male",
      pricePerSemester: 50000,
      amenities: ["Wi-Fi", "Study Desk"],
    },
    {
      roomNumber: "B201",
      building: "Block B",
      floor: 2,
      type: "shared",
      capacity: 4,
      genderRestriction: "female",
      pricePerSemester: 25000,
      amenities: ["Wi-Fi", "Balcony"],
    },
  ]);

  console.log("Seed data created. Admin login -> admin@hostel.com / admin123");
  process.exit();
};

seed();
