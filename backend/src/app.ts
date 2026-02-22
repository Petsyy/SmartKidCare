import express, { Application } from "express";
import cors from "cors";
// import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.routes";
import childRoutes from "./routes/child.routes";
import adminRoutes from "./routes/admin.routes";
import recordsRoutes from "./routes/records.routes";
import blockchainRoutes from "./routes/blockchain.routes";
import aiRoutes from "./routes/ai.routes";
import notificationRoutes from "./routes/notification.routes";

const app: Application = express();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }
  next();
});

app.use("/api/notifications", notificationRoutes);
app.use(limiter);
// app.use(morgan("dev")); // HTTP request logging disabled
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ai", aiRoutes);

export default app;
