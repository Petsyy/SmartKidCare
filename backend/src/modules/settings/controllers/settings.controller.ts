import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settings.service";

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { schoolName, address } = req.body;
    const settings = await settingsService.updateSettings({
      schoolName,
      address,
    });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
