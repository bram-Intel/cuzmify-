import { redirect } from 'next/navigation';

/**
 * Marketplace is parked for Post-MVP (`src/_parked/marketplace`).
 * Redirects visitors cleanly to the core onboarding flow.
 */
export default function MarketplaceRedirectPage() {
  redirect('/onboarding');
}
