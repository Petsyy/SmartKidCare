import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { captainActivationService } from "../services/captain-activation.service";

export const validateCaptainInvitation = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await captainActivationService.validate(req.body.token));
  },
);

export const activateCaptainInvitation = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await captainActivationService.activate(
        req.body.token,
        req.body.newPassword,
      ),
    );
  },
);
