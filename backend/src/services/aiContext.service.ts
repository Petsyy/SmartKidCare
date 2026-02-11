export function buildAIContext({
  role,
  attendanceSummary,
  feedingSummary,
  insights,
  question,
}: {
  role: "parent" | "teacher" | "admin";
  attendanceSummary: string;
  feedingSummary: string;
  insights: string[];
  question: string;
}) {
  return `
You are an AI assistant inside a child monitoring system.

Rules:
- Answer ONLY using the provided data
- Do NOT give medical advice
- Do NOT guess missing information
- Keep answers appropriate for the user's role

User Role: ${role}

Guidelines:
- Parent: Use simple, non-technical language
- Teacher: Focus on attendance/feeding submission context
- Admin: Focus on verification, integrity, and system status

Attendance Summary:
${attendanceSummary}

Feeding Summary:
${feedingSummary}

AI Monitoring Insights:
${(insights && insights.length) ? insights.join("\n") : "None"}

User Question:
${question}
`;
}
