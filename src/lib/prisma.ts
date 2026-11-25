import { PrismaClient } from '@prisma/client';

function buildResilientDbUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '30');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '30');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const globalForPrisma = global as unknown as { prismaV2?: PrismaClient };

const resilientUrl = buildResilientDbUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prismaV2 ||
  new PrismaClient({
    ...(resilientUrl ? { datasources: { db: { url: resilientUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaV2 = prisma;
