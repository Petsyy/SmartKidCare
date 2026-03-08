import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(__dirname, "../../../src/data");
const AI_INTERACTIONS_FILE = path.join(
  DATA_DIR,
  "ai_interactions_dataset.json",
);
const RAG_EVALUATION_FILE = path.join(DATA_DIR, "rag_evaluation_dataset.json");

interface AIInteraction {
  category: string;
  question: string;
  context: InteractionContext;
  answer: string;
  timestamp: string;
}

interface RAGEvaluation {
  id: string;
  category: string;
  question: string;
  contexts: string[];
  answer: string;
  ground_truth: string;
  source: string;
  timestamp: string;
}

interface InteractionContext {
  childName?: string;
  attendance?: string;
  feedingCompletion?: string;
  date?: string;
  verified?: boolean;
}

function normalizeText(value?: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "Not recorded";
}

/**
 * Detect question category based on question and context
 */
function detectCategory(question: string, context: InteractionContext): string {
  const lowerQuestion = question.toLowerCase();

  // Attendance-related questions
  if (
    lowerQuestion.includes("present") ||
    lowerQuestion.includes("attendance") ||
    lowerQuestion.includes("here")
  ) {
    return "attendance_status";
  }

  // Feeding-related questions
  if (
    lowerQuestion.includes("eat") ||
    lowerQuestion.includes("feeding") ||
    lowerQuestion.includes("meal") ||
    lowerQuestion.includes("food")
  ) {
    return "feeding_status";
  }

  // Risk analysis questions
  if (
    lowerQuestion.includes("risk") ||
    lowerQuestion.includes("concern") ||
    lowerQuestion.includes("warning")
  ) {
    return "risk_analysis";
  }

  // Summary/trend questions
  if (
    lowerQuestion.includes("trend") ||
    lowerQuestion.includes("pattern") ||
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("week") ||
    lowerQuestion.includes("month")
  ) {
    return "trend_analysis";
  }

  // Recommendations questions
  if (
    lowerQuestion.includes("recommend") ||
    lowerQuestion.includes("suggest") ||
    lowerQuestion.includes("should")
  ) {
    return "recommendations";
  }

  return "general";
}

function buildRagasContextArray(context: InteractionContext): string[] {
  const contexts: string[] = [];

  if (context.childName && context.childName.trim()) {
    contexts.push(`Child: ${context.childName.trim()}`);
  }

  if (context.date && context.date.trim()) {
    contexts.push(`Date: ${context.date.trim()}`);
  }

  // Determine attendance status
  if (context.attendance && context.attendance.trim()) {
    const attendance = context.attendance.trim();
    const isPresent =
      attendance.toLowerCase().includes("present") || attendance === "100%";
    contexts.push(`Attendance Status: ${isPresent ? "Present" : "Absent"}`);
    contexts.push(`Attendance Rate: ${attendance}`);
  }

  if (context.feedingCompletion && context.feedingCompletion.trim()) {
    contexts.push(`Feeding Completion: ${context.feedingCompletion.trim()}`);
  }

  if (typeof context.verified === "boolean") {
    contexts.push(
      `Verification Status: ${context.verified ? "Verified" : "Unverified"}`,
    );
  }

  return contexts.length > 0 ? contexts : ["No context available"];
}

function buildGroundTruthFromContext(context: InteractionContext): string {
  const childName = normalizeText(context.childName);
  const attendance = normalizeText(context.attendance);

  if (childName === "Not recorded" && attendance === "Not recorded") {
    return "No specific child attendance record is available for this query.";
  }

  return `${childName} was present today with ${attendance} attendance.`;
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

/**
 * Ensure JSON files exist with proper structure
 */
async function ensureFilesExist(): Promise<void> {
  await ensureDataDir();

  // Ensure ai_interactions_dataset.json exists
  try {
    await fs.access(AI_INTERACTIONS_FILE);
  } catch {
    await fs.writeFile(AI_INTERACTIONS_FILE, JSON.stringify([], null, 2));
  }

  // Ensure rag_evaluation_dataset.json exists
  try {
    await fs.access(RAG_EVALUATION_FILE);
  } catch {
    await fs.writeFile(RAG_EVALUATION_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Read existing data from a JSON file
 */
async function readDataFile<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

/**
 * Write data to a JSON file
 */
async function writeDataFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

/**
 * Log AI interaction to both datasets
 */
export async function logAIInteraction(
  question: string,
  context: InteractionContext,
  answer: string,
  category?: string,
  groundTruth?: string,
): Promise<void> {
  try {
    await ensureFilesExist();

    const timestamp = new Date().toISOString();
    // Auto-detect category if not provided
    const detectedCategory = category || detectCategory(question, context);

    // Log to ai_interactions_dataset.json
    const aiInteractions =
      await readDataFile<AIInteraction>(AI_INTERACTIONS_FILE);
    aiInteractions.push({
      category: detectedCategory,
      question,
      context,
      answer,
      timestamp,
    });
    await writeDataFile(AI_INTERACTIONS_FILE, aiInteractions);

    // Log to rag_evaluation_dataset.json
    const ragEvaluations =
      await readDataFile<RAGEvaluation>(RAG_EVALUATION_FILE);
    ragEvaluations.push({
      id: randomUUID(),
      category: detectedCategory,
      question,
      contexts: buildRagasContextArray(context),
      answer,
      ground_truth:
        typeof groundTruth === "string" && groundTruth.trim().length > 0
          ? groundTruth.trim()
          : buildGroundTruthFromContext(context),
      source: "smartkidcare_database",
      timestamp,
    });
    await writeDataFile(RAG_EVALUATION_FILE, ragEvaluations);

    console.info("AI interaction logged successfully");
  } catch (error) {
    console.error("Error logging AI interaction:", error);
    // Don't throw - logging should not break the application
  }
}

/**
 * Get all AI interactions
 */
export async function getAIInteractions(): Promise<AIInteraction[]> {
  await ensureFilesExist();
  return readDataFile<AIInteraction>(AI_INTERACTIONS_FILE);
}

/**
 * Get all RAG evaluations
 */
export async function getRAGEvaluations(): Promise<RAGEvaluation[]> {
  await ensureFilesExist();
  return readDataFile<RAGEvaluation>(RAG_EVALUATION_FILE);
}

/**
 * Clear all interactions (for testing/reset)
 */
export async function clearAllInteractions(): Promise<void> {
  try {
    await ensureFilesExist();
    await writeDataFile(AI_INTERACTIONS_FILE, []);
    await writeDataFile(RAG_EVALUATION_FILE, []);
    console.info("All interactions cleared");
  } catch (error) {
    console.error("Error clearing interactions:", error);
  }
}
