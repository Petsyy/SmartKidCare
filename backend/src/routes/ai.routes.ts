import { Router } from "express";
import { askGemini } from "../services/gemini.service";
import { buildAIContext } from "../services/aiContext.service";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const {
      role,
      attendanceSummary,
      feedingSummary,
      insights,
      message,
    } = req.body ?? {};

    if (!role || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Invalid request: role and message are required.",
      });
    }

    const prompt = buildAIContext({
      role,
      attendanceSummary: attendanceSummary ?? "No attendance data available.",
      feedingSummary: feedingSummary ?? "No feeding data available.",
      insights: Array.isArray(insights) ? insights : [],
      question: message.trim(),
    });

    const reply = await askGemini(prompt);

    res.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI chat failed";
    console.error("AI chat error:", error);
    res.status(500).json({ message });
  }
});

export default router;
