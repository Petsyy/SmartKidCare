import { Request, Response } from "express";
import { tryHandleAgentQuery } from "../../services/ai/agent.service";
import { detectResponseLanguage } from "../../services/ai/language.service";
import { inputIsGibberish } from "../../utils/ai-input-sanitizer";
import { AIChatRequest } from "../../types/ai.types";

function isGreeting(message: string) {
  const greetings = ["hello", "hi", "hey"];
  return greetings.some((g) => message.toLowerCase().trim().startsWith(g));
}

export async function aiChatController(req: Request, res: Response) {
  try {
    const { role, message, child, record } = req.body as AIChatRequest;

    if (!role || !message) {
      return res.status(400).json({
        message: "Invalid AI chat request",
      });
    }

    if (inputIsGibberish(message)) {
      return res.status(400).json({
        message:
          "I couldn't understand that. Please ask a clear question about attendance or feeding.",
      });
    }

    if (isGreeting(message)) {
      const greeting =
        "Hello, you can ask about a child's attendance, feeding status, or record verification.";

      return res.status(200).json({ reply: greeting });
    }

    if (!child || !record) {
      return res.status(200).json({
        reply:
          "Please select a specific child or record to get a detailed explanation.",
      });
    }

    if (record.verified === false) {
      return res.status(200).json({
        reply:
          "This record is marked as unverified because its database hash does not match the blockchain record. It may have been modified after submission.",
      });
    }

    const language = detectResponseLanguage(message);
    const reply = await tryHandleAgentQuery({
      role,
      question: message,
      childId: child.id,
      requesterId: String(req.user?.id ?? ""),
      language,
    });

    if (reply) {
      return res.status(200).json({ reply });
    }

    // Prepare context for logging
    const interactionContext = {
      childName: child.name,
      attendance: record.attendanceStatus || "Not recorded",
      feedingCompletion: record.feedingStatus || "Not recorded",
      date: record.date,
      verified: record.verified,
    };

    const fallbackReply =
      "I couldn't process that request through the attendance/feeding agent. Please ask a clear question about attendance or feeding for this child.";

    return res.status(200).json({ reply: fallbackReply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      message: "AI chat failed",
    });
  }
}
