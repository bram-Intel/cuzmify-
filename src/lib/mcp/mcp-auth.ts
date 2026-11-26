import { createHmac, timingSafeEqual } from 'crypto';

function getMcpSigningSecret(): string {
  return process.env.FOUNDER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'cuzmify-mcp-signing-secret';
}

const TRUSTED_MCP_ORIGINS = new Set([
  'https://cuzmify.vercel.app',
  'https://chatgpt.com',
  'https://chat.openai.com',
  'https://claude.ai',
  'https://mcpplaygroundonline.com',
]);

/**
 * Generates a compact, stateless Bearer token bound cleanly to a Cuzmify `userId`.
 * Allows external MCP clients (ChatGPT Apps, Claude Desktop, Cursor) to call `/api/mcp` securely.
 */
export function generateUserMcpToken(userId: string): string {
  const cleanUser = userId.trim();
  const sig = createHmac('sha256', getMcpSigningSecret())
    .update(`cuzmify-mcp-user:${cleanUser}`)
    .digest('hex')
    .slice(0, 24);
  return `czm_${cleanUser}.${sig}`;
}

export function verifyUserMcpToken(token: string): string | null {
  const clean = token.trim();
  if (!clean.startsWith('czm_') || !clean.includes('.')) return null;
  const body = clean.slice(4);
  const dotIdx = body.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const userId = body.slice(0, dotIdx);
  const provided = body.slice(dotIdx + 1);
  const expectedToken = generateUserMcpToken(userId);
  const expectedSig = expectedToken.slice(expectedToken.lastIndexOf('.') + 1);

  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

/**
 * Validates HTTP `Origin` header per MCP Streamable HTTP DNS-rebinding guidelines.
 * Server/CLI clients without an `Origin` header are permitted; browser requests with unrecognized origins get 403.
 */
export function isAllowedMcpOrigin(originHeader: string | null, requestUrl: string): boolean {
  if (!originHeader) return true;
  const trimmed = originHeader.trim();
  if (!trimmed) return true;
  try {
    const reqOrigin = new URL(requestUrl).origin;
    if (trimmed === reqOrigin) return true;
    if (TRUSTED_MCP_ORIGINS.has(trimmed)) return true;
    const parsedOrigin = new URL(trimmed);
    if (
      (parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '127.0.0.1') &&
      (parsedOrigin.protocol === 'http:' || parsedOrigin.protocol === 'https:')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts explicit Authorization header or `?token=` query credential if present.
 * Note: Returns `{ present: true, token }` whenever ANY Authorization header or token param exists
 * so malformed credentials are rejected explicitly with 401 instead of falling through.
 */
export function extractExplicitMcpToken(req: Request): { present: boolean; token: string } {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== null && authHeader.trim() !== '') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return { present: true, token: trimmed.slice(7).trim() };
    }
    return { present: true, token: '' };
  }

  try {
    const rawParam = new URL(req.url).searchParams.get('token');
    if (rawParam !== null && rawParam.trim() !== '') {
      return { present: true, token: rawParam.trim() };
    }
  } catch {}

  return { present: false, token: '' };
}
