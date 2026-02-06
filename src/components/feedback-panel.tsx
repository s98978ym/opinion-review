"use client";

import { useState } from "react";
import { slackMrkdwnToPlainText } from "@/lib/slack-markdown";
import { FeedbackResultDisplay } from "@/components/feedback-result-display";

interface Preset {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

const MODE_ICONS: Record<string, string> = {
  interpret: "🔍",
  evaluate: "⭐",
  improve: "💡",
  rewrite: "✏️",
  summarize: "📝",
};

export function FeedbackPanel({
  messageId,
  messageText,
  presets,
}: {
  messageId: string;
  messageText: string;
  presets: Preset[];
}) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const plainText = slackMrkdwnToPlainText(messageText);

  async function handleGenerate() {
    if (!selectedPreset) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/feedback/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          preset_id: selectedPreset,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }
      setResult(data.feedback.outputJson);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        フィードバックモードを選択
      </h2>

      {/* Mode selection */}
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setSelectedPreset(preset.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedPreset === preset.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
            title={preset.description ?? ""}
          >
            {MODE_ICONS[preset.slug] ?? "📋"} {preset.name}
          </button>
        ))}
      </div>

      {/* Preview toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {showPreview ? "プレビューを隠す" : "⚠ LLMに送信される内容を確認"}
        </button>
        {showPreview && (
          <div className="mt-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <p className="mb-1 font-medium">送信されるテキスト:</p>
            <pre className="whitespace-pre-wrap">{plainText}</pre>
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedPreset || loading}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            生成中...
          </span>
        ) : (
          "✨ フィードバックを生成"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6">
          <FeedbackResultDisplay outputJson={result} />
        </div>
      )}
    </div>
  );
}
