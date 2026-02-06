import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slackMrkdwnToPlainText } from "@/lib/slack-markdown";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

const MAX_OUTPUT_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.3;

interface FeedbackResult {
  id: string;
  outputJson: Record<string, unknown>;
  modelName: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  createdAt: Date;
}

export async function runFeedback(
  userId: string,
  messageId: string,
  presetId: string,
): Promise<FeedbackResult> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message || message.userId !== userId) {
    throw new Error("Message not found or access denied");
  }

  const preset = await prisma.feedbackPreset.findUnique({
    where: { id: presetId },
  });
  if (!preset) throw new Error("Preset not found");

  const plainText = slackMrkdwnToPlainText(message.text);

  // Check minimum text length
  if (plainText.trim().length < 10) {
    throw new Error(
      "投稿が短すぎます（10文字以上の投稿でフィードバックを生成できます）",
    );
  }

  const prompt = preset.promptTemplate.replace("{message_text}", plainText);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const startTime = Date.now();

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `LLM API error: ${response.status} ${errorData?.error?.message ?? ""}`,
    );
  }

  const data = await response.json();
  const durationMs = Date.now() - startTime;

  const outputText = data.choices?.[0]?.message?.content ?? "{}";
  let outputJson: Record<string, unknown>;
  try {
    outputJson = JSON.parse(outputText);
  } catch {
    outputJson = { raw: outputText, parse_error: true };
  }

  // Add mode identifier
  outputJson.mode = preset.slug;

  const feedbackRun = await prisma.feedbackRun.create({
    data: {
      userId,
      messageId,
      presetId,
      inputText: plainText,
      outputJson: outputJson as Prisma.InputJsonValue,
      modelName: data.model ?? DEFAULT_MODEL,
      inputTokens: data.usage?.prompt_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? null,
      temperature: DEFAULT_TEMPERATURE,
      durationMs,
    },
  });

  return {
    id: feedbackRun.id,
    outputJson,
    modelName: feedbackRun.modelName,
    inputTokens: feedbackRun.inputTokens,
    outputTokens: feedbackRun.outputTokens,
    durationMs,
    createdAt: feedbackRun.createdAt,
  };
}

/** Check daily feedback limit (50/day per user) */
export async function checkDailyLimit(userId: string): Promise<{
  remaining: number;
  limit: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.feedbackRun.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  return { remaining: Math.max(0, 50 - count), limit: 50 };
}
