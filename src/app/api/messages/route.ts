import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const channelId = searchParams.get("channel_id");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  if (!channelId) return badRequest("channel_id is required");

  try {
    const where: Record<string, unknown> = {
      channelId,
      userId: user.id,
      isDeleted: false,
    };

    if (date) {
      const dayStart = new Date(date + "T00:00:00Z");
      const dayEnd = new Date(date + "T23:59:59.999Z");
      where.slackPostedAt = { gte: dayStart, lte: dayEnd };
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        _count: { select: { feedbackRuns: true } },
      },
      orderBy: { slackPostedAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return NextResponse.json({
      messages: items.map((m) => ({
        id: m.id,
        text: m.text,
        slack_posted_at: m.slackPostedAt.toISOString(),
        slack_thread_ts: m.slackThreadTs,
        is_edited: m.isEdited,
        has_attachments: m.hasAttachments,
        feedback_count: m._count.feedbackRuns,
      })),
      next_cursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (e) {
    console.error("GET /api/messages error:", e);
    return serverError();
  }
}
