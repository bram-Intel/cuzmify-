import { execSync } from 'node:child_process';

try {
  console.log('[Cuzmify Build] Attempting prisma db push...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  console.log('[Cuzmify Build] Database schema synced.');
} catch (err) {
  console.warn(
    '[Cuzmify Build] Warning: Could not reach PostgreSQL during build (check if Supabase free-tier project is paused). Continuing Next.js build...'
  );
}
