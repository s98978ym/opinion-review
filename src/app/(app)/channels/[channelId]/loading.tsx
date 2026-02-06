import { MessageListSkeleton } from "@/components/skeleton";

export default function ChannelLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-4 w-24 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-7 w-48 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
          <div className="h-9 w-16 rounded-lg bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        </div>
      </div>
      <MessageListSkeleton />
    </div>
  );
}
