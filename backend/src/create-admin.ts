import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin";

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB connected");

    const username = "Petsyy";
    const password = "petsyy123"; // Change this to your desired password
    const email = "peterarenasdiaz16@gmail.com"; // You can change this email

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log("Admin user already exists with this username");
      await mongoose.connection.close();
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await Admin.create({
      username: username,
      email: email,
      password: hashedPassword,
    });

    console.log("Admin user created successfully!");
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("User ID:", admin._id);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
