import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createDefaultBlueprint, type BusinessBlueprint } from '@/core/blueprint-schema';
import { renderTemplateEngine, TEMPLATE_ENGINES } from '@/core/template-engines';
import { CUZMIFY_MCP_TOOLS, executeBlueprintMcpTool } from '@/lib/mcp/cuzmify-tools';
import { verifyUserMcpToken } from '@/lib/mcp/mcp-auth';

async function resolveMcpUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const verifiedUserId = verifyUserMcpToken(token);
    if (verifiedUserId) return verifiedUserId;
  }

  const session = await auth();
  if (session?.user?.id) return session.user.id;
  if (session?.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    return u?.id || null;
  }
  return null;
}

/** Public MCP server discovery endpoint */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    name: 'cuzmify-mcp',
    version: '1.0.0',
    protocolVersion: '2025-03-26',
    transport: 'streamable-http-jsonrpc',
    endpoint: `${origin}/api/mcp`,
    tokenEndpoint: `${origin}/api/mcp/token`,
    auth: 'Bearer token (generate via GET /api/mcp/token while signed in) or active Cuzmify session cookie',
    tools: CUZMIFY_MCP_TOOLS,
  });
}

/**
 * Cuzmify Streamable HTTP MCP Endpoint (JSON-RPC 2.0)
 * Supports `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`.
 */
export async function POST(req: Request) {
  let rpcId: string | number | null = null;

  try {
    const body = await req.json();
    rpcId = body.id ?? null;
    const method = String(body.method || '');
    const params = body.params || {};

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

    if (method === 'notifications/initialized') {
      return NextResponse.json({ jsonrpc: '2.0', id: rpcId, result: {} });
    }

    if (method === 'ping') {
      return NextResponse.json({ jsonrpc: '2.0', id: rpcId, result: {} });
    }

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
      const userId = await resolveMcpUserId(req);
      if (!userId) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id: rpcId,
            error: {
              code: -32001,
              message: 'Unauthorized: Provide a valid Authorization: Bearer czm_... token from /api/mcp/token.',
            },
          },
          { status: 401 }
        );
      }

      const toolName = String(params.name || '');
      const toolArgs = (params.arguments || {}) as Record<string, any>;
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
                  siteId: site.id,
                  liveUrl: `${origin}${liveUrl}`,
                  template: TEMPLATE_ENGINES[rendered.templateId].name,
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
          subdomain: site.subdomain,
          status: site.status,
          customDomain: site.customDomain,
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

      if (toolName !== 'get_site_blueprint') {
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

      return NextResponse.json({
        jsonrpc: '2.0',
        id: rpcId,
        result: {
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                siteId: site.id,
                summary: exec.changeSummary,
                ...(exec.data ? { data: exec.data } : {}),
              }),
            },
          ],
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
