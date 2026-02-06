import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";


export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
    take: 50,
  });

  // Group by date
  const grouped: Record<
    string,
    Array<{
      feedback: (typeof feedbackRuns)[0];
    }>
  > = {};
  for (const fb of feedbackRuns) {
    const dateKey = fb.createdAt.toISOString().split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push({ feedback: fb });
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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
        <div className="space-y-8">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {formatDate(dateStr)}
              </h2>
              <div className="space-y-3">
                {grouped[dateStr].map(({ feedback }) => (
                  <div
                    key={feedback.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400">
                          # {feedback.message.channel.name}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-600">
                          ·
                        </span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {feedback.preset.name}
                        </span>
                      </div>
                      <Link
                        href={`/channels/${feedback.message.channelId}/messages/${feedback.message.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        投稿を見る →
                      </Link>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {feedback.message.text.slice(0, 100)}
                      {feedback.message.text.length > 100 ? "..." : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
