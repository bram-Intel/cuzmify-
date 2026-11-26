import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { renderTemplateEngine, resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';
import type { BusinessBlueprint } from '@/core/blueprint-schema';

async function readOnboardingIgToken(): Promise<{ accessToken?: string; expiresAt?: Date; handle?: string }> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('cuzmify_ig_token')?.value;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.accessToken || undefined,
      expiresAt: parsed?.expiresAt ? new Date(parsed.expiresAt) : undefined,
      handle: parsed?.handle || undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { siteId, name, template, templateId, nicheId, category, htmlContent, grapesData, theme, domain, status, liveUrl } = body;

    let userId = session?.user?.id;
    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to save your website.' },
        { status: 401 }
      );
    }

    const targetId = siteId && siteId !== 'proj_default' ? siteId : undefined;
    const rawName = (name || 'My Studio').trim();
    const computedSubdomain =
      body.subdomain ||
      rawName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) ||
      'studio';
    const igCookieToken = await readOnboardingIgToken();

    let parsedBlueprint: BusinessBlueprint | null = null;
    if (body.blueprintData !== undefined && body.blueprintData !== null) {
      try {
        parsedBlueprint =
          typeof body.blueprintData === 'string'
            ? (JSON.parse(body.blueprintData) as BusinessBlueprint)
            : (body.blueprintData as BusinessBlueprint);
      } catch {
        parsedBlueprint = null;
      }
    }

    const resolveHtmlForSave = (effectiveSiteId: string | undefined, fallbackHtml?: string | null) => {
      if (typeof htmlContent === 'string' && htmlContent.trim().length > 0) {
        return htmlContent;
      }
      if (parsedBlueprint) {
        const resolvedTpl = resolveTemplateEngineId(templateId || parsedBlueprint.templateId);
        return renderTemplateEngine(resolvedTpl, parsedBlueprint, { siteId: effectiveSiteId }).fullHtml;
      }
      return fallbackHtml ?? undefined;
    };

    const resolveGrapesDataForSave = (existingGrapesData?: string | null) => {
      if (grapesData === null) return null;
      if (grapesData !== undefined) {
        return typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData);
      }
      // If blueprintData was updated without grapesData, clear stale grapesData so blueprint remains single source of truth
      if (parsedBlueprint) return null;
      return existingGrapesData;
    };

    let savedSite;
    if (targetId) {
      const existing = await prisma.site.findUnique({
        where: { id: targetId },
      });

      if (existing) {
        if (existing.userId !== userId) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to modify this website.' },
            { status: 403 }
          );
        }

        const activeSubdomain = body.subdomain || existing.subdomain || computedSubdomain;
        const resolvedTplId = resolveTemplateEngineId(templateId || parsedBlueprint?.templateId || existing.templateId);

        savedSite = await prisma.site.update({
          where: { id: targetId },
          data: {
            name: name || existing.name,
            subdomain: activeSubdomain,
            customDomain: body.customDomain !== undefined ? body.customDomain : existing.customDomain,
            nicheId: nicheId || parsedBlueprint?.nicheId || existing.nicheId,
            templateId: resolvedTplId,
            template: template || TEMPLATE_ENGINES[resolvedTplId]?.name || existing.template,
            category: category || parsedBlueprint?.profile?.category || existing.category,
            htmlContent: resolveHtmlForSave(targetId, existing.htmlContent),
            grapesData: resolveGrapesDataForSave(existing.grapesData),
            blueprintData:
              body.blueprintData !== undefined
                ? typeof body.blueprintData === 'string'
                  ? body.blueprintData
                  : JSON.stringify(body.blueprintData)
                : existing.blueprintData,
            theme: theme || existing.theme,
            instagramHandle: body.instagramHandle !== undefined ? body.instagramHandle : existing.instagramHandle || igCookieToken.handle,
            ...(igCookieToken.accessToken && !existing.instagramToken
              ? {
                  instagramToken: igCookieToken.accessToken,
                  instagramTokenExpiresAt: igCookieToken.expiresAt,
                }
              : {}),
            whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : existing.whatsappPhone,
            currency: body.currency || parsedBlueprint?.profile?.currency || existing.currency,
            domain: domain !== undefined ? domain : existing.domain || `${activeSubdomain}.cuzmify.com`,
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : existing.liveUrl || `/s/${activeSubdomain}`,
            updatedAt: new Date(),
          },
        });
      } else {
        const resolvedTplId = resolveTemplateEngineId(templateId || parsedBlueprint?.templateId);
        savedSite = await prisma.site.create({
          data: {
            id: targetId,
            userId,
            name: rawName,
            subdomain: computedSubdomain,
            customDomain: body.customDomain || undefined,
            nicheId: nicheId || parsedBlueprint?.nicheId || 'beauty_makeup',
            templateId: resolvedTplId,
            template: template || TEMPLATE_ENGINES[resolvedTplId]?.name || 'Editorial Atelier',
            category: category || parsedBlueprint?.profile?.category || 'Service Business',
            htmlContent: resolveHtmlForSave(targetId),
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            blueprintData: body.blueprintData ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : undefined,
            theme: theme || 'bram-light',
            instagramHandle: body.instagramHandle || igCookieToken.handle || undefined,
            ...(igCookieToken.accessToken
              ? {
                  instagramToken: igCookieToken.accessToken,
                  instagramTokenExpiresAt: igCookieToken.expiresAt,
                }
              : {}),
            whatsappPhone: body.whatsappPhone || undefined,
            currency: body.currency || parsedBlueprint?.profile?.currency || 'NGN',
            domain: domain || `${computedSubdomain}.cuzmify.com`,
            status: status || 'draft',
            liveUrl: liveUrl || `/s/${computedSubdomain}`,
          },
        });
      }
    } else {
      const existing = await prisma.site.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        const activeSubdomain = body.subdomain || existing.subdomain || computedSubdomain;
        const resolvedTplId = resolveTemplateEngineId(templateId || parsedBlueprint?.templateId || existing.templateId);
        savedSite = await prisma.site.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            subdomain: activeSubdomain,
            customDomain: body.customDomain !== undefined ? body.customDomain : existing.customDomain,
            nicheId: nicheId || parsedBlueprint?.nicheId || existing.nicheId,
            templateId: resolvedTplId,
            template: template || TEMPLATE_ENGINES[resolvedTplId]?.name || existing.template,
            category: category || parsedBlueprint?.profile?.category || existing.category,
            htmlContent: resolveHtmlForSave(existing.id, existing.htmlContent),
            grapesData: resolveGrapesDataForSave(existing.grapesData),
            blueprintData:
              body.blueprintData !== undefined
                ? typeof body.blueprintData === 'string'
                  ? body.blueprintData
                  : JSON.stringify(body.blueprintData)
                : existing.blueprintData,
            theme: theme || existing.theme,
            instagramHandle: body.instagramHandle !== undefined ? body.instagramHandle : existing.instagramHandle || igCookieToken.handle,
            ...(igCookieToken.accessToken && !existing.instagramToken
              ? {
                  instagramToken: igCookieToken.accessToken,
                  instagramTokenExpiresAt: igCookieToken.expiresAt,
                }
              : {}),
            whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : existing.whatsappPhone,
            currency: body.currency || parsedBlueprint?.profile?.currency || existing.currency,
            domain: domain !== undefined ? domain : existing.domain || `${activeSubdomain}.cuzmify.com`,
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : existing.liveUrl || `/s/${activeSubdomain}`,
            updatedAt: new Date(),
          },
        });
      } else {
        const resolvedTplId = resolveTemplateEngineId(templateId || parsedBlueprint?.templateId);
        savedSite = await prisma.site.create({
          data: {
            userId,
            name: rawName,
            subdomain: computedSubdomain,
            customDomain: body.customDomain || undefined,
            nicheId: nicheId || parsedBlueprint?.nicheId || 'beauty_makeup',
            templateId: resolvedTplId,
            template: template || TEMPLATE_ENGINES[resolvedTplId]?.name || 'Editorial Atelier',
            category: category || parsedBlueprint?.profile?.category || 'Service Business',
            htmlContent: resolveHtmlForSave(undefined),
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            blueprintData: body.blueprintData ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : undefined,
            theme: theme || 'bram-light',
            instagramHandle: body.instagramHandle || igCookieToken.handle || undefined,
            ...(igCookieToken.accessToken
              ? {
                  instagramToken: igCookieToken.accessToken,
                  instagramTokenExpiresAt: igCookieToken.expiresAt,
                }
              : {}),
            whatsappPhone: body.whatsappPhone || undefined,
            currency: body.currency || parsedBlueprint?.profile?.currency || 'NGN',
            domain: domain || `${computedSubdomain}.cuzmify.com`,
            status: status || 'draft',
            liveUrl: liveUrl || `/s/${computedSubdomain}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      site: {
        id: savedSite.id,
        name: savedSite.name,
        subdomain: savedSite.subdomain,
        domain: savedSite.domain,
        status: savedSite.status,
        liveUrl: savedSite.liveUrl,
        updatedAt: savedSite.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('[API /api/sites/save Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save site to database' },
      { status: 500 }
    );
  }
}
