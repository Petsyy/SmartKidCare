import { Request, Response } from "express";
import { adminCenterRepository } from "./admin.repository";

const normalizeOptionalString = (value: unknown): string | undefined => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
};

export const getDaycareCenters = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const barangay = normalizeOptionalString(req.query.barangay);
    const query: Record<string, unknown> = {};
    if (barangay) {
      query.barangay = barangay;
    }

    const centers = await adminCenterRepository.find(query);

    return res.json({ centers });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createDaycareCenter = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const name = String(req.body?.name ?? "").trim();
    const barangay = String(req.body?.barangay ?? "").trim();
    const code = String(req.body?.code ?? "").trim().toUpperCase();
    const address = String(req.body?.address ?? "").trim();

    if (!name || !barangay || !code) {
      return res.status(400).json({ message: "Name, barangay, and code are required." });
    }

    const existing = await adminCenterRepository.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: "Center code already exists." });
    }

    const center = await adminCenterRepository.create({
      name,
      barangay,
      code,
      address,
      isActive: req.body?.isActive !== false,
    });

    return res.status(201).json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateDaycareCenter = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const updates: Record<string, unknown> = {};
    if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body?.barangay !== undefined) updates.barangay = String(req.body.barangay).trim();
    if (req.body?.address !== undefined) updates.address = String(req.body.address).trim();
    if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const center = await adminCenterRepository.updateById(String(req.params.id), updates);

    if (!center) {
      return res.status(404).json({ message: "Center not found." });
    }

    return res.json({ center });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
