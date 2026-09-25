import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { concernService } from "../services/concern.service";
import type {
  CreateConcernInput,
  ListConcernsInput,
  AddConcernMessageInput,
  UpdateConcernStatusInput,
} from "../types/concern.types";

export const createConcern = asyncHandler(async (req: Request, res: Response) => {
  const data = await concernService.create(req.user!, req.body as CreateConcernInput);
  res.status(201).json({ success: true, data });
});

export const listConcerns = asyncHandler(async (req: Request, res: Response) => {
  const result = await concernService.list(req.user!, req.query as unknown as ListConcernsInput);
  res.status(200).json({ success: true, ...result });
});

export const getConcern = asyncHandler(async (req: Request, res: Response) => {
  const data = await concernService.getById(req.user!, String(req.params.id));
  res.status(200).json({ success: true, data });
});

export const addConcernMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = await concernService.addMessage(
    req.user!,
    String(req.params.id),
    req.body as AddConcernMessageInput,
  );
  res.status(201).json({ success: true, data });
});

export const updateConcernStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await concernService.updateStatus(
    req.user!,
    String(req.params.id),
    req.body as UpdateConcernStatusInput,
  );
  res.status(200).json({ success: true, data });
});
