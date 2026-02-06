import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

// Vercel プレビューデプロイではデプロイごとに URL が変わるため、
// AUTH_URL が未設定の場合は安定した本番 URL を使用する
if (!process.env.AUTH_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.AUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    {
      id: "slack",
      name: "Slack",
      type: "oidc",
      issuer: "https://slack.com",
      clientId: process.env.AUTH_SLACK_ID!,
      clientSecret: process.env.AUTH_SLACK_SECRET!,
      authorization: {
        params: {
          scope:
            "openid profile email channels:history channels:read groups:history groups:read im:history im:read users:read",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const slackUserId = profile.sub as string;
      const teamId =
        (profile as Record<string, unknown>)["https://slack.com/team_id"] as
          | string
          | undefined;

      // Upsert user
      const user = await prisma.user.upsert({
        where: { slackUserId },
        update: {
          displayName: profile.name ?? null,
          avatarUrl: (profile.picture as string) ?? null,
          email: profile.email ?? null,
        },
        create: {
          slackUserId,
          displayName: profile.name ?? null,
          avatarUrl: (profile.picture as string) ?? null,
          email: profile.email ?? null,
        },
      });

      // Upsert workspace + user-workspace with encrypted token
      if (teamId && account.access_token) {
        const teamName =
          ((profile as Record<string, unknown>)[
            "https://slack.com/team_name"
          ] as string) ?? "Unknown";

        const workspace = await prisma.workspace.upsert({
          where: { slackTeamId: teamId },
          update: { name: teamName },
          create: { slackTeamId: teamId, name: teamName },
        });

        await prisma.userWorkspace.upsert({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: workspace.id,
            },
          },
          update: {
            slackAccessTokenEnc: encrypt(account.access_token),
            scope: account.scope ?? null,
          },
          create: {
            userId: user.id,
            workspaceId: workspace.id,
            slackAccessTokenEnc: encrypt(account.access_token),
            scope: account.scope ?? null,
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { slackUserId: token.sub },
          select: { id: true, slackUserId: true },
        });
        if (user) {
          session.user.id = user.id;
          (session.user as unknown as Record<string, unknown>).slackUserId =
            user.slackUserId;
        }
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
