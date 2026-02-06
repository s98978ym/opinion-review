"use client";

import { useState } from "react";
import { FeedbackResultDisplay } from "@/components/feedback-result-display";

interface FeedbackItem {
  id: string;
  presetSlug: string;
  presetName: string;
  outputJson: Record<string, unknown>;
  modelName: string;
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

export function FeedbackCompare({ feedbacks }: { feedbacks: FeedbackItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState(false);

  // Get latest feedback per mode for quick comparison
  const latestByMode = new Map<string, FeedbackItem>();
  for (const fb of feedbacks) {
    if (!latestByMode.has(fb.presetSlug)) {
      latestByMode.set(fb.presetSlug, fb);
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllModes() {
    setSelectedIds(new Set(Array.from(latestByMode.values()).map((f) => f.id)));
  }

  const selected = feedbacks.filter((f) => selectedIds.has(f.id));

  if (comparing && selected.length >= 2) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            比較モード ({selected.length}件)
          </h3>
          <button
            onClick={() => setComparing(false)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            比較を終了
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {selected.map((fb) => (
            <div
              key={fb.id}
              className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                <span>{MODE_ICONS[fb.presetSlug] ?? "📋"}</span>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {fb.presetName}
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  {new Date(fb.createdAt).toLocaleString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="p-4">
                <FeedbackResultDisplay outputJson={fb.outputJson} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={selectAllModes}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          各モード最新を選択
        </button>
        {selectedIds.size >= 2 && (
          <button
            onClick={() => setComparing(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            {selectedIds.size}件を比較
          </button>
        )}
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            選択解除
          </button>
        )}
      </div>
      <div className="space-y-2">
        {feedbacks.map((fb) => (
          <label
            key={fb.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedIds.has(fb.id)
                ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(fb.id)}
              onChange={() => toggleSelection(fb.id)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 dark:border-zinc-600"
            />
            <span>{MODE_ICONS[fb.presetSlug] ?? "📋"}</span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {fb.presetName}
            </span>
            <span className="ml-auto text-xs text-zinc-400">
              {fb.durationMs && `${(fb.durationMs / 1000).toFixed(1)}s · `}
              {new Date(fb.createdAt).toLocaleString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
