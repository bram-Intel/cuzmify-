import { NextResponse } from 'next/server';
import { MCP_CORS_HEADERS } from '@/lib/mcp/mcp-oauth';

function resolveOrigin(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MCP_CORS_HEADERS });
}

export async function GET(req: Request) {
  const origin = resolveOrigin(req);
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/mcp/authorize`,
      token_endpoint: `${origin}/api/mcp/oauth/token`,
      registration_endpoint: `${origin}/api/mcp/oauth/register`,
      scopes_supported: ['mcp:read', 'mcp:write'],
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      code_challenge_methods_supported: ['S256'],
      service_documentation: `${origin}/privacy`,
    },
    { headers: { ...MCP_CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } }
  );
}
