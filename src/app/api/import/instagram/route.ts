import { NextResponse } from 'next/server';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import { CurrencyCode } from '@/core/blueprint-schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { handle, currency } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ error: 'Instagram handle or URL is required' }, { status: 400 });
    }

    const result = await InstagramImporter.ingestProfile(handle, (currency as CurrencyCode) || 'USD');
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /api/import/instagram] Error:', error);
    return NextResponse.json({ error: 'Failed to ingest Instagram profile' }, { status: 500 });
  }
}
