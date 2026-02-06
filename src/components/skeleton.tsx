export function ChannelListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 h-4 w-32 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
                <div className="h-4 w-24 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
              </div>
              <div className="h-4 w-16 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 h-4 w-40 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-12 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
                <div className="h-4 w-3/4 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedbackSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-12 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          <div className="h-2 flex-1 rounded-full bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
              <div className="h-4 w-8 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
            </div>
            <div className="h-2 rounded-full bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
            <div className="h-3 w-3/4 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="h-9 w-16 rounded-lg bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
      </div>
      <ChannelListSkeleton />
    </div>
  );
}
