import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessageList } from "@/components/message-list";
import Link from "next/link";

interface Props {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function ChannelMessagesPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { channelId } = await params;
  const { date } = await searchParams;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { workspace: { select: { name: true } } },
  });
  if (!channel) redirect("/channels");

  const where: Record<string, unknown> = {
    channelId,
    userId: session.user.id,
    isDeleted: false,
  };

  if (date) {
    const dayStart = new Date(date + "T00:00:00Z");
    const dayEnd = new Date(date + "T23:59:59.999Z");
    where.slackPostedAt = { gte: dayStart, lte: dayEnd };
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      _count: { select: { feedbackRuns: true } },
    },
    orderBy: { slackPostedAt: "desc" },
    take: 100,
  });

  // Group by date
  const grouped: Record<string, typeof messages> = {};
  for (const msg of messages) {
    const dateKey = msg.slackPostedAt.toISOString().split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(msg);
  }

  const messageData = messages.map((m) => ({
    id: m.id,
    text: m.text,
    slackPostedAt: m.slackPostedAt.toISOString(),
    slackThreadTs: m.slackThreadTs,
    isEdited: m.isEdited,
    hasAttachments: m.hasAttachments,
    feedbackCount: m._count.feedbackRuns,
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/channels"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← チャンネル一覧
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {channel.isDm ? "💬" : channel.isPrivate ? "🔒" : "#"}{" "}
            {channel.name}
          </h1>
          <SyncMessagesButton channelId={channelId} />
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            投稿がまだありません。
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            「同期」ボタンを押してSlackから投稿を取り込みましょう。
          </p>
        </div>
      ) : (
        <MessageList messages={messageData} channelId={channelId} />
      )}
    </div>
  );
}

function SyncMessagesButton({ channelId }: { channelId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const session = await auth();
        if (!session?.user?.id) return;
        const { syncMessages } = await import("@/lib/slack");
        await syncMessages(session.user.id, channelId);
        const { redirect: redir } = await import("next/navigation");
        redir(`/channels/${channelId}`);
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        同期
      </button>
    </form>
  );
}
