import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeedbackPanel } from "@/components/feedback-panel";
import { FeedbackHistory } from "@/components/feedback-history";
import { FeedbackCompare } from "@/components/feedback-compare";
import { slackMrkdwnToHtml } from "@/lib/slack-markdown";

interface Props {
  params: Promise<{ channelId: string; messageId: string }>;
}

export default async function MessageDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { channelId, messageId } = await params;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      channel: { select: { name: true, isPrivate: true, isDm: true } },
    },
  });
  if (!message || message.userId !== session.user.id) {
    redirect(`/channels/${channelId}`);
  }

  const presets = await prisma.feedbackPreset.findMany({
    where: { isSystem: true },
    orderBy: { displayOrder: "asc" },
  });

  const feedbackRuns = await prisma.feedbackRun.findMany({
    where: { messageId },
    include: { preset: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const time = message.slackPostedAt.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = message.slackPostedAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const presetData = presets.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
  }));

  const historyData = feedbackRuns.map((f) => ({
    id: f.id,
    presetSlug: f.preset.slug,
    presetName: f.preset.name,
    outputJson: f.outputJson as Record<string, unknown>,
    modelName: f.modelName,
    inputTokens: f.inputTokens,
    outputTokens: f.outputTokens,
    durationMs: f.durationMs,
    createdAt: f.createdAt.toISOString(),
  }));

  const uniqueModes = new Set(historyData.map((h) => h.presetSlug));
  const canCompare = uniqueModes.size >= 2;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/channels/${channelId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 投稿一覧
        </Link>
      </div>

      {/* Message display */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            {message.channel.isDm
              ? "💬"
              : message.channel.isPrivate
                ? "🔒"
                : "#"}{" "}
            {message.channel.name}
          </span>
          <span>·</span>
          <span>
            {dateStr} {time}
          </span>
          {message.isEdited && <span className="text-xs">(編集済み)</span>}
        </div>
        <div
          className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200"
          dangerouslySetInnerHTML={{
            __html: slackMrkdwnToHtml(message.text),
          }}
        />
      </div>

      {/* Feedback generation */}
      <FeedbackPanel
        messageId={messageId}
        messageText={message.text}
        presets={presetData}
      />

      {/* Compare section */}
      {canCompare && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            フィードバック比較
          </h2>
          <FeedbackCompare feedbacks={historyData} />
        </div>
      )}

      {/* Feedback history */}
      {historyData.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            過去のフィードバック ({historyData.length}件)
          </h2>
          <FeedbackHistory feedbacks={historyData} />
        </div>
      )}
    </div>
  );
}
