import { ChannelListSkeleton } from "@/components/skeleton";

export default function ChannelsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
        <div className="h-9 w-16 rounded-lg bg-zinc-200 animate-skeleton dark:bg-zinc-700" />
      </div>
      <ChannelListSkeleton />
    </div>
  );
}
