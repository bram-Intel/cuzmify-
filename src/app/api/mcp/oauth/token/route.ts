import { NextResponse } from 'next/server';
import {
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  MCP_CORS_HEADERS,
  issueMcpOAuthAccessToken,
  issueMcpOAuthRefreshToken,
  verifyAndConsumeMcpOAuthCode,
  verifyMcpOAuthRefreshToken,
} from '@/lib/mcp/mcp-oauth';

async function parseTokenRequestParams(req: Request): Promise<Record<string, string>> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const json = await req.json().catch(() => ({}));
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json || {})) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  }
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MCP_CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const params = await parseTokenRequestParams(req);
    const grantType = params.grant_type || '';

    if (grantType === 'authorization_code') {
      const code = params.code || '';
      const codeVerifier = params.code_verifier || '';
      const clientId = params.client_id || undefined;
      const redirectUri = params.redirect_uri || undefined;

      if (!code || !codeVerifier) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing code or code_verifier (PKCE S256 required).' },
          { status: 400, headers: MCP_CORS_HEADERS }
        );
      }

      const verified = verifyAndConsumeMcpOAuthCode({
        code,
        clientId,
        redirectUri,
        codeVerifier,
      });

      if (!verified) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Authorization code is invalid, expired, or PKCE check failed.' },
          { status: 400, headers: MCP_CORS_HEADERS }
        );
      }

      const accessToken = issueMcpOAuthAccessToken(verified.userId, verified.scope, verified.clientId);
      const refreshToken = issueMcpOAuthRefreshToken(verified.userId, verified.scope, verified.clientId);

      return NextResponse.json(
        {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: MCP_ACCESS_TOKEN_TTL_SECONDS,
          refresh_token: refreshToken,
          scope: verified.scope,
        },
        { headers: { ...MCP_CORS_HEADERS, 'Cache-Control': 'no-store' } }
      );
    }

    if (grantType === 'refresh_token') {
      const refreshToken = params.refresh_token || '';
      const verified = refreshToken ? verifyMcpOAuthRefreshToken(refreshToken) : null;
      if (!verified) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Refresh token is invalid or expired.' },
          { status: 400, headers: MCP_CORS_HEADERS }
        );
      }

      const nextAccess = issueMcpOAuthAccessToken(verified.userId, verified.scope, verified.clientId);
      const nextRefresh = issueMcpOAuthRefreshToken(verified.userId, verified.scope, verified.clientId);

      return NextResponse.json(
        {
          access_token: nextAccess,
          token_type: 'Bearer',
          expires_in: MCP_ACCESS_TOKEN_TTL_SECONDS,
          refresh_token: nextRefresh,
          scope: verified.scope,
        },
        { headers: { ...MCP_CORS_HEADERS, 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: `Unsupported grant_type "${grantType}".` },
      { status: 400, headers: MCP_CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err?.message || 'Token exchange failed' },
      { status: 500, headers: MCP_CORS_HEADERS }
    );
  }
}
