import { Request, Response } from "express";
import { handleAiChatRequest } from "./ai-chat.service";

export const aiChatController = async (req: Request, res: Response) => {
  const result = await handleAiChatRequest({
    body: req.body,
    user: req.user,
  });

  return res.status(result.status).json(result.body);
};
