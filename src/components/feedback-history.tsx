"use client";

import { useState } from "react";
import { FeedbackResultDisplay } from "@/components/feedback-result-display";

interface FeedbackItem {
  id: string;
  presetSlug: string;
  presetName: string;
  outputJson: Record<string, unknown>;
  modelName: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  createdAt: string;
}

const MODE_ICONS: Record<string, string> = {
  interpret: "🔍",
  evaluate: "⭐",
  improve: "💡",
  rewrite: "✏️",
  summarize: "📝",
};

export function FeedbackHistory({
  feedbacks,
}: {
  feedbacks: FeedbackItem[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {feedbacks.map((fb) => (
        <div
          key={fb.id}
          className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === fb.id ? null : fb.id)
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <span>{MODE_ICONS[fb.presetSlug] ?? "📋"}</span>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {fb.presetName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {fb.durationMs && <span>{(fb.durationMs / 1000).toFixed(1)}s</span>}
              <span>
                {new Date(fb.createdAt).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>{expandedId === fb.id ? "▲" : "▼"}</span>
            </div>
          </button>
          {expandedId === fb.id && (
            <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
              <FeedbackResultDisplay outputJson={fb.outputJson} />
              <div className="mt-3 text-xs text-zinc-400">
                モデル: {fb.modelName}
                {fb.inputTokens != null && ` · 入力: ${fb.inputTokens}tok`}
                {fb.outputTokens != null && ` · 出力: ${fb.outputTokens}tok`}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
