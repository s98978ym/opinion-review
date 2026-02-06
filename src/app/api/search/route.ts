import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, serverError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const channelId = searchParams.get("channel_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  try {
    const where: Record<string, unknown> = {
      userId: user.id,
      isDeleted: false,
    };

    if (q) {
      where.text = { contains: q, mode: "insensitive" };
    }
    if (channelId) where.channelId = channelId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom + "T00:00:00Z");
      if (dateTo) dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");
      where.slackPostedAt = dateFilter;
    }
    if (cursor) where.id = { lt: cursor };

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          channel: { select: { name: true } },
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
          channel_name: m.channel.name,
          feedback_count: m._count.feedbackRuns,
        },
      })),
      total_count: totalCount,
      next_cursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (e) {
    console.error("GET /api/search error:", e);
    return serverError();
  }
}
