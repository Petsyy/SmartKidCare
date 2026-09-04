import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import adminRoutes from "./modules/admin/routes/admin.routes";
import aiRoutes from "./modules/ai/routes/ai.routes";
import attendanceRoutes from "./modules/attendance/routes/attendance.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import blockchainRoutes from "./modules/blockchain/blockchain.routes";
import childRoutes from "./modules/child/routes/child.routes";
import competencyRoutes from "./modules/competencies/routes/competency.routes";
import documentsRoutes from "./modules/documents/routes/documents.routes";
import enrollmentRoutes from "./modules/enrollment/routes/enrollment.routes";
import feedingRoutes from "./modules/feeding/routes/feeding.routes";
import notificationRoutes from "./modules/notifications/routes/notification.routes";
import nutritionRoutes from "./modules/nutrition/routes/nutrition.routes";
import reportsRoutes from "./modules/reports/routes/reports.routes";
import settingsRoutes from "./modules/settings/routes/settings.routes";
import pickupRoutes from "./modules/pickup/routes/pickup.routes";
import { corsErrorHandler, corsOptions } from "./shared/config/cors";
import { globalApiLimiter } from "./shared/lib/global-api-rate-limit";
import { globalErrorHandler } from "./shared/middleware/error-handler.middleware";
import { sanitizeRequestInput } from "./shared/middleware/sanitize-request.middleware";

const app = express();

app.disable("x-powered-by");

app.use(cookieParser());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(sanitizeRequestInput);

app.get("/", (_req, res) => {
  res.json({ message: "SmartKidCare API running" });
});

app.use("/api/notifications", notificationRoutes);
app.use(globalApiLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records/attendance", attendanceRoutes);
app.use("/api/records/feeding", feedingRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/competencies", competencyRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/pickup", pickupRoutes);

app.use(corsErrorHandler);
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});
app.use(globalErrorHandler);

export default app;
