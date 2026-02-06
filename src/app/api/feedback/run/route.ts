import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-utils";
import { runFeedback, checkDailyLimit } from "@/lib/feedback";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { message_id, preset_id } = body;

    if (!message_id || !preset_id) {
      return badRequest("message_id and preset_id are required");
    }

    // Check daily limit
    const { remaining } = await checkDailyLimit(user.id);
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "1日のフィードバック生成上限（50回）に達しました" },
        { status: 429 },
      );
    }

    const result = await runFeedback(user.id, message_id, preset_id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "feedback_run",
        resourceType: "feedback",
        resourceId: result.id,
        metadata: {
          message_id,
          preset_id,
          model: result.modelName,
          duration_ms: result.durationMs,
        },
      },
    });

    return NextResponse.json({ feedback: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/feedback/run error:", message);

    if (message.includes("短すぎます") || message.includes("not found")) {
      return badRequest(message);
    }
    return serverError(message);
  }
}
