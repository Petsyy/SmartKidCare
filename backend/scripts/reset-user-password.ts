import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../src/models/Users";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

const resetUserPassword = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🔐 USER TO RESET (CHANGE THESE)
    const userEmail = "mariareyes@gmail.com"; // Email of user to reset
    const newPassword = "Arenasdiaz5678*"; // New temporary password

    // 🚫 Check if user exists
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`⚠ User with email ${userEmail} not found.`);
      process.exit(0);
    }

    // 🔐 Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        mustChangePassword: true, // Force user to change password on next login
      }
    );

    console.log("🎉 Password reset successfully");
    console.log("📧 Email:", userEmail);
    console.log("👤 Name:", `${user.firstName} ${user.lastName}`);
    console.log("🔑 New Password:", newPassword);
    console.log("⚠ User MUST change password on next login");
  } catch (error: any) {
    console.error("❌ Failed to reset password:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetUserPassword();
