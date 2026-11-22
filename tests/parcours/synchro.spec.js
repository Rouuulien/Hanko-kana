// Synchronisation en ligne avec de faux services (aucun appel réseau) : Supabase et compte Claude.
import { test, expect, T0, HOUR } from '../helpers/hanko.js';
import { finirQuiz } from '../helpers/joueur.js';
import { REAL, sortKeys } from './_commun.js';

const SESSION = { user: { id: 'joueur-1', email: 'joueur@example.test' }, access_token: 'x' };
const synced = hanko => hanko.page.waitForFunction(() => __hanko.cloud.st === 'ok' && !__hanko.cloud.busy);

test.describe('Supabase', () => {
  test('nouvel appareil connecté : la progression en ligne est récupérée', async ({ hanko }) => {
    const page = (await hanko.open({ supabase: { session: SESSION, remote: REAL } })).page;
    await synced(hanko);
    expect(sortKeys(await hanko.run(H => H.S))).toEqual(sortKeys(REAL));
    expect(sortKeys(await hanko.stored())).toEqual(sortKeys(REAL));
    await expect(page.locator('.foot [data-cloud]')).toContainText('Sauvegardée sur ton compte (joueur@example.test)');
  });

  test('progression hors ligne plus récente : fusionnée et renvoyée en ligne', async ({ hanko }) => {
    const local = {
      ...REAL,
      at: REAL.at + HOUR,
      xp: 510,
      learned: { ...REAL.learned, た: { box: 1, due: T0 } },
      done: { ...REAL.done, 'h-ta': true },
    };
    const remote = { ...REAL, learned: { ...REAL.learned, あ: { box: 5, due: T0 + 99 * HOUR } }, tests: { h1: 70 } };
    await hanko.open({ state: local, supabase: { session: SESSION, remote } });
    await synced(hanko);
    const row = (await hanko.fake()).rows['joueur-1'];
    expect(row.learned.た).toEqual({ box: 1, due: T0 });
    expect(row.learned.あ.box).toBe(5);
    expect(row.done['h-ta']).toBe(true);
    expect(row.tests).toEqual({ h1: 70 });
    expect(row.xp).toBe(510);
  });

  test('une leçon jouée connecté est envoyée en ligne', async ({ hanko }) => {
    const page = (await hanko.open({ state: REAL, supabase: { session: SESSION, remote: REAL } })).page;
    await synced(hanko);
    await page.locator('.hero [data-act="lesson"]').click();
    await page.locator('[data-act="go"]').first().click();
    await finirQuiz(hanko);
    await expect.poll(async () => (await hanko.fake()).rows['joueur-1'].done['h-ta'], { timeout: 5000 }).toBe(true);
  });

  test('non connecté : progression locale seulement, invitation à créer un compte', async ({ hanko }) => {
    const page = (await hanko.open({ state: REAL, supabase: { session: null } })).page;
    await expect(page.locator('.foot [data-cloud]')).toContainText('sur cet appareil uniquement');
    expect((await hanko.fake()).calls).toEqual([]);
  });

  test('suppression du compte désarmée par une autre action : libellé remis, rien n’est supprimé', async ({
    hanko,
  }) => {
    const page = (await hanko.open({ state: REAL, supabase: { session: SESSION, remote: REAL } })).page;
    await synced(hanko);
    await page.locator('header [data-act="settings"]').click();
    await page.locator('[data-act="delacc"]').click();
    await expect(page.locator('[data-act="delacc"]')).toHaveText('Confirmer : tout supprimer');
    await page.locator('[data-act="tog"][data-k="snd"]').click();
    await expect(page.locator('[data-act="delacc"]')).toHaveText('Supprimer mon compte');
    await page.locator('[data-act="delacc"]').click();
    await expect(page.locator('[data-act="delacc"]')).toHaveText('Confirmer : tout supprimer');
    expect((await hanko.fake()).calls).not.toContain('rpc:delete_user');
  });

  test('armer la suppression du compte garde un mot de passe en cours de saisie', async ({ hanko }) => {
    const page = (await hanko.open({ state: REAL, supabase: { session: SESSION, remote: REAL } })).page;
    await synced(hanko);
    await page.locator('header [data-act="settings"]').click();
    await page.locator('[data-act="pwopen"]').click();
    await page.locator('#npw').fill('nouveau-mot-de-passe');
    await page.locator('[data-act="delacc"]').click();
    await expect(page.locator('[data-act="delacc"]')).toHaveText('Confirmer : tout supprimer');
    await expect(page.locator('#npw')).toHaveValue('nouveau-mot-de-passe');
  });

  test('suppression du compte : confirmation, appel serveur, progression effacée', async ({ hanko }) => {
    const page = (await hanko.open({ state: REAL, supabase: { session: SESSION, remote: REAL } })).page;
    await synced(hanko);
    await page.locator('header [data-act="settings"]').click();
    await page.locator('[data-act="delacc"]').click();
    await expect(page.locator('[data-act="delacc"]')).toHaveText('Confirmer : tout supprimer');
    await page.locator('[data-act="delacc"]').click();
    await expect(page.locator('.amsg')).toHaveText('Ton compte et ta progression en ligne ont été supprimés.');
    const f = await hanko.fake();
    expect(f.calls).toEqual(expect.arrayContaining(['rpc:delete_user', 'signOut']));
    expect(f.rows['joueur-1']).toBeUndefined();
    expect((await hanko.stored()).learned).toEqual({});
  });
});

test.describe('compte Claude (version claude.ai)', () => {
  test('progression en ligne récupérée, puis enregistrée au format attendu', async ({ hanko }) => {
    const page = (await hanko.open({ claude: { remote: REAL } })).page;
    await synced(hanko);
    expect(sortKeys(await hanko.run(H => H.S))).toEqual(sortKeys(REAL));
    await expect(page.locator('.foot [data-cloud]')).toContainText('Sauvegardée automatiquement sur ton compte Claude');
    await page.locator('[data-act="page"][data-id="words"]').click(); // toute action sauvegarde
    await expect.poll(async () => JSON.parse((await hanko.fake()).doc.data).page, { timeout: 5000 }).toBe('words');
    const doc = (await hanko.fake()).doc;
    expect(doc).toMatchObject({ v: 1, at: T0 });
  });
});
