import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateUserMcpToken } from '@/lib/mcp/mcp-auth';

export async function GET(req: Request) {
  const session = await auth();
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = u?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: Sign in to generate your MCP access token.' }, { status: 401 });
  }

  const origin = new URL(req.url).origin;
  const token = generateUserMcpToken(userId);

  return NextResponse.json({
    endpoint: `${origin}/api/mcp`,
    token,
    mcpConfigExample: {
      mcpServers: {
        cuzmify: {
          url: `${origin}/api/mcp`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    },
  });
}
