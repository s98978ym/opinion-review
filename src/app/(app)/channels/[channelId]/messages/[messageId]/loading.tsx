import { FeedbackSkeleton } from "@/components/skeleton";

export default function MessageDetailLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-4 w-20 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
      </div>

      {/* Message skeleton */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          <div className="h-4 w-32 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-full rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          <div className="h-5 w-4/5 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          <div className="h-5 w-2/3 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        </div>
      </div>

      {/* Feedback panel skeleton */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 h-5 w-48 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 rounded-lg bg-zinc-200 animate-skeleton dark:bg-zinc-700"
            />
          ))}
        </div>
        <div className="h-10 w-48 rounded-lg bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
      </div>

      {/* History skeleton */}
      <div className="mt-8">
        <div className="mb-4 h-5 w-40 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <FeedbackSkeleton />
      </div>
    </div>
  );
}
