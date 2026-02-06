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
  const limitRaw = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isNaN(limitRaw) ? 50 : Math.min(Math.max(limitRaw, 1), 100);

  if (!channelId) return badRequest("channel_id is required");

  try {
    const where: Record<string, unknown> = {
      channelId,
      userId: user.id,
      isDeleted: false,
    };

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return badRequest("Invalid date format. Use YYYY-MM-DD");
      }
      const dayStart = new Date(date + "T00:00:00Z");
      const dayEnd = new Date(date + "T23:59:59.999Z");
      if (isNaN(dayStart.getTime())) return badRequest("Invalid date");
      where.slackPostedAt = { gte: dayStart, lte: dayEnd };
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) return badRequest("Invalid cursor");
      where.slackPostedAt = {
        ...(typeof where.slackPostedAt === "object" ? where.slackPostedAt as Record<string, unknown> : {}),
        lt: cursorDate,
      };
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
      next_cursor: hasMore
        ? items[items.length - 1].slackPostedAt.toISOString()
        : null,
    });
  } catch (e) {
    console.error("GET /api/messages error:", e);
    return serverError();
  }
}
