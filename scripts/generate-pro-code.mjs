#!/usr/bin/env node
/**
 * Founder CLI helper: generate a signed Pro Activation Code for a customer's Site ID
 * Usage:
 *   node scripts/generate-pro-code.mjs <siteId>
 *
 * Reads FOUNDER_ADMIN_SECRET or NEXTAUTH_SECRET from .env / .env.local if present.
 */
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(fileName) {
  const fullPath = resolve(process.cwd(), fileName);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const siteId = process.argv[2]?.trim();
if (!siteId) {
  console.error('Usage: node scripts/generate-pro-code.mjs <siteId>');
  process.exit(1);
}

const secret =
  process.env.FOUNDER_ADMIN_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'cuzmify-founder-signing-key';

const digest = createHmac('sha256', secret)
  .update(`cuzmify-pro:${siteId}`)
  .digest('hex')
  .slice(0, 8)
  .toUpperCase();

const code = `PRO-${digest}`;

console.log('\n=================================================');
console.log(`  Site ID         : ${siteId}`);
console.log(`  Activation Code : ${code}`);
console.log('=================================================\n');
console.log('Send this code to the vendor on WhatsApp to unlock Cuzmify Pro immediately.');
