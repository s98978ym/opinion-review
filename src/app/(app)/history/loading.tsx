export default function HistoryLoading() {
  return (
    <div>
      <div className="mb-6 h-7 w-48 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
                <div className="h-4 w-16 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
              </div>
              <div className="h-4 w-20 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
            </div>
            <div className="h-4 w-3/4 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
