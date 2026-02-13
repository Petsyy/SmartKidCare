
import express, { Application } from "express";
import cors from "cors";
// import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import childRoutes from "./routes/child.routes";
import adminRoutes from "./routes/admin.routes";
import recordsRoutes from "./routes/records.routes";
import blockchainRoutes from "./routes/blockchain.routes";
import aiRoutes from "./routes/ai.routes";

const app: Application = express();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(limiter);
// app.use(morgan("dev")); // HTTP request logging disabled
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ai", aiRoutes);

export default app;
