import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createDefaultBlueprint, type BusinessBlueprint } from '@/core/blueprint-schema';
import { renderTemplateEngine, TEMPLATE_ENGINES } from '@/core/template-engines';
import {
  CUZMIFY_MCP_TOOLS,
  executeBlueprintMcpTool,
  validateMcpToolArguments,
} from '@/lib/mcp/cuzmify-tools';
import {
  extractExplicitMcpToken,
  isAllowedMcpOrigin,
  verifyUserMcpToken,
} from '@/lib/mcp/mcp-auth';

type McpAuthResult =
  | { status: 'authenticated'; userId: string }
  | { status: 'invalid_token' }
  | { status: 'unauthenticated' };

async function authenticateMcpRequest(req: Request): Promise<McpAuthResult> {
  const explicit = extractExplicitMcpToken(req);
  if (explicit.present) {
    const verifiedUserId = explicit.token ? verifyUserMcpToken(explicit.token) : null;
    if (!verifiedUserId) return { status: 'invalid_token' };
    return { status: 'authenticated', userId: verifiedUserId };
  }

  // Only allow browser cookie fallback on same-origin or server-internal calls
  const originHeader = req.headers.get('origin');
  const reqOrigin = new URL(req.url).origin;
  if (originHeader && originHeader.trim() !== reqOrigin) {
    return { status: 'unauthenticated' };
  }

  const session = await auth();
  if (session?.user?.id) return { status: 'authenticated', userId: session.user.id };
  if (session?.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (u?.id) return { status: 'authenticated', userId: u.id };
  }
  return { status: 'unauthenticated' };
}

function forbiddenOriginResponse(rpcId: string | number | null = null) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: rpcId,
      error: {
        code: -32003,
        message: 'Forbidden: Untrusted Origin header.',
      },
    },
    { status: 403 }
  );
}

function unauthorizedResponse(rpcId: string | number | null, reason: 'invalid_token' | 'unauthenticated') {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: rpcId,
      error: {
        code: -32001,
        message:
          reason === 'invalid_token'
            ? 'Unauthorized: Invalid or malformed Bearer token.'
            : 'Unauthorized: Provide a valid Authorization: Bearer czm_... token from /api/mcp/token.',
      },
    },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="cuzmify-mcp"',
      },
    }
  );
}

/** Public MCP server discovery endpoint (requires auth for full tool definitions) */
export async function GET(req: Request) {
  if (!isAllowedMcpOrigin(req.headers.get('origin'), req.url)) {
    return forbiddenOriginResponse(null);
  }

  const authRes = await authenticateMcpRequest(req);
  if (authRes.status === 'invalid_token') {
    return unauthorizedResponse(null, 'invalid_token');
  }

  const origin = new URL(req.url).origin;
  if (authRes.status === 'unauthenticated') {
    return NextResponse.json({
      name: 'cuzmify-mcp',
      version: '1.0.0',
      protocolVersion: '2025-03-26',
      transport: 'streamable-http-jsonrpc',
      endpoint: `${origin}/api/mcp`,
      tokenEndpoint: `${origin}/api/mcp/token`,
      authRequired: true,
      auth: 'Bearer token (generate via GET /api/mcp/token while signed in) or active same-origin Cuzmify session cookie',
      toolsCount: CUZMIFY_MCP_TOOLS.length,
    });
  }

  return NextResponse.json({
    name: 'cuzmify-mcp',
    version: '1.0.0',
    protocolVersion: '2025-03-26',
    transport: 'streamable-http-jsonrpc',
    endpoint: `${origin}/api/mcp`,
    tokenEndpoint: `${origin}/api/mcp/token`,
    authRequired: true,
    tools: CUZMIFY_MCP_TOOLS,
  });
}

/**
 * Cuzmify Streamable HTTP MCP Endpoint (JSON-RPC 2.0)
 * Enforces Origin checks, explicit invalid-token rejection on every method,
 * authenticated `tools/list` & `tools/call`, and strict JSON inputSchema validation.
 */
export async function POST(req: Request) {
  let rpcId: string | number | null = null;

  if (!isAllowedMcpOrigin(req.headers.get('origin'), req.url)) {
    return forbiddenOriginResponse(null);
  }

  try {
    const body = await req.json();
    rpcId = body?.id ?? null;
    const method = String(body?.method || '');
    const params = body?.params || {};

    const authRes = await authenticateMcpRequest(req);
    if (authRes.status === 'invalid_token') {
      return unauthorizedResponse(rpcId, 'invalid_token');
    }

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'cuzmify-mcp',
            version: '1.0.0',
          },
        },
      });
    }

    if (method === 'notifications/initialized' || method === 'ping') {
      return NextResponse.json({ jsonrpc: '2.0', id: rpcId, result: {} });
    }

    // Require valid authentication before listing or calling tools
    if (authRes.status !== 'authenticated') {
      return unauthorizedResponse(rpcId, 'unauthenticated');
    }
    const userId = authRes.userId;

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          tools: CUZMIFY_MCP_TOOLS,
        },
      });
    }

    if (method === 'tools/call') {
      const toolName = String(params?.name || '');
      const validation = validateMcpToolArguments(toolName, params?.arguments);
      if (!validation.valid) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify({ error: validation.error }) }],
          },
        });
      }

      const toolArgs = validation.args;
      const requestedSiteId = typeof toolArgs.siteId === 'string' ? toolArgs.siteId : undefined;

      const site = requestedSiteId
        ? await prisma.site.findFirst({ where: { id: requestedSiteId, userId } })
        : await prisma.site.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });

      if (!site) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify({ error: 'No website found for your account.' }) }],
          },
        });
      }

      const [accountSitesRaw, enquiriesCount] = await Promise.all([
        prisma.site.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: { id: true, name: true, subdomain: true, status: true, templateId: true, updatedAt: true },
        }),
        prisma.enquiry.count({ where: { siteId: site.id } }),
      ]);
      const accountSites = accountSitesRaw.map(
        (s: { id: string; name: string; subdomain: string | null; status: string; templateId: string; updatedAt: Date }) => ({
          ...s,
          updatedAt: s.updatedAt.toISOString(),
        })
      );

      // Server-side DB tools
      if (toolName === 'list_enquiries') {
        const limit = Math.min(25, Math.max(1, Number(toolArgs.limit) || 10));
        const leads = await prisma.enquiry.findMany({
          where: { siteId: site.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify({ siteId: site.id, count: leads.length, enquiries: leads }) }],
          },
        });
      }

      let bp: BusinessBlueprint = createDefaultBlueprint({
        name: site.name,
        category: site.category,
        nicheId: site.nicheId,
        templateId: site.templateId,
        currency: (site.currency as any) || 'NGN',
        whatsapp: site.whatsappPhone || '',
        instagramHandle: site.instagramHandle || '',
      });
      if (site.blueprintData) {
        try {
          bp = { ...bp, ...JSON.parse(site.blueprintData) };
        } catch {}
      }

      if (toolName === 'publish_site') {
        const rendered = renderTemplateEngine(bp.templateId, bp, { siteId: site.id });
        const cleanSlug =
          site.subdomain ||
          (bp.profile.name || site.name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) ||
          'studio';
        const liveUrl = `/s/${cleanSlug}`;
        await prisma.site.update({
          where: { id: site.id },
          data: {
            status: 'live',
            subdomain: cleanSlug,
            liveUrl,
            htmlContent: rendered.fullHtml,
            updatedAt: new Date(),
          },
        });
        const origin = new URL(req.url).origin;
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  published: true,
                  status: 'live',
                  siteId: site.id,
                  liveUrl: `${origin}${liveUrl}`,
                  template: TEMPLATE_ENGINES[rendered.templateId].name,
                }),
              },
            ],
          },
        });
      }

      if (toolName === 'unpublish_site') {
        await prisma.site.update({
          where: { id: site.id },
          data: {
            status: 'draft',
            updatedAt: new Date(),
          },
        });
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  published: false,
                  status: 'draft',
                  siteId: site.id,
                  summary: 'Website taken offline (status set to draft).',
                }),
              },
            ],
          },
        });
      }

      // Pure blueprint MCP tools -> persist updated blueprint & re-render HTML cleanly
      const exec = executeBlueprintMcpTool(toolName, toolArgs, bp, {
        plan: site.plan === 'pro' ? 'pro' : 'free',
        siteMeta: {
          id: site.id,
          name: site.name,
          subdomain: site.subdomain,
          status: site.status,
          customDomain: site.customDomain,
          liveUrl: site.liveUrl,
          plan: site.plan,
          enquiriesCount,
          accountSites,
        },
      });

      if (!exec.ok) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify({ error: exec.error || exec.changeSummary }) }],
          },
        });
      }

      if (toolName !== 'get_site_blueprint' && toolName !== 'inspect_rendered_page') {
        const rendered = renderTemplateEngine(exec.blueprint.templateId, exec.blueprint, { siteId: site.id });
        await prisma.site.update({
          where: { id: site.id },
          data: {
            name: exec.blueprint.profile.name || site.name,
            nicheId: exec.blueprint.nicheId || site.nicheId,
            templateId: rendered.templateId,
            template: TEMPLATE_ENGINES[rendered.templateId].name,
            currency: exec.blueprint.profile.currency || site.currency,
            whatsappPhone: exec.blueprint.modules.whatsapp.phoneNumber || site.whatsappPhone,
            blueprintData: JSON.stringify(exec.blueprint),
            htmlContent: rendered.fullHtml,
            updatedAt: new Date(),
          },
        });
      }

      const contentBlocks: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            siteId: site.id,
            summary: exec.changeSummary,
            ...(exec.data ? { data: exec.data } : {}),
          }),
        },
      ];

      // Expose uploaded image previews cleanly for multimodal MCP clients on inspect_rendered_page
      if (toolName === 'inspect_rendered_page' && toolArgs.includeImages !== false) {
        for (const asset of (bp.mediaVault || []).slice(0, 3)) {
          const src = asset.thumbnailUrl || asset.url || '';
          const imgMatch = src.match(/^data:(image\/(?:webp|png|jpeg|jpg|gif));base64,(.+)$/i);
          if (imgMatch && imgMatch[2].length < 400_000) {
            contentBlocks.push({
              type: 'image',
              data: imgMatch[2],
              mimeType: imgMatch[1].toLowerCase(),
            });
          }
        }
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          isError: false,
          content: contentBlocks,
        },
      });
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: rpcId,
        error: { code: -32601, message: `Method "${method}" not found` },
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: rpcId,
        error: { code: -32603, message: err?.message || 'Internal MCP server error' },
      },
      { status: 500 }
    );
  }
}
