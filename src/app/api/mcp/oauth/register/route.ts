import { NextResponse } from 'next/server';
import { MCP_CORS_HEADERS, registerDynamicMcpClient } from '@/lib/mcp/mcp-oauth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MCP_CORS_HEADERS });
}

/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration Endpoint
 * Used automatically by ChatGPT Connectors, Claude Connectors, and MCP Inspector.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const reg = registerDynamicMcpClient({
      client_name: body?.client_name,
      redirect_uris: body?.redirect_uris,
    });

    if (!reg.ok) {
      return NextResponse.json(
        { error: 'invalid_client_metadata', error_description: reg.error },
        { status: 400, headers: MCP_CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        client_id: reg.clientId,
        client_name: reg.clientName,
        redirect_uris: reg.redirectUris,
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        scope: 'mcp:read mcp:write',
        client_id_issued_at: Math.floor(Date.now() / 1000),
      },
      { status: 201, headers: MCP_CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err?.message || 'Registration failed' },
      { status: 500, headers: MCP_CORS_HEADERS }
    );
  }
}
