import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

function getMcpOAuthSecret(): string {
  return process.env.FOUNDER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'cuzmify-mcp-signing-secret';
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

function signPayload(prefix: string, payloadObj: Record<string, unknown>): string {
  const encoded = toBase64Url(JSON.stringify(payloadObj));
  const sig = toBase64Url(
    createHmac('sha256', getMcpOAuthSecret())
      .update(`${prefix}:${encoded}`)
      .digest()
  );
  return `${prefix}_${encoded}.${sig}`;
}

function verifySignedPayload<T extends Record<string, unknown>>(token: string, expectedPrefix: string): T | null {
  const clean = token.trim();
  const prefixWithUnderscore = `${expectedPrefix}_`;
  if (!clean.startsWith(prefixWithUnderscore)) return null;
  const rest = clean.slice(prefixWithUnderscore.length);
  const dotIdx = rest.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const encoded = rest.slice(0, dotIdx);
  const providedSig = rest.slice(dotIdx + 1);
  const expectedSig = toBase64Url(
    createHmac('sha256', getMcpOAuthSecret())
      .update(`${expectedPrefix}:${encoded}`)
      .digest()
  );

  try {
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(fromBase64Url(encoded).toString('utf8')) as T;
    if (typeof parsed.exp === 'number' && Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isAllowedOAuthRedirectUri(rawUri: string): boolean {
  try {
    const parsed = new URL(rawUri.trim());
    if (parsed.protocol === 'https:') return Boolean(parsed.hostname);
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]')
    ) {
      return true;
    }
    // Desktop IDE deep-link callbacks (Cursor, VS Code, Windsurf, Claude Desktop)
    if (['cursor:', 'vscode:', 'windsurf:', 'claude:'].includes(parsed.protocol)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export interface DynamicClientMetadata {
  clientName: string;
  redirectUris: string[];
  createdAt: number;
}

export function registerDynamicMcpClient(input: {
  client_name?: string;
  redirect_uris?: unknown;
}): { ok: true; clientId: string; clientName: string; redirectUris: string[] } | { ok: false; error: string } {
  const rawUris = Array.isArray(input.redirect_uris) ? input.redirect_uris : [];
  const redirectUris = rawUris
    .filter((u): u is string => typeof u === 'string' && isAllowedOAuthRedirectUri(u))
    .slice(0, 10);

  if (redirectUris.length === 0) {
    return {
      ok: false,
      error: 'redirect_uris must include at least one valid https://, localhost, or IDE callback URI.',
    };
  }

  const clientName =
    typeof input.client_name === 'string' && input.client_name.trim()
      ? input.client_name.trim().slice(0, 80)
      : inferClientDisplayName(redirectUris[0]);

  const clientId = signPayload('czd', {
    n: clientName,
    r: redirectUris,
    iat: Date.now(),
    nonce: randomBytes(6).toString('hex'),
  });

  return { ok: true, clientId, clientName, redirectUris };
}

export function verifyRegisteredMcpClient(clientId: string): DynamicClientMetadata | null {
  const parsed = verifySignedPayload<{ n?: string; r?: string[]; iat?: number }>(clientId, 'czd');
  if (!parsed || !Array.isArray(parsed.r) || parsed.r.length === 0) return null;
  return {
    clientName: typeof parsed.n === 'string' && parsed.n ? parsed.n : 'MCP Client',
    redirectUris: parsed.r,
    createdAt: typeof parsed.iat === 'number' ? parsed.iat : Date.now(),
  };
}

export function inferClientDisplayName(redirectOrClientId?: string | null): string {
  const raw = (redirectOrClientId || '').toLowerCase();
  if (raw.includes('chatgpt.com') || raw.includes('openai.com')) return 'ChatGPT';
  if (raw.includes('claude.ai') || raw.includes('anthropic.com')) return 'Claude';
  if (raw.includes('cursor')) return 'Cursor';
  if (raw.includes('vscode')) return 'VS Code';
  if (raw.includes('windsurf')) return 'Windsurf';
  if (raw.includes('localhost') || raw.includes('127.0.0.1')) return 'Local MCP Client';
  return 'External AI Assistant';
}

export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  if (!codeVerifier || !codeChallenge) return false;
  const computed = toBase64Url(createHash('sha256').update(codeVerifier).digest());
  try {
    const a = Buffer.from(computed);
    const b = Buffer.from(codeChallenge.trim());
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function issueMcpOAuthCode(params: {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope?: string;
  resource?: string;
}): string {
  return signPayload('czc', {
    uid: params.userId,
    cid: params.clientId,
    ru: params.redirectUri,
    cc: params.codeChallenge,
    scp: params.scope || 'mcp:read mcp:write',
    res: params.resource || undefined,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

export function verifyAndConsumeMcpOAuthCode(params: {
  code: string;
  clientId?: string;
  redirectUri?: string;
  codeVerifier: string;
}): { userId: string; clientId: string; scope: string } | null {
  const payload = verifySignedPayload<{
    uid?: string;
    cid?: string;
    ru?: string;
    cc?: string;
    scp?: string;
  }>(params.code, 'czc');

  if (!payload?.uid || !payload?.ru || !payload?.cc) return null;
  if (params.redirectUri && payload.ru !== params.redirectUri) return null;
  if (params.clientId && payload.cid && payload.cid !== params.clientId) return null;
  if (!verifyPkceS256(params.codeVerifier, payload.cc)) return null;

  return {
    userId: payload.uid,
    clientId: payload.cid || params.clientId || '',
    scope: payload.scp || 'mcp:read mcp:write',
  };
}

export const MCP_ACCESS_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function issueMcpOAuthAccessToken(userId: string, scope = 'mcp:read mcp:write', clientId = ''): string {
  return signPayload('czo', {
    uid: userId,
    scp: scope,
    cid: clientId,
    exp: Date.now() + MCP_ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
}

export function verifyMcpOAuthAccessToken(token: string): { userId: string; scope: string; clientId: string } | null {
  const payload = verifySignedPayload<{ uid?: string; scp?: string; cid?: string }>(token, 'czo');
  if (!payload?.uid) return null;
  return {
    userId: payload.uid,
    scope: payload.scp || 'mcp:read mcp:write',
    clientId: payload.cid || '',
  };
}

export function issueMcpOAuthRefreshToken(userId: string, scope = 'mcp:read mcp:write', clientId = ''): string {
  return signPayload('czr', {
    uid: userId,
    scp: scope,
    cid: clientId,
    exp: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
  });
}

export function verifyMcpOAuthRefreshToken(token: string): { userId: string; scope: string; clientId: string } | null {
  const payload = verifySignedPayload<{ uid?: string; scp?: string; cid?: string }>(token, 'czr');
  if (!payload?.uid) return null;
  return {
    userId: payload.uid,
    scope: payload.scp || 'mcp:read mcp:write',
    clientId: payload.cid || '',
  };
}

export const MCP_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
};
