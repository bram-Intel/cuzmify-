import { describe, expect, it } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';
import { FREE_PLAN_SERVICE_LIMIT } from '@/lib/billing-constants';
import {
  CUZMIFY_MCP_TOOLS,
  executeBlueprintMcpTool,
  toGeminiFunctionDeclarations,
} from '@/lib/mcp/cuzmify-tools';
import { generateUserMcpToken, verifyUserMcpToken } from '@/lib/mcp/mcp-auth';

describe('Cuzmify MCP Tool Registry & Execution', () => {
  it('exposes standard MCP tool schemas and Gemini function declarations', () => {
    expect(CUZMIFY_MCP_TOOLS.length).toBeGreaterThanOrEqual(9);
    const decls = toGeminiFunctionDeclarations();
    expect(decls.some((d) => d.name === 'upsert_service_package')).toBe(true);
    expect(decls.some((d) => d.name === 'switch_template_style')).toBe(true);
  });

  it('adds and updates services without inventing prices and respects free tier limits', () => {
    let bp = createDefaultBlueprint({ name: 'Tolu Artistry', currency: 'NGN', nicheId: 'beauty_makeup' });

    // Quote service (no price)
    const r1 = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'Destination Bridal Quote', price: 0, priceMode: 'quote' },
      bp,
      { plan: 'free' }
    );
    expect(r1.ok).toBe(true);
    expect(r1.blueprint.modules.services.items[0].priceMode).toBe('quote');
    bp = r1.blueprint;

    // Fill up to FREE_PLAN_SERVICE_LIMIT
    for (let i = 2; i <= FREE_PLAN_SERVICE_LIMIT; i++) {
      const res = executeBlueprintMcpTool(
        'upsert_service_package',
        { name: `Package ${i}`, price: 25000 * i, priceMode: 'starting_at' },
        bp,
        { plan: 'free' }
      );
      expect(res.ok).toBe(true);
      bp = res.blueprint;
    }

    // Exceeding free tier fails cleanly on free plan, succeeds on pro
    const blocked = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'VIP Package 5', price: 150000 },
      bp,
      { plan: 'free' }
    );
    expect(blocked.ok).toBe(false);

    const allowedPro = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'VIP Package 5', price: 150000 },
      bp,
      { plan: 'pro' }
    );
    expect(allowedPro.ok).toBe(true);
  });

  it('switches template styles losslessly while keeping services and promotes hero photo', () => {
    let bp = createDefaultBlueprint({
      name: 'Kemi Events',
      currency: 'NGN',
      mediaVault: [
        { id: 'img-1', url: 'https://example.com/1.webp', name: 'Shot 1', type: 'hero', source: 'upload', addedAt: '' },
        { id: 'img-2', url: 'https://example.com/2.webp', name: 'Shot 2', type: 'gallery', source: 'upload', addedAt: '' },
      ],
    });
    bp = executeBlueprintMcpTool('upsert_service_package', { name: 'Full Decor', price: 450000 }, bp).blueprint;

    const switched = executeBlueprintMcpTool('switch_template_style', { templateId: 'noir-showcase' }, bp);
    expect(switched.ok).toBe(true);
    expect(switched.blueprint.templateId).toBe('noir-showcase');
    expect(switched.blueprint.modules.services.items).toHaveLength(1);

    const promoted = executeBlueprintMcpTool('promote_media_to_hero', { photoNumber: 2 }, switched.blueprint);
    expect(promoted.ok).toBe(true);
    expect(promoted.blueprint.mediaVault[0].id).toBe('img-2');
    expect(promoted.blueprint.mediaVault[0].type).toBe('hero');
  });

  it('signs and verifies user-scoped MCP Bearer tokens safely', () => {
    const token = generateUserMcpToken('user_abc_123');
    expect(verifyUserMcpToken(token)).toBe('user_abc_123');
    expect(verifyUserMcpToken(`${token}tampered`)).toBeNull();
  });
});
