import { NextFunction, Request, Response } from "express";

export type AppRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type AppErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
