import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoUri = String(process.env.MONGO_URI || "").trim();

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is not set. Add it to backend/.env before starting the backend.",
    );
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isLocalUri = /localhost|127\.0\.0\.1|::1/i.test(mongoUri);
    const isConnectionRefused = /ECONNREFUSED/i.test(message);

    if (isLocalUri && isConnectionRefused) {
      console.error(
        "MongoDB connection failed: local MongoDB appears to be offline. Start your MongoDB service (or run a local MongoDB container) and try again.",
      );
    }

    throw error;
  }
};
