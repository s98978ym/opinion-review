import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HistoryList } from "@/components/history-list";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const PAGE_SIZE = 30;
  const feedbackRuns = await prisma.feedbackRun.findMany({
    where: { userId: session.user.id },
    include: {
      message: {
        select: {
          id: true,
          text: true,
          channelId: true,
          channel: { select: { name: true } },
        },
      },
      preset: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  });

  const hasMore = feedbackRuns.length > PAGE_SIZE;
  const items = hasMore ? feedbackRuns.slice(0, PAGE_SIZE) : feedbackRuns;

  const feedbackData = items.map((fb) => ({
    id: fb.id,
    channelId: fb.message.channelId,
    messageId: fb.message.id,
    messageText: fb.message.text,
    channelName: fb.message.channel.name,
    presetName: fb.preset.name,
    createdAt: fb.createdAt.toISOString(),
  }));

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        フィードバック履歴
      </h1>

      {feedbackRuns.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            フィードバック履歴がまだありません。
          </p>
          <Link
            href="/channels"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            チャンネルから投稿を選んでフィードバックを生成しましょう →
          </Link>
        </div>
      ) : (
        <HistoryList feedbacks={feedbackData} initialNextCursor={nextCursor} />
      )}
    </div>
  );
}
