import {
  summarizeAttendanceTool,
  summarizeChildTrendTool,
  summarizeFeedingTool,
  generateChildReportTool,
} from "./agent-tools.service";
import { ToolTimeframe } from "../../types/agent-tools.types";
import type { AIResponseLanguage } from "../../types/core-ai-chat.types";
import type { AttendanceComparisonResult, FeedingComparisonResult } from "../../types/generators-ai-writer-render.types";
import { buildConversationId, writeToolNarrative } from "../generators/ai-writer.service";
import { inputIsGibberish } from "../../../../shared/utils/ai-input-sanitizer";
import type { AgentContext } from "../../types/agents-agent.types";

abstract class BaseAgent {
  constructor(
    protected context: AgentContext,
    protected question: string,
  ) { }

  abstract handle(): Promise<string>;

  protected get conversationId(): string {
    if (this.context.conversationId) return this.context.conversationId;
    return buildConversationId({
      requesterId: this.context.requesterId,
      role: this.context.role,
      childId: this.context.childId,
      language: this.context.language,
    });
  }

  protected inferTimeframe(): ToolTimeframe {
    const lower = this.question.toLowerCase();
    if (lower.includes("30 days")) return "recent";
    if (lower.includes("month")) return "month";
    if (lower.includes("last week") || lower.includes("previous week")) return "last_week";
    if (lower.includes("today")) return "today";
    if (lower.includes("week")) return "week";
    return "recent";
  }

  protected async respond(result: any): Promise<string> {
    return writeToolNarrative({
      result,
      role: this.context.role,
      question: this.question,
      language: this.context.language,
      conversationId: this.conversationId,
      suppressFollowUp: this.context.suppressFollowUp,
    });
  }
}

class AttendanceAgent extends BaseAgent {
  async handle() {
    const timeframe = this.inferTimeframe();

    if (this.question.toLowerCase().match(/\b(improv\w*|compar\w*|versus|vs)\b/)) {
      const [current, last] = await Promise.all([
        summarizeAttendanceTool(this.context.childId, "week"),
        summarizeAttendanceTool(this.context.childId, "last_week"),
      ]);
      return this.respond({
        tool: "summarize_attendance_comparison",
        timeframe: "week",
        childName: current.childName || last.childName,
        currentWeek: current,
        lastWeek: last,
        deltaRate: Number((current.attendanceRate - last.attendanceRate).toFixed(2)),
      } as AttendanceComparisonResult);
    }

    const result = await summarizeAttendanceTool(this.context.childId, timeframe);
    return this.respond(result);
  }
}

class FeedingAgent extends BaseAgent {
  async handle() {
    const timeframe = this.inferTimeframe();

    if (this.question.toLowerCase().match(/\b(improv\w*|compar\w*|versus|vs)\b/)) {
      const [current, last] = await Promise.all([
        summarizeFeedingTool(this.context.childId, "week"),
        summarizeFeedingTool(this.context.childId, "last_week"),
      ]);
      return this.respond({
        tool: "summarize_feeding_comparison",
        timeframe: "week",
        childName: current.childName || last.childName,
        currentWeek: current,
        lastWeek: last,
        deltaRate: Number((current.feedingRate - last.feedingRate).toFixed(2)),
      } as FeedingComparisonResult);
    }

    const result = await summarizeFeedingTool(this.context.childId, timeframe);
    return this.respond(result);
  }
}

class TrendAgent extends BaseAgent {
  async handle() {
    const result = await summarizeChildTrendTool(this.context.childId);
    return this.respond(result);
  }
}

class ReportAgent extends BaseAgent {
  async handle() {
    const timeframe = this.inferTimeframe();
    const result = await generateChildReportTool(this.context.childId, timeframe);
    return this.respond(result);
  }
}

export class AgentFactory {
  static create(question: string, context: AgentContext): BaseAgent | null {
    if (inputIsGibberish(question)) return null;

    const lower = question.toLowerCase();

    if (lower.match(/\b(trend|last 30 days|30 days)\b/)) {
      return new TrendAgent(context, question);
    }

    const hasAttendance = /\b(attendance|attend|present|absent|check[- ]?in)\b/.test(lower);
    const hasFeeding = /\b(feeding|feed|food|meal|meals|eat|ate|eaten|served)\b/.test(lower);
    const hasReportSignal = /\b(report|summary|overall|status|progress|risk)\b/.test(lower);

    if (hasAttendance && hasFeeding) return new ReportAgent(context, question);
    if (hasReportSignal) return new ReportAgent(context, question);
    if (hasAttendance) return new AttendanceAgent(context, question);
    if (hasFeeding) return new FeedingAgent(context, question);

    return null;
  }
}

export function shouldUseAIAgent(question: string): boolean {
  return AgentFactory.create(question, { childId: "tmp", role: "parent", language: "en" }) !== null;
}

export async function tryHandleAgentQuery(params: {
  role: string;
  question: string;
  childId?: string;
  requesterId?: string;
  language?: AIResponseLanguage;
  conversationId?: string;
  suppressFollowUp?: boolean;
}): Promise<string | null> {
  const childId = String(params.childId ?? "").trim();
  if (!childId) return "Please specify which child you want to check.";

  const context: AgentContext = {
    childId,
    role: params.role,
    language: params.language || "en",
    requesterId: params.requesterId,
    conversationId: params.conversationId,
    suppressFollowUp: params.suppressFollowUp,
  };

  const agent = AgentFactory.create(params.question, context);
  if (!agent) return null;

  return agent.handle();
}

export type { AgentContext } from "../../types/agents-agent.types";
