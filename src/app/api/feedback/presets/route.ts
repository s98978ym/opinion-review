import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const presets = await prisma.feedbackPreset.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json({ presets });
}
