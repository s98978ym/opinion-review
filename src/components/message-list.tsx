"use client";

import { useState } from "react";
import Link from "next/link";
import { slackMrkdwnToHtml } from "@/lib/slack-markdown";

interface Message {
  id: string;
  text: string;
  slackPostedAt: string;
  slackThreadTs: string | null;
  isEdited: boolean;
  hasAttachments: boolean;
  feedbackCount: number;
}

export function MessageList({
  messages: initialMessages,
  channelId,
  initialNextCursor = null,
}: {
  messages: Message[];
  channelId: string;
  initialNextCursor?: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/messages?channel_id=${channelId}&limit=50&cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const newMessages: Message[] = (data.messages ?? []).map(
        (m: Record<string, unknown>) => ({
          id: m.id,
          text: m.text,
          slackPostedAt: m.slack_posted_at,
          slackThreadTs: m.slack_thread_ts,
          isEdited: m.is_edited,
          hasAttachments: m.has_attachments,
          feedbackCount: m.feedback_count,
        }),
      );
      setMessages((prev) => [...prev, ...newMessages]);
      setNextCursor(data.next_cursor ?? null);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }

  // Group by date
  const grouped: Record<string, Message[]> = {};
  for (const msg of messages) {
    const dateKey = msg.slackPostedAt.split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(msg);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {formatDate(dateStr)}
          </h2>
          <div className="space-y-2">
            {grouped[dateStr]
              .sort(
                (a, b) =>
                  new Date(b.slackPostedAt).getTime() -
                  new Date(a.slackPostedAt).getTime(),
              )
              .map((msg) => (
                <MessageCard
                  key={msg.id}
                  message={msg}
                  channelId={channelId}
                />
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

function MessageCard({
  message,
  channelId,
}: {
  message: Message;
  channelId: string;
}) {
  const time = new Date(message.slackPostedAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{time}</span>
            {message.isEdited && (
              <span className="text-xs text-zinc-400">(編集済み)</span>
            )}
            {message.slackThreadTs && (
              <span className="text-xs text-zinc-400">スレッド</span>
            )}
            {message.hasAttachments && (
              <span className="text-xs text-zinc-400">📎</span>
            )}
          </div>
          <div
            className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
            dangerouslySetInnerHTML={{
              __html: slackMrkdwnToHtml(message.text),
            }}
          />
        </div>
        <div className="ml-4 flex flex-shrink-0 items-center gap-2">
          {message.feedbackCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {message.feedbackCount}件
            </span>
          )}
          <Link
            href={`/channels/${channelId}/messages/${message.id}`}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            フィードバック →
          </Link>
        </div>
      </div>
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
