// src/controllers/ai.controller.ts

import { Request, Response } from "express";
import { askGemini } from "../services/gemini.service";
import { buildAIContext } from "../services/aiContext.service";
import { AIChatRequest } from "../types/ai.types";

export async function aiChatController(
  req: Request,
  res: Response
) {
  try {
    const {
      role,
      attendanceSummary,
      feedingSummary,
      insights,
      message,
    } = req.body as AIChatRequest;

    // Basic validation
    if (!role || !message) {
      return res.status(400).json({
        message: "Invalid AI chat request",
      });
    }

    // Build context-limited prompt
    const prompt = buildAIContext({
      role,
      attendanceSummary: attendanceSummary || "No attendance data available",
      feedingSummary: feedingSummary || "No feeding data available",
      insights: insights || [],
      question: message,
    });

    // Ask Gemini
    const reply = await askGemini(prompt);

    // Return AI response
    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      message: "AI chat failed",
    });
  }
}
