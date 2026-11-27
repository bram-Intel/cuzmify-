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
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: ['mcp:read', 'mcp:write'],
      bearer_methods_supported: ['header'],
      resource_name: 'Cuzmify MCP Server',
      resource_documentation: `${origin}/studio`,
    },
    { headers: { ...MCP_CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } }
  );
}
