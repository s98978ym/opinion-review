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
  const q = searchParams.get("q") ?? "";
  const channelId = searchParams.get("channel_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const cursor = searchParams.get("cursor");
  const limitRaw = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isNaN(limitRaw) ? 20 : Math.min(Math.max(limitRaw, 1), 100);

  if (!q.trim()) return badRequest("Search query (q) is required");

  try {
    const where: Record<string, unknown> = {
      userId: user.id,
      isDeleted: false,
      text: { contains: q, mode: "insensitive" },
    };

    if (channelId) where.channelId = channelId;

    const dateFilter: Record<string, Date> = {};
    if (dateFrom) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) return badRequest("Invalid date_from format");
      dateFilter.gte = new Date(dateFrom + "T00:00:00Z");
    }
    if (dateTo) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) return badRequest("Invalid date_to format");
      dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");
    }
    if (Object.keys(dateFilter).length > 0) {
      where.slackPostedAt = dateFilter;
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) return badRequest("Invalid cursor");
      where.slackPostedAt = {
        ...(typeof where.slackPostedAt === "object" ? where.slackPostedAt as Record<string, unknown> : {}),
        lt: cursorDate,
      };
    }

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          channel: { select: { id: true, name: true } },
          _count: { select: { feedbackRuns: true } },
        },
        orderBy: { slackPostedAt: "desc" },
        take: limit + 1,
      }),
      prisma.message.count({ where }),
    ]);

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return NextResponse.json({
      results: items.map((m) => ({
        message: {
          id: m.id,
          text: m.text,
          slack_posted_at: m.slackPostedAt.toISOString(),
          channel_id: m.channel.id,
          channel_name: m.channel.name,
          feedback_count: m._count.feedbackRuns,
        },
      })),
      total_count: totalCount,
      next_cursor: hasMore
        ? items[items.length - 1].slackPostedAt.toISOString()
        : null,
    });
  } catch (e) {
    console.error("GET /api/search error:", e);
    return serverError();
  }
}
