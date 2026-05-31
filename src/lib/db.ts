import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Use DATABASE_URL when set (e.g. in the container it points at the mounted
// /data volume); fall back to a local dev.db so local development is unchanged.
const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
