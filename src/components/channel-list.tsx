"use client";

import Link from "next/link";

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  isDm: boolean;
  workspaceName: string;
  messageCount: number;
  lastSyncedAt: string | null;
}

export function ChannelList({ channels }: { channels: Channel[] }) {
  const publicChannels = channels.filter((ch) => !ch.isDm && !ch.isPrivate);
  const privateChannels = channels.filter((ch) => !ch.isDm && ch.isPrivate);
  const dmChannels = channels.filter((ch) => ch.isDm);

  return (
    <div className="space-y-6">
      {publicChannels.length > 0 && (
        <ChannelSection title="パブリックチャンネル" channels={publicChannels} />
      )}
      {privateChannels.length > 0 && (
        <ChannelSection title="プライベートチャンネル" channels={privateChannels} />
      )}
      {dmChannels.length > 0 && (
        <ChannelSection title="ダイレクトメッセージ" channels={dmChannels} />
      )}
    </div>
  );
}

function ChannelSection({
  title,
  channels,
}: {
  title: string;
  channels: Channel[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/channels/${ch.id}`}
            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">
                {ch.isDm ? "💬" : ch.isPrivate ? "🔒" : "#"}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {ch.name}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span>{ch.messageCount} 件</span>
              {ch.lastSyncedAt && (
                <span>
                  同期: {new Date(ch.lastSyncedAt).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
