import { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { pickupService } from "../services/pickup.service";
import { PickupAuthUser } from "../types/pickup.types";

export const getPickupEligibleChildren = asyncHandler(
  async (req: Request, res: Response) => {
    const children = await pickupService.getPickupEligibleChildren(
      req.user as PickupAuthUser,
    );
    res.status(200).json({ success: true, data: children });
  },
);

export const requestPickupCode = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await pickupService.requestPickupCode(
      req.user as PickupAuthUser,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const verifyPickupCode = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await pickupService.verifyPickupCode(
      req.user as PickupAuthUser,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const manualRelease = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await pickupService.manualRelease(
      req.user as PickupAuthUser,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const getPickupStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { childId } = req.params;
    const result = await pickupService.getPickupStatus(
      req.user as PickupAuthUser,
      childId as string,
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const getPickupHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await pickupService.getPickupHistory(
      req.user as PickupAuthUser,
      req.query,
    );
    if (Array.isArray(result)) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  },
);
