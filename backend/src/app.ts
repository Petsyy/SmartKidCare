import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
// import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.routes";
import childRoutes from "./routes/child.routes";
import adminRoutes from "./routes/admin.routes";
import recordsRoutes from "./routes/records.routes";
import aiRoutes from "./routes/ai.routes";
import notificationRoutes from "./routes/notification.routes";
import documentsRoutes from "./routes/documents.routes";
import { auditLogMiddleware } from "./middlewares/auditLog.middleware";

const app: Application = express();
const isProduction = process.env.NODE_ENV === "production";

const staticSecurityFiles = {
  robots: "User-agent: *\nDisallow: /\n",
  sitemap: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>\n",
};

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  skip: (req) => {
    const method = String(req.method || "").toUpperCase();
    const hasSessionCookie = Boolean(req.cookies?.authToken);
    const hasAuthHeader = Boolean(req.headers.authorization?.startsWith("Bearer "));

    // Prevent refresh bursts from tripping global limits for authenticated reads.
    return method === "GET" && (hasSessionCookie || hasAuthHeader);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => Boolean(origin) && origin !== "*");

const connectSrc = ["'self'", ...allowedOrigins];

app.disable("x-powered-by");


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
app.use(auditLogMiddleware);

app.get("/", (req, res) => {
  res.json({ message: "SmartKidCare API running" });
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain; charset=utf-8").send(staticSecurityFiles.robots);
});

app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml; charset=utf-8").send(staticSecurityFiles.sitemap);
});

app.use("/api/notifications", notificationRoutes);
app.use(limiter);
// app.use(morgan("dev")); // HTTP request logging disabled
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

export default app;
