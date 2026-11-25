import { redirect } from 'next/navigation';

/**
 * Website URL Revamper is parked for Post-MVP (`src/_parked/importer`).
 * Redirects visitors cleanly to the core onboarding flow.
 */
export default function ImporterRedirectPage() {
  redirect('/onboarding');
}
