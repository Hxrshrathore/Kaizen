import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_om1c9tzRKDbr@ep-falling-bread-ahbvwe8e-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  });
};

const getPrisma = () => {
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any).healthMetric) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
};

export const prisma = getPrisma();

export const db = prisma;