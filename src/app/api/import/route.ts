import { NextResponse } from 'next/server';

/**
 * Parked for Post-MVP (`src/_parked/importer/website-importer.ts`).
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Website URL import is parked for post-MVP. Please connect Instagram or create your site directly.' },
    { status: 410 }
  );
}
