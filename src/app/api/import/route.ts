import { NextResponse } from 'next/server';
import { WebsiteImporter } from '@/services/importer/website-importer';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await WebsiteImporter.analyzeWebsite(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 });
  }
}
