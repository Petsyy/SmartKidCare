import { Request, Response } from "express";
import {
  handleAiChatRequest,
  invalidateAiContext,
} from "../services/core/ai-chat.service";
import { asyncHandler } from "../../../shared/utils/async-handler";

export const aiChatController = asyncHandler(async (req: Request, res: Response) => {
  const result = await handleAiChatRequest({
    body: req.body,
    user: req.user,
  });
  Object.entries(result.headers ?? {}).forEach(([name, value]) =>
    res.setHeader(name, value),
  );
  return res.status(result.status).json(result.body);
});

export const invalidateAiContextController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await invalidateAiContext({
      contextId: String(req.params.contextId),
      user: req.user,
    });
    return result.status === 204
      ? res.status(204).send()
      : res.status(result.status).json(result.body);
  },
);
