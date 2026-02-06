"use client";

import { useState } from "react";

interface SearchResult {
  message: {
    id: string;
    text: string;
    slack_posted_at: string;
    channel_name: string;
    feedback_count: number;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=30`,
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setTotalCount(data.total_count ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
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

      {searched && (
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
                <div
                  key={r.message.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
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
                        📝 {r.message.feedback_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {r.message.text.slice(0, 200)}
                    {r.message.text.length > 200 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
