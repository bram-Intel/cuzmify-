import { NextResponse } from 'next/server';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import type { MediaVaultAsset } from '@/core/blueprint-schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const handle = InstagramImporter.cleanHandle(body.handle || '');

    if (!handle) {
      return NextResponse.json({ error: 'Instagram handle is required' }, { status: 400 });
    }

    // Check if we have cached media
    const cached = InstagramImporter.getCachedMedia(handle);
    const count = cached ? cached.length : 0;

    return NextResponse.json({
      success: true,
      handle,
      syncedAt: new Date().toISOString(),
      mediaCount: count,
      mediaVault: cached || [],
      message: count > 0 ? `Successfully synced ${count} Instagram assets.` : 'Profile synced with starter visual library.',
    });
  } catch (error: any) {
    console.error('[Instagram Sync API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync Instagram profile' }, { status: 500 });
  }
}
