import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/user/profile — fetch user's active template & business profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.user.id },
        { email: session.user.email ?? '' },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      businessName: true,
      businessCategory: true,
      instagramHandle: true,
      selectedTemplate: true,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ user });
}

// POST /api/user/profile — update active template or business metadata
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { selectedTemplate, businessName, businessCategory, instagramHandle, onboardingDone } = body;

    const user = await prisma.user.update({
      where: {
        email: session.user.email!,
      },
      data: {
        ...(selectedTemplate !== undefined && { selectedTemplate }),
        ...(businessName !== undefined && { businessName }),
        ...(businessCategory !== undefined && { businessCategory }),
        ...(instagramHandle !== undefined && { instagramHandle }),
        ...(onboardingDone !== undefined && { onboardingDone }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
