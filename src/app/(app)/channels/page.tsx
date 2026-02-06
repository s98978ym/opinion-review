import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChannelList } from "@/components/channel-list";
import { SyncChannelsButton } from "@/components/sync-button";

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userWorkspaces = await prisma.userWorkspace.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  const workspaceIds = userWorkspaces.map((uw) => uw.workspaceId);

  const channels = await prisma.channel.findMany({
    where: { workspaceId: { in: workspaceIds } },
    include: {
      _count: { select: { messages: { where: { isDeleted: false } } } },
      workspace: { select: { name: true } },
    },
    orderBy: [{ isDm: "asc" }, { name: "asc" }],
  });

  const channelData = channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    isPrivate: ch.isPrivate,
    isDm: ch.isDm,
    workspaceName: ch.workspace.name,
    messageCount: ch._count.messages,
    lastSyncedAt: ch.lastSyncedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          チャンネル一覧
        </h1>
        <SyncChannelsButton />
      </div>
      {channels.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            チャンネルがまだありません。
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            「同期」ボタンを押してSlackからチャンネルを取り込みましょう。
          </p>
        </div>
      ) : (
        <ChannelList channels={channelData} />
      )}
    </div>
  );
}
