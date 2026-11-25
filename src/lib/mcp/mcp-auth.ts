import { createHmac, timingSafeEqual } from 'crypto';

function getMcpSigningSecret(): string {
  return process.env.FOUNDER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'cuzmify-mcp-signing-secret';
}

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
