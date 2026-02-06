"use client";

import { useState } from "react";
import Link from "next/link";

interface FeedbackItem {
  id: string;
  channelId: string;
  messageId: string;
  messageText: string;
  channelName: string;
  presetName: string;
  createdAt: string;
}

export function HistoryList({
  feedbacks: initialFeedbacks,
  initialNextCursor = null,
}: {
  feedbacks: FeedbackItem[];
  initialNextCursor?: string | null;
}) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/feedback/history?limit=30&cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const newItems: FeedbackItem[] = (data.feedbacks ?? []).map(
        (f: Record<string, unknown>) => ({
          id: f.id,
          channelId: f.channel_id,
          messageId: f.message_id,
          messageText: f.message_text_preview,
          channelName: "",
          presetName: (f.preset as Record<string, string>)?.name ?? "",
          createdAt: f.created_at,
        }),
      );
      setFeedbacks((prev) => [...prev, ...newItems]);
      setNextCursor(data.next_cursor ?? null);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }

  // Group by date
  const grouped: Record<string, FeedbackItem[]> = {};
  for (const fb of feedbacks) {
    const dateKey = fb.createdAt.split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(fb);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {formatDate(dateStr)}
          </h2>
          <div className="space-y-3">
            {grouped[dateStr].map((feedback) => (
              <div
                key={feedback.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">
                      # {feedback.channelName}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">
                      ·
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {feedback.presetName}
                    </span>
                  </div>
                  <Link
                    href={`/channels/${feedback.channelId}/messages/${feedback.messageId}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    投稿を見る →
                  </Link>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {feedback.messageText.slice(0, 100)}
                  {feedback.messageText.length > 100 ? "..." : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {nextCursor && (
        <div className="pt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg border border-zinc-300 bg-white px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {loadingMore ? "読み込み中..." : "さらに読み込む"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
