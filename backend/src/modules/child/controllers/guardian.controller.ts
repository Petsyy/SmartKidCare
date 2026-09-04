import { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import {  guardianService  } from "../services/guardian.service";

export const addGuardianHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await guardianService.addGuardian(
      req.user as any,
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: result });
  },
);

export const updateGuardianHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await guardianService.updateGuardian(
      req.user as any,
      req.params.id as string,
      Number(req.params.guardianIndex),
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const removeGuardianHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await guardianService.removeGuardian(
      req.user as any,
      req.params.id as string,
      Number(req.params.guardianIndex),
    );
    res.status(200).json({ success: true, message: "Guardian removed" });
  },
);

export const getGuardiansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await guardianService.getGuardians(req.user as any, req.params.id as string);
    res.status(200).json({ success: true, data: result });
  },
);
