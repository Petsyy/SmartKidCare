import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../src/models/Users"; //  correct import

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🔐 ADMIN CREDENTIALS (CHANGE THESE)
    const adminUsername = "admin"; // admin username
    const adminEmail = "peterarenasdiaz16@gmail.com"; // admin email
    const adminPassword = "admin123"; // change after first login

    // 🚫 Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }],
      role: "admin",
    });

    if (existingAdmin) {
      console.log("⚠ Admin already exists. Aborting.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      username: adminUsername, // ✅ admin-only
      firstName: "Peter",
      lastName: "Arenas",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      mustChangePassword: false,
    });

    console.log("🎉 Admin account created successfully");
    console.log("👤 Username:", adminUsername);
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("⚠ Please change the password immediately after login");
  } catch (error: any) {
    console.error("❌ Failed to create admin:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
