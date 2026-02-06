import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  serverError,
} from "@/lib/api-utils";
import { syncChannels } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const result = await syncChannels(user.id);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "sync_channels",
        metadata: { synced_count: result.synced_count },
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/sync/channels error:", message);
    return serverError(message);
  }
}
