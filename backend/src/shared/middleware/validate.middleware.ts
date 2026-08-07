import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export type RequestPart = "body" | "query" | "params";

export const validate =
  (schema: ZodTypeAny, part: RequestPart = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[part]);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        message: firstIssue?.message || "Invalid request payload.",
      });
    }

    if (part === "query") {
      const query = req.query as Record<string, unknown>;
      Object.keys(query).forEach((key) => {
        delete query[key];
      });
      Object.assign(query, parsed.data as Record<string, unknown>);
    } else if (part === "params") {
      const params = req.params as Record<string, unknown>;
      Object.keys(params).forEach((key) => {
        delete params[key];
      });
      Object.assign(params, parsed.data as Record<string, unknown>);
    } else {
      (req as any).body = parsed.data;
    }
    return next();
  };
