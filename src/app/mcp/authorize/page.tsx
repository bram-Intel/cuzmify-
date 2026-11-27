import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  inferClientDisplayName,
  isAllowedOAuthRedirectUri,
  verifyRegisteredMcpClient,
} from '@/lib/mcp/mcp-oauth';
import { AuthorizeConsentClient } from './AuthorizeConsentClient';

export const metadata = {
  title: 'Authorize MCP Access — Cuzmify',
  description: 'Connect ChatGPT, Claude, or Cursor securely to your Cuzmify Studio websites.',
};

interface AuthorizePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickParam(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] || '' : val || '';
}

export default async function McpAuthorizePage({ searchParams }: AuthorizePageProps) {
  const params = await searchParams;
  const responseType = pickParam(params.response_type) || 'code';
  const clientId = pickParam(params.client_id);
  const redirectUri = pickParam(params.redirect_uri);
  const codeChallenge = pickParam(params.code_challenge);
  const codeChallengeMethod = pickParam(params.code_challenge_method) || 'S256';
  const state = pickParam(params.state);
  const scope = pickParam(params.scope) || 'mcp:read mcp:write';
  const resource = pickParam(params.resource) || undefined;

  if (responseType !== 'code' || !redirectUri || !isAllowedOAuthRedirectUri(redirectUri) || !codeChallenge || codeChallengeMethod !== 'S256') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-2">
          <h1 className="text-lg font-bold text-slate-900">Invalid OAuth Request</h1>
          <p className="text-xs text-slate-600">
            Cuzmify MCP requires OAuth 2.1 Authorization Code with PKCE (<code>S256</code>) and a valid HTTPS or localhost redirect URI.
          </p>
        </div>
      </div>
    );
  }

  const session = await auth();
  if (!session?.user?.email && !session?.user?.id) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      const str = pickParam(v);
      if (str) qs.set(k, str);
    });
    const callbackUrl = `/mcp/authorize?${qs.toString()}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true, _count: { select: { sites: true } } },
      })
    : await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, email: true, name: true, _count: { select: { sites: true } } },
      });

  if (!user) {
    redirect('/login');
  }

  const registered = clientId ? verifyRegisteredMcpClient(clientId) : null;
  if (registered && !registered.redirectUris.includes(redirectUri)) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-2">
          <h1 className="text-lg font-bold text-slate-900">Redirect URI Mismatch</h1>
          <p className="text-xs text-slate-600">The requested redirect URI is not registered for this client.</p>
        </div>
      </div>
    );
  }

  const clientName = registered?.clientName || inferClientDisplayName(redirectUri || clientId);

  return (
    <AuthorizeConsentClient
      clientName={clientName}
      clientId={clientId}
      redirectUri={redirectUri}
      codeChallenge={codeChallenge}
      state={state}
      scope={scope}
      resource={resource}
      userEmail={user.email || ''}
      userName={user.name}
      siteCount={user._count.sites}
    />
  );
}
