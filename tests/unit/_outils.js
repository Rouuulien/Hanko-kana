// Outils des tests unitaires (node --test, sans dépendance) : faux localStorage, horloge, hasard reproductible.
import { mock } from 'node:test';
import { readFileSync } from 'node:fs';

export const T0 = Date.UTC(2026, 0, 15, 9, 0, 0),
  HOUR = 36e5,
  DAY = 864e5;

export function fauxStockage(init = {}) {
  const m = new Map(Object.entries(init));
  globalThis.localStorage = {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
  return m;
}
export const horloge = (now = T0) => {
  mock.timers.reset();
  mock.timers.enable({ apis: ['Date'], now });
};
export function hasard(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const fixture = n => JSON.parse(readFileSync(new URL(`../fixtures/${n}.json`, import.meta.url), 'utf8'));
export const golden = n => JSON.parse(readFileSync(new URL(`../golden/${n}.json`, import.meta.url), 'utf8'));
