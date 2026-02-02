import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import childRoutes from "./routes/child.routes";
import adminRoutes from "./routes/admin.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);

export default app;
