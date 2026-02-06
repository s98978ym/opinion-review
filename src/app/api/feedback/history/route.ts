import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, serverError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const messageId = searchParams.get("message_id");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  try {
    const where: Record<string, unknown> = {
      userId: user.id,
    };
    if (messageId) where.messageId = messageId;
    if (cursor) where.id = { lt: cursor };

    const feedbacks = await prisma.feedbackRun.findMany({
      where,
      include: {
        message: { select: { text: true } },
        preset: { select: { slug: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = feedbacks.length > limit;
    const items = hasMore ? feedbacks.slice(0, limit) : feedbacks;

    return NextResponse.json({
      feedbacks: items.map((f) => ({
        id: f.id,
        message_id: f.messageId,
        message_text_preview: f.message.text.slice(0, 80),
        preset: { slug: f.preset.slug, name: f.preset.name },
        output_json: f.outputJson,
        model_name: f.modelName,
        input_tokens: f.inputTokens,
        output_tokens: f.outputTokens,
        duration_ms: f.durationMs,
        created_at: f.createdAt.toISOString(),
      })),
      next_cursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (e) {
    console.error("GET /api/feedback/history error:", e);
    return serverError();
  }
}
