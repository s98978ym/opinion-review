"use client";

import { useState } from "react";
import Link from "next/link";

interface SearchResult {
  message: {
    id: string;
    text: string;
    slack_posted_at: string;
    channel_id: string;
    channel_name: string;
    feedback_count: number;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=30`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "検索に失敗しました");
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.results ?? []);
      setTotalCount(data.total_count ?? 0);
      setNextCursor(data.next_cursor ?? null);
    } catch {
      setError("ネットワークエラーが発生しました");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=30&cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setResults((prev) => [...prev, ...(data.results ?? [])]);
      setNextCursor(data.next_cursor ?? null);
    } catch {
      // silently fail for load more
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        検索
      </h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードで投稿を検索..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "検索中..." : "検索"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {searched && !error && (
        <div>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {totalCount}件の結果
          </p>

          {results.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-500 dark:text-zinc-400">
                該当する投稿が見つかりませんでした。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <Link
                  key={r.message.id}
                  href={`/channels/${r.message.channel_id}/messages/${r.message.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700 dark:hover:bg-blue-900/10"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span># {r.message.channel_name}</span>
                    <span>·</span>
                    <span>
                      {new Date(r.message.slack_posted_at).toLocaleDateString(
                        "ja-JP",
                      )}
                    </span>
                    {r.message.feedback_count > 0 && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {r.message.feedback_count}件
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {r.message.text.slice(0, 200)}
                    {r.message.text.length > 200 ? "..." : ""}
                  </p>
                </Link>
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
          )}
        </div>
      )}
    </div>
  );
}
