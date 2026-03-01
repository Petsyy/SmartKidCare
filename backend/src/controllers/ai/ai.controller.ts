import { Request, Response } from "express";
import { askGemini } from "../../services/ai/gemini.service";
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

    if (isGreeting(message)) {
      return res.status(200).json({
        reply:
          "Hello, you can ask about a child's attendance, feeding status, or record verification.",
      });
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

    const prompt = `
You are an AI assistant inside a child monitoring system.

STRICT RULES:
- Answer ONLY using the provided record.
- Do NOT guess.
- Do NOT summarize unrelated data.
- Keep answer short and clear.

User Role: ${role}

Child:
- Name: ${child.name}
- ID: ${child.id}

Record:
- Date: ${record.date}
- Attendance: ${record.attendanceStatus || "Not recorded"}
- Feeding: ${record.feedingStatus || "Not recorded"}
- Verified: ${record.verified}

User Question:
${message}
`;
    const reply = await askGemini(prompt);

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      message: "AI chat failed",
    });
  }
}
