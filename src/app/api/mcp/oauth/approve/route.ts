import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  isAllowedOAuthRedirectUri,
  issueMcpOAuthCode,
  verifyRegisteredMcpClient,
} from '@/lib/mcp/mcp-oauth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId && session?.user?.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = u?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Sign in to Cuzmify first.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const decision = body?.decision === 'deny' ? 'deny' : 'approve';
    const clientId = String(body?.clientId || '');
    const redirectUri = String(body?.redirectUri || '');
    const codeChallenge = String(body?.codeChallenge || '');
    const state = typeof body?.state === 'string' ? body.state : '';
    const scope = typeof body?.scope === 'string' && body.scope.trim() ? body.scope.trim() : 'mcp:read mcp:write';
    const resource = typeof body?.resource === 'string' ? body.resource : undefined;

    if (!redirectUri || !isAllowedOAuthRedirectUri(redirectUri)) {
      return NextResponse.json({ error: 'Invalid redirect_uri.' }, { status: 400 });
    }

    const registered = clientId ? verifyRegisteredMcpClient(clientId) : null;
    if (registered && !registered.redirectUris.includes(redirectUri)) {
      return NextResponse.json({ error: 'redirect_uri does not match registered client.' }, { status: 400 });
    }

    const callback = new URL(redirectUri);
    if (decision === 'deny') {
      callback.searchParams.set('error', 'access_denied');
      callback.searchParams.set('error_description', 'User denied Cuzmify MCP access.');
      if (state) callback.searchParams.set('state', state);
      return NextResponse.json({ redirectTo: callback.toString() });
    }

    if (!codeChallenge) {
      return NextResponse.json({ error: 'Missing PKCE code_challenge.' }, { status: 400 });
    }

    const code = issueMcpOAuthCode({
      userId,
      clientId,
      redirectUri,
      codeChallenge,
      scope,
      resource,
    });

    callback.searchParams.set('code', code);
    if (state) callback.searchParams.set('state', state);

    return NextResponse.json({ redirectTo: callback.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to approve MCP access' }, { status: 500 });
  }
}
