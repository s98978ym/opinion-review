import { NextResponse } from "next/server";

// Zero-dependency health check to diagnose Vercel routing issues.
// If this route returns 404, the problem is at the Vercel platform level.
// If this route works but others don't, the problem is in specific route handlers.
export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      AUTH_SLACK_ID: !!process.env.AUTH_SLACK_ID,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      TOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
    },
  });
}
