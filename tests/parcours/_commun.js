import { readFileSync } from 'node:fs';
export const REAL = JSON.parse(readFileSync(new URL('../fixtures/vraie-sauvegarde.json', import.meta.url), 'utf8'));
export const sortKeys = o =>
  JSON.parse(
    JSON.stringify(o, (k, v) =>
      v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v,
    ),
  );
