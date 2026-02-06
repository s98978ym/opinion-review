import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/api-utils";
import { syncMessages } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { channel_id, date_from, date_to } = body;

    if (!channel_id) return badRequest("channel_id is required");

    const result = await syncMessages(user.id, channel_id, date_from, date_to);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "sync_messages",
        resourceType: "channel",
        resourceId: channel_id,
        metadata: {
          new_count: result.new_count,
          updated_count: result.updated_count,
          date_from,
          date_to,
        },
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/sync/messages error:", message);
    return serverError(message);
  }
}
