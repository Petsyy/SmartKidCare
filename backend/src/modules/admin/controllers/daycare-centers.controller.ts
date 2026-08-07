import { Request, Response } from "express";
import { daycareCenterService } from "../services/daycare-centers.service";
import { adminCenterRepository } from "../repositories/admin.repository";

export const getDaycareCenters = async (req: Request, res: Response) => {
  try {
    const { barangay } = req.query as { barangay?: string };
    
    const enrichedCenters = await daycareCenterService.getEnrichedDaycareCenters(barangay);

    return res.json({ centers: enrichedCenters });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createDaycareCenter = async (req: Request, res: Response) => {
  try {
    const { name, barangay, code, address, isActive } = req.body;

    const existing = await adminCenterRepository.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: "Center code already exists." });
    }

    const center = await adminCenterRepository.create({
      name,
      barangay,
      code,
      address: address || "",
      isActive: isActive !== false,
    });

    return res.status(201).json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateDaycareCenter = async (req: Request, res: Response) => {
  try {
    const center = await adminCenterRepository.updateById(String(req.params.id), req.body);

    if (!center) {
      return res.status(404).json({ message: "Center not found." });
    }

    return res.json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
