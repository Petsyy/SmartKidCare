import express, { Application } from "express";
import cors from "cors";
// import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import childRoutes from "./routes/child.routes";
import adminRoutes from "./routes/admin.routes";
import recordsRoutes from "./routes/records.routes";
import blockchainRoutes from "./routes/blockchain.routes";
import aiRoutes from "./routes/ai.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());
// app.use(morgan("dev")); // HTTP request logging disabled

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ai", aiRoutes);

export default app;
