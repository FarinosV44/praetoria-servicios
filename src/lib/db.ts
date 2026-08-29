import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Prisma client singleton — avoids exhausting connections during dev HMR.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.DEBUG_LOGS ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
