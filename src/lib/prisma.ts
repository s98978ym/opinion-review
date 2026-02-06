import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws on any property access / method call.
    // This lets the module load without crashing when DATABASE_URL is
    // missing (e.g. during Vercel's initial deploy or build-time
    // static generation) while still failing loudly at query time.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (typeof prop === "symbol" || prop === "then") return undefined;
        throw new Error(
          `DATABASE_URL is not set. Cannot access prisma.${String(prop)}.`,
        );
      },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
