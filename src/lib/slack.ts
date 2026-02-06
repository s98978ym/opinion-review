import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const MAX_RETRIES = 3;

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_im: boolean;
  is_mpim: boolean;
}

interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  edited?: { user: string; ts: string };
  files?: unknown[];
}

async function getSlackToken(userId: string): Promise<{ token: string; workspaceId: string }> {
  const uw = await prisma.userWorkspace.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!uw) throw new Error("Slackワークスペースが接続されていません");
  return { token: decrypt(uw.slackAccessTokenEnc), workspaceId: uw.workspaceId };
}

async function slackFetch(
  token: string,
  method: string,
  params: Record<string, string> = {},
  retryCount = 0,
): Promise<Record<string, unknown>> {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Slack API error: ${res.status}`);

  const data = await res.json();
  if (!data.ok) {
    if (data.error === "ratelimited" && retryCount < MAX_RETRIES) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return slackFetch(token, method, params, retryCount + 1);
    }
    if (data.error === "ratelimited") {
      throw new Error("Slack APIのレート制限に達しました。しばらく待ってから再試行してください。");
    }
    if (data.error === "not_authed" || data.error === "invalid_auth" || data.error === "token_revoked") {
      throw new Error("Slackの認証が無効です。再度ログインしてください。");
    }
    throw new Error(`Slack API error: ${data.error}`);
  }
  return data;
}

export async function syncChannels(userId: string) {
  const { token, workspaceId } = await getSlackToken(userId);

  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {
      types: "public_channel,private_channel,im",
      limit: "200",
      exclude_archived: "true",
    };
    if (cursor) params.cursor = cursor;

    const data = await slackFetch(token, "conversations.list", params);
    channels.push(...((data.channels as SlackChannel[]) ?? []));
    cursor = (data.response_metadata as Record<string, string> | undefined)?.next_cursor || undefined;

    if (cursor) await new Promise((r) => setTimeout(r, 200));
  } while (cursor);

  let count = 0;
  for (const ch of channels) {
    await prisma.channel.upsert({
      where: {
        workspaceId_slackChannelId: {
          workspaceId,
          slackChannelId: ch.id,
        },
      },
      update: { name: ch.name || `DM-${ch.id}`, isPrivate: ch.is_private, isDm: ch.is_im || ch.is_mpim },
      create: {
        workspaceId,
        slackChannelId: ch.id,
        name: ch.name || `DM-${ch.id}`,
        isPrivate: ch.is_private,
        isDm: ch.is_im || ch.is_mpim,
      },
    });
    count++;
  }

  return { synced_count: count };
}

export async function syncMessages(
  userId: string,
  channelId: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const { token } = await getSlackToken(userId);

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new Error("Channel not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const params: Record<string, string> = {
    channel: channel.slackChannelId,
    limit: "200",
  };
  if (dateFrom) {
    const ts = new Date(dateFrom).getTime();
    if (!isNaN(ts)) params.oldest = String(ts / 1000);
  }
  if (dateTo) {
    const ts = new Date(dateTo + "T23:59:59Z").getTime();
    if (!isNaN(ts)) params.latest = String(ts / 1000);
  }

  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    if (cursor) params.cursor = cursor;
    const data = await slackFetch(token, "conversations.history", params);
    messages.push(...((data.messages as SlackMessage[]) ?? []));
    cursor = (data.response_metadata as Record<string, string> | undefined)?.next_cursor || undefined;

    if (cursor) await new Promise((r) => setTimeout(r, 200));
  } while (cursor);

  // Filter to own messages only
  const ownMessages = messages.filter(
    (m) => m.user === user.slackUserId && m.type === "message",
  );

  let newCount = 0;
  let updatedCount = 0;

  for (const msg of ownMessages) {
    const existing = await prisma.message.findUnique({
      where: {
        channelId_slackTs: {
          channelId: channel.id,
          slackTs: msg.ts,
        },
      },
    });

    if (existing) {
      if (existing.text !== msg.text || (!existing.isEdited && msg.edited)) {
        await prisma.message.update({
          where: { id: existing.id },
          data: {
            text: msg.text,
            isEdited: !!msg.edited,
            hasAttachments: (msg.files?.length ?? 0) > 0,
          },
        });
        updatedCount++;
      }
    } else {
      await prisma.message.create({
        data: {
          userId,
          channelId: channel.id,
          slackTs: msg.ts,
          slackThreadTs: msg.thread_ts ?? null,
          text: msg.text,
          hasAttachments: (msg.files?.length ?? 0) > 0,
          isEdited: !!msg.edited,
          slackPostedAt: new Date(parseFloat(msg.ts) * 1000),
        },
      });
      newCount++;
    }
  }

  // Update last synced
  await prisma.channel.update({
    where: { id: channel.id },
    data: { lastSyncedAt: new Date() },
  });

  return { new_count: newCount, updated_count: updatedCount };
}
