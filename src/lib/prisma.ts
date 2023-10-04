import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbPath = path.join(process.cwd(), "dev.db").replace(/\\/g, "/");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureUserExists(managerId: string) {
  if (!managerId) return;
  try {
    const existing = await prisma.user.findUnique({ where: { id: managerId } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: managerId,
          email: `manager_${managerId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}@example.com`,
          name: "Manager User",
          defaultThreshold: 60,
          settings: {
            create: {
              talkPctThreshold: 60,
              retentionDays: 180,
            },
          },
        },
      });
    }
  } catch (err) {
    console.error("[Prisma] ensureUserExists error:", err);
  }
}
