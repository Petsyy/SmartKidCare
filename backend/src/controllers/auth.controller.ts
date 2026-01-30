import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Worker";


export const workerRegister = async (req: Request, res: Response) => {
  try {
    console.log('Worker registration request received:', req.body);
    
    const { firstName, lastName, email, phone, password, documents } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      console.log('Missing required fields:', { firstName, lastName, email, phone, password });
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    console.log('Creating new worker:', { firstName, lastName, email, phone, role: 'worker' });

    const newWorker = await User.create({
      firstName,
      lastName,
      name: fullName,
      email,
      phone,
      password: hashedPassword,
      role: "worker",
      documents: documents || [],
      verificationStatus: "pending",
    });

    console.log('Worker created successfully:', newWorker._id);

    res.status(201).json({
      message: "Worker registered successfully. Your account is pending admin verification.",
      user: {
        id: newWorker._id,
        firstName: newWorker.firstName,
        lastName: newWorker.lastName,
        email: newWorker.email,
        phone: newWorker.phone,
        role: newWorker.role,
        verificationStatus: newWorker.verificationStatus,
      },
    });
  } catch (error: any) {
    console.error('Worker registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Workers must be approved before they can log in
    if (user.role === "worker" && user.verificationStatus !== "approved") {
      return res.status(403).json({
        message:
          user.verificationStatus === "pending"
            ? "Your account is pending verification. An admin will review your documents and approve your account soon."
            : "Your account has not been approved. Please contact support.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;
    res.json({ token, user: userResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** Returns the current user from the JWT (for mobile protected routes). */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, status } = req.query;
    
    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.verificationStatus = status;

    const users = await User.find(filter).select('-password');
    
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { verificationStatus } = req.body;

    if (!["pending", "approved", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { verificationStatus },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: `User ${verificationStatus} successfully`,
      user 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
