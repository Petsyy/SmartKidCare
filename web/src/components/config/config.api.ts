const rawApiBase = String(import.meta.env.VITE_API_BASE || "").trim();
const fallbackApiBase = "http://localhost:5000/api";

// Prevent URLs like "undefined/auth/..." when env var is missing.
export const API_BASE = (rawApiBase || fallbackApiBase).replace(/\/+$/, "");
