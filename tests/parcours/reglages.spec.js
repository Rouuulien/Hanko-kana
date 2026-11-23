// Réglages : options, remise à zéro (seulement après confirmation explicite).
import { test, expect } from '../helpers/hanko.js';
import { REAL, releve } from './_commun.js';

test('couper les sons est enregistré', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="tog"][data-k="snd"]').uncheck();
  expect((await hanko.stored()).snd).toBe(false);
});

test('effacer la progression demande une confirmation', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  // Une autre action désarme la confirmation, et le bouton reprend aussitôt son libellé
  // (corrigé : il restait sur « Confirmer » alors qu'un clic ne faisait plus que réarmer).
  await page.locator('[data-act="tog"][data-k="draw"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Effacer ma progression');
  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  expect((await hanko.run(H => H.S)).xp).toBe(500);

  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('0 / 208');
  const st = await hanko.stored();
  expect(st.xp).toBe(0);
  expect(st.learned).toEqual({});
});

test('armer puis désarmer « Effacer » ne réaffiche pas la page : un code de secours en cours de saisie est conservé', async ({
  hanko,
}) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('#impt').fill('{"learned":{}');
  await page.locator('[data-act="reset"]').click(); // armer
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  await expect(page.locator('#impt')).toHaveValue('{"learned":{}'); // corrigé : armer vidait la saisie
  await page.locator('[data-act="tog"][data-k="snd"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Effacer ma progression');
  await expect(page.locator('#impt')).toHaveValue('{"learned":{}');
});

test('Réglages : en-tête simple, options en liste, vrais interrupteurs', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 390, height: 844 });
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await expect(page.locator('header.top')).toHaveCount(0);
  await expect(page.locator('.set [data-act="home"]')).toHaveText('← Retour');
  const tog = page.locator('.sgroup input[type="checkbox"][data-act="tog"]');
  await expect(tog).toHaveCount(4);
  for (const h of await page.locator('.sgroup label.tg').evaluateAll(l => l.map(e => e.getBoundingClientRect().height)))
    expect(h).toBeGreaterThanOrEqual(44);
  expect(await tog.first().evaluate(e => getComputedStyle(e).appearance)).toBe('none');
});

for (const scheme of ['light', 'dark'])
  test(`interrupteur désactivé lisible (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    await hanko.page.setViewportSize({ width: 390, height: 844 });
    const page = (await hanko.open({ state: REAL })).page;
    await page.locator('header [data-act="settings"]').click();
    await expect(page.locator('[data-act="tog"][data-k="ear"]')).toBeDisabled();
    expect(await releve(page)).toEqual([]);
  });

for (const scheme of ['light', 'dark'])
  test(`interrupteur éteint : se détache de la carte (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: { ...REAL, unlock: false } })).page;
    await page.locator('header [data-act="settings"]').click();
    const ratio = await page.locator('[data-act="tog"][data-k="unlock"]').evaluate(input => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgba = s => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = s;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      };
      const lum = c =>
        c
          .slice(0, 3)
          .map(v => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
      const carte = rgba(getComputedStyle(input.closest('.sgroup')).backgroundColor);
      const m = getComputedStyle(input).boxShadow.match(/(rgba?|color)\([^)]*\)/);
      // le contour de l'interrupteur (liseré intérieur), mélangé au fond de la carte
      const c = m ? rgba(m[0]) : rgba(getComputedStyle(input).backgroundColor);
      const vu = c.slice(0, 3).map((v, i) => v * c[3] + carte[i] * (1 - c[3]));
      const a = lum(vu),
        b = lum(carte);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
