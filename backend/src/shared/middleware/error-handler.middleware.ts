import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";


export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Internal server error" });
};
