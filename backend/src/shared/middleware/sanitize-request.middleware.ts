import mongoSanitize from "express-mongo-sanitize";

import type { AppRequestHandler } from "../types/app.types";

export const sanitizeRequestInput: AppRequestHandler = (req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
};
