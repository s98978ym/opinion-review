import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, serverError } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const userWorkspaces = await prisma.userWorkspace.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });

    const workspaceIds = userWorkspaces.map((uw) => uw.workspaceId);

    const channels = await prisma.channel.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: {
        _count: { select: { messages: { where: { isDeleted: false } } } },
        workspace: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      channels: channels.map((ch) => ({
        id: ch.id,
        slack_channel_id: ch.slackChannelId,
        name: ch.name,
        is_private: ch.isPrivate,
        is_dm: ch.isDm,
        workspace_name: ch.workspace.name,
        message_count: ch._count.messages,
        last_synced_at: ch.lastSyncedAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("GET /api/channels error:", e);
    return serverError();
  }
}
