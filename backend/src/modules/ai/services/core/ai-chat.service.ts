import {
  AI_INPUT_LIMITS,
  inputIsGibberish,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../../../../shared/utils/ai-input-sanitizer";
import { aiChatSchema } from "../../validators/ai.validator";
import { aiChildRepository } from "../../repositories/ai.repository";
import {
  aiConversationRepository,
  createRequestHash,
  newContextId,
} from "../../repositories/ai-conversation.repository";
import {
  classifyMessageDeterministically,
  classifyParentMessage,
} from "./ai-intent-classifier.service";
import { buildDeterministicChatResponse } from "./ai-deterministic-response.service";
import { buildDomainPrompt, buildScopedQuestion, languageCopy } from "../../constants/chat-language.constants";
import type {
  AIChatSuccessBody,
  AIConversationStateRecord,
  AILanguageMode,
  AIMessageClassification,
  AIResponseLanguage,
  AuthContext,
  AiChatRequestContext,
  AiChatResult,
  FollowUpChoice,
  PendingTimeframe,
  PendingFollowUpState,
} from "../../types/core-ai-chat.types";

type ParsedAiChatRequest =
  | {
      ok: true;
      data: {
        role: "parent";
        requesterId: string;
        originalMessage: string;
        message: string;
        childId?: string;
        language?: AIResponseLanguage;
        languageMode?: AILanguageMode;
        resetContext: boolean;
        contextId?: string;
        requestId?: string;
      };
    }
  | { ok: false; status: number; message: string; code?: string };

export const sanitizeAiChatFallbackMessage = (message: unknown): string =>
  sanitizeAIMessageInput(message, AI_INPUT_LIMITS.messageMaxLength);

export const parseAiChatRequest = (
  body: unknown,
  auth: AuthContext,
): ParsedAiChatRequest => {
  const parsed = aiChatSchema.safeParse(body ?? {});
  if (!parsed.success) {
    const contextIssue = parsed.error.issues.find((issue) =>
      issue.path.includes("contextId"),
    );
    return {
      ok: false,
      status: 400,
      message: parsed.error.issues[0]?.message || "Invalid request.",
      ...(contextIssue ? { code: "AI_CONTEXT_ID_INVALID" } : {}),
    };
  }
  const role = String(auth.role ?? "").trim().toLowerCase();
  const requesterId = String(auth.id ?? "").trim();
  if (role !== "parent" || !requesterId) {
    return {
      ok: false,
      status: 403,
      message: "AI chat is for parent accounts only.",
    };
  }
  if (parsed.data.languageMode === "explicit" && !parsed.data.language) {
    return {
      ok: false,
      status: 400,
      message: "language is required when languageMode is explicit.",
    };
  }
  const message = sanitizeAIMessageInput(
    parsed.data.message,
    AI_INPUT_LIMITS.messageMaxLength,
  );
  if (!message) return { ok: false, status: 400, message: "Message is empty." };
  if (inputIsGibberish(message)) {
    return {
      ok: false,
      status: 400,
      message: "I couldn't understand that. Please ask about records.",
    };
  }
  const childId = sanitizeAIChildId(parsed.data.childId);
  const rawChildId =
    typeof parsed.data.childId === "string" ? parsed.data.childId.trim() : "";
  if (rawChildId && !childId) {
    return { ok: false, status: 400, message: "Invalid childId." };
  }
  return {
    ok: true,
    data: {
      role: "parent",
      requesterId,
      originalMessage: parsed.data.message,
      message,
      childId,
      language: parsed.data.language,
      languageMode: parsed.data.languageMode,
      resetContext: parsed.data.resetContext,
      contextId: parsed.data.contextId,
      requestId: parsed.data.requestId,
    },
  };
};

const autoLanguageFrom = (
  classification: AIMessageClassification,
  previous: AIResponseLanguage,
  _classifierUsedFallback: boolean,
): AIResponseLanguage => {
  if (classification.inputLanguage === "fil" || classification.inputLanguage === "mixed") {
    return "fil";
  }
  if (classification.inputLanguage === "en") return "en";
  return previous;
};

export const resolveResponseLanguage = (params: {
  context: AIConversationStateRecord;
  classification: AIMessageClassification;
  classifierUsedFallback: boolean;
  submittedLanguage?: AIResponseLanguage;
  submittedMode?: AILanguageMode;
}) => {
  const {
    context,
    classification,
    classifierUsedFallback,
    submittedLanguage,
    submittedMode,
  } = params;

  // Legacy clients that omit languageMode retain request-body language control.
  if (!submittedMode) {
    return {
      language: submittedLanguage ?? "en",
      mode: submittedLanguage ? ("explicit" as const) : ("auto" as const),
    };
  }

  if (classification.returnToAutomaticLanguage) {
    return {
      language: autoLanguageFrom(
        classification,
        context.responseLanguage,
        classifierUsedFallback,
      ),
      mode: "auto" as const,
    };
  }
  if (classification.requestedResponseLanguage) {
    return {
      language: classification.requestedResponseLanguage,
      mode: "explicit" as const,
    };
  }
  if (context.languageMode === "explicit") {
    return {
      language: context.responseLanguage,
      mode: "explicit" as const,
    };
  }
  return {
    language: autoLanguageFrom(
      classification,
      context.responseLanguage,
      classifierUsedFallback,
    ),
    mode: "auto" as const,
  };
};

const replayResult = async (params: {
  parentId: string;
  completed: Extract<
    Awaited<ReturnType<typeof aiConversationRepository.acquireRequest>>,
    { kind: "completed" }
  >;
}): Promise<AiChatResult> => {
  const response: AIChatSuccessBody = {
    ...params.completed.response,
    replayed: true,
  };
  const context = await aiConversationRepository.findAny(
    params.parentId,
    response.contextId,
  );
  const now = new Date();
  if (!context || context.expiresAt <= now) {
    response.contextStatus = "expired";
    delete response.followUp;
  } else if (context.invalidatedAt) {
    response.contextStatus = "invalidated";
    delete response.followUp;
  } else if (
    context.generation !== params.completed.committedGeneration ||
    context.version !== params.completed.committedVersion
  ) {
    response.contextStatus = "superseded";
    delete response.followUp;
  } else {
    response.contextStatus = "active";
    if (
      response.followUp &&
      (!context.pendingAction || context.pendingAction.expiresAt <= now)
    ) {
      delete response.followUp;
    }
  }
  return { status: params.completed.status, body: response };
};

const resolveContext = async (params: {
  parentId: string;
  childId: string;
  submittedContextId?: string;
  resetContext: boolean;
  initialLanguage: AIResponseLanguage;
  initialMode: AILanguageMode;
}) => {
  const now = new Date();
  let contextId = params.submittedContextId;
  if (contextId && params.resetContext) {
    await aiConversationRepository.invalidate(params.parentId, contextId, now);
    contextId = newContextId();
  }
  if (contextId) {
    const active = await aiConversationRepository.findActive(
      params.parentId,
      params.childId,
      contextId,
      now,
    );
    if (active) return active;
    const unavailable = await aiConversationRepository.findAny(
      params.parentId,
      contextId,
    );
    if (unavailable) contextId = newContextId();
  }
  contextId ??= newContextId();
  return aiConversationRepository.create({
    parentId: params.parentId,
    childId: params.childId,
    contextId,
    responseLanguage: params.initialLanguage,
    languageMode: params.initialMode,
    now,
  });
};

const toSuccessBody = (params: {
  output: Awaited<ReturnType<typeof buildDeterministicChatResponse>>;
  language: AIResponseLanguage;
  languageMode: AILanguageMode;
  context: AIConversationStateRecord;
  requestId: string;
}): AIChatSuccessBody => {
  const body: AIChatSuccessBody = {
    reply: params.output.reply,
    language: params.language,
    languageMode: params.languageMode,
    contextId: params.context.contextId,
    contextExpiresAt: params.context.expiresAt.toISOString(),
    contextStatus: "active",
    requestId: params.requestId,
    replayed: false,
    dataStatus: params.output.dataStatus,
    intent: params.output.intent,
    ...(params.output.riskLevel
      ? { riskLevel: params.output.riskLevel }
      : {}),
  };
  if (params.output.pendingAction) {
    body.followUp = {
      type: params.output.pendingAction.type,
      action: params.output.pendingAction.action,
      expiresAt: params.output.pendingAction.expiresAt.toISOString(),
    };
  }
  return body;
};

export const handleAiChatRequest = async (
  params: AiChatRequestContext,
): Promise<AiChatResult> => {
  const parsed = parseAiChatRequest(params.body, params.user ?? {});
  if (!parsed.ok) {
    return {
      status: parsed.status,
      body: { message: parsed.message, ...(parsed.code ? { code: parsed.code } : {}) },
    };
  }
  const input = parsed.data;
  if (!input.childId) {
    return { status: 400, body: { message: "childId is required." } };
  }
  if (
    !(await aiChildRepository.belongsToParent(
      input.childId,
      input.requesterId,
    ))
  ) {
    return { status: 404, body: { message: "Child not found." } };
  }

  const requestId = input.requestId ?? newContextId();
  const requestHash = createRequestHash({
    message: input.originalMessage,
    childId: input.childId,
    contextId: input.contextId ?? null,
    resetContext: input.resetContext,
    language: input.language ?? null,
    languageMode: input.languageMode ?? null,
  });
  let lease:
    | { leaseToken: string; attemptNumber: number }
    | undefined;
  if (input.requestId) {
    const acquired = await aiConversationRepository.acquireRequest({
      parentId: input.requesterId,
      requestId,
      requestHash,
      originalContextId: input.contextId,
    });
    if (acquired.kind === "reused") {
      return {
        status: 409,
        body: {
          message: "The request ID was already used for different content.",
          code: "AI_REQUEST_ID_REUSED",
        },
      };
    }
    if (acquired.kind === "processing") {
      return {
        status: 409,
        headers: { "Retry-After": "1" },
        body: {
          message: "This chat request is still processing.",
          code: "AI_REQUEST_IN_PROGRESS",
        },
      };
    }
    if (acquired.kind === "completed") {
      return replayResult({
        parentId: input.requesterId,
        completed: acquired,
      });
    }
    lease = acquired;
  }

  const legacyLanguage = input.language ?? "en";
  const initialMode: AILanguageMode = input.languageMode
    ? input.languageMode
    : input.language
      ? "explicit"
      : "auto";
  try {
    let context = await resolveContext({
      parentId: input.requesterId,
      childId: input.childId,
      submittedContextId: input.contextId,
      resetContext: input.resetContext,
      initialLanguage: input.languageMode ? "en" : legacyLanguage,
      initialMode,
    });

    const classified = await classifyParentMessage({
      message: input.message,
      context,
    });
    // Short confirmations/rejections and deterministic language directives are
    // state-sensitive, so prefer the exact local classification for them.
    const local = classifyMessageDeterministically(input.message);
    const classification =
      local.intent === "confirmation" ||
      local.intent === "rejection" ||
      local.requestedResponseLanguage ||
      local.returnToAutomaticLanguage
        ? { ...classified.classification, ...local }
        : classified.classification;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const resolved = resolveResponseLanguage({
        context,
        classification,
        classifierUsedFallback: classified.usedFallback,
        submittedLanguage: input.language,
        submittedMode: input.languageMode,
      });
      const output = await buildDeterministicChatResponse({
        childId: input.childId,
        classification,
        language: resolved.language,
        languageModeIsAutomatic: resolved.mode === "auto",
        context,
      });
      const response = toSuccessBody({
        output,
        language: resolved.language,
        languageMode: resolved.mode,
        context,
        requestId,
      });
      const turns = [
        ...context.turns,
        { role: "user" as const, content: input.message },
        { role: "assistant" as const, content: output.reply },
      ].slice(-6);
      const committed = await aiConversationRepository.commit({
        parentId: input.requesterId,
        requestId: input.requestId,
        leaseToken: lease?.leaseToken,
        attemptNumber: lease?.attemptNumber,
        context,
        mutation: {
          responseLanguage: resolved.language,
          languageMode: resolved.mode,
          activeDomain: output.activeDomain,
          timeframe: output.timeframe,
          detailLevel: output.detailLevel,
          lastIntent: output.intent,
          pendingAction: output.pendingAction,
          turns,
        },
        response,
      });
      if (committed === "committed") {
        return { status: 200, body: response };
      }
      if (committed === "lease_lost") {
        return {
          status: 409,
          body: {
            message: "The chat request lease changed. Retry the same request.",
            code: "AI_REQUEST_IN_PROGRESS",
          },
        };
      }
      const current = await aiConversationRepository.findActive(
        input.requesterId,
        input.childId,
        context.contextId,
      );
      if (!current || current.generation !== context.generation) {
        return {
          status: 409,
          body: {
            message: "The conversation changed while the request was processing.",
            code: "AI_CONTEXT_CHANGED",
          },
        };
      }
      context = current;
    }
    return {
      status: 409,
      body: {
        message: "The conversation changed. Please retry your message.",
        code: "AI_CONTEXT_CONFLICT",
      },
    };
  } catch {
    if (input.requestId && lease) {
      await aiConversationRepository.releaseRetryable({
        parentId: input.requesterId,
        requestId,
        leaseToken: lease.leaseToken,
        attemptNumber: lease.attemptNumber,
      });
    }
    return {
      status: 500,
      body: {
        message: "The AI assistant is temporarily unavailable. Please try again.",
      },
    };
  }
};

export const invalidateAiContext = async (params: {
  contextId: string;
  user?: AuthContext;
}): Promise<AiChatResult> => {
  if (params.user?.role !== "parent" || !params.user.id) {
    return { status: 403, body: { message: "Parent account required." } };
  }
  await aiConversationRepository.invalidate(params.user.id, params.contextId);
  return { status: 204, body: {} };
};

// Compatibility exports used by the existing focused service tests.
export const inferFollowUpChoice = (message: string): FollowUpChoice | null =>
  classifyMessageDeterministically(message).domain;
export const buildDomainSelectionPrompt = (
  _role: string,
  timeframe: PendingTimeframe,
  language: AIResponseLanguage = "en",
) => buildDomainPrompt(timeframe, language);
export const buildScopedFollowUpQuestion = (
  _role: string,
  choice: FollowUpChoice,
  timeframe: PendingTimeframe,
  language: AIResponseLanguage = "en",
) => buildScopedQuestion(choice, timeframe, language);
export const buildUnsupportedParentChatReply = (
  language: AIResponseLanguage = "en",
) => languageCopy[language].unsupported;

export type {
  AIResponseLanguage,
  AiChatRequestContext,
  AiChatResult,
  FollowUpChoice,
  PendingTimeframe,
  PendingFollowUpState,
} from "../../types/core-ai-chat.types";
