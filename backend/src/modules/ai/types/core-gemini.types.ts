export type GeminiResponseMode = "text" | "json";

export type AskGeminiOptions = {
  mode?: GeminiResponseMode;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
};
