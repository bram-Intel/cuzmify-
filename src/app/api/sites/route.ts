import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
      // Unauthenticated callers receive an empty list without exposing multi-tenant data
      return NextResponse.json({ sites: [] });
    }

    const sites = await prisma.site.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ sites });
  } catch (err: any) {
    console.error('[API GET /api/sites Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to reset sites.' }, { status: 401 });
    }

    await prisma.site.deleteMany({ where: { userId } });

    return NextResponse.json({ success: true, message: 'All user sites reset successfully.' });
  } catch (err: any) {
    console.error('[API DELETE /api/sites Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to reset sites' }, { status: 500 });
  }
}
