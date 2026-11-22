// Synchronisation (src/sync/cloud.js) avec un faux service en ligne : envoi différé et regroupé,
// envoi pendant un envoi en cours, fusion à la réception, erreurs.
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fauxStockage, fixture, T0, HOUR } from './_outils.js';

globalThis.document = { addEventListener() {}, querySelectorAll: () => [], visibilityState: 'visible' };
const { cloud, save, cloudPull, cloudPush, cloudText, bindUI } = await import('../../src/sync/cloud.js');
const { S, fresh, replaceState, KEY } = await import('../../src/core/state.js');

const REAL = fixture('vraie-sauvegarde');
let renders, stock;
const flush = () => new Promise(r => setImmediate(r));

/** Faux service : `remote` = document en ligne ; `delay` : la promesse de put reste en attente jusqu'à release(). */
function service(remote = null, { failGet, failPut, delay } = {}) {
  const f = { remote, puts: [], pending: [] };
  f.api = {
    get: async () => {
      if (failGet) throw new Error('réseau');
      return f.remote && JSON.parse(JSON.stringify(f.remote));
    },
    put: st => {
      f.puts.push(JSON.parse(JSON.stringify(st)));
      if (failPut) return Promise.reject(failPut);
      if (!delay) {
        f.remote = JSON.parse(JSON.stringify(st));
        return Promise.resolve();
      }
      return new Promise(ok =>
        f.pending.push(() => {
          f.remote = JSON.parse(JSON.stringify(st));
          ok();
        }),
      );
    },
  };
  return f;
}
const brancher = f =>
  Object.assign(cloud, {
    api: f.api,
    ready: true,
    busy: false,
    dirty: false,
    st: 'sync',
    mode: 'sb',
    email: 'joueur@example.test',
    last: 0,
  });

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: T0 });
  stock = fauxStockage();
  replaceState(fresh());
  renders = 0;
  bindUI({ render: () => renders++, view: () => 'home', go() {}, resetTip() {} });
});
afterEach(() => mock.timers.reset());

test('save() écrit tout de suite en local, puis envoie en ligne 1,2 s après la dernière sauvegarde', async () => {
  const f = service();
  brancher(f);
  S.xp = 1;
  save();
  assert.equal(JSON.parse(stock.get(KEY)).at, T0);
  mock.timers.tick(1000);
  S.xp = 2;
  save();
  mock.timers.tick(1000);
  await flush();
  assert.equal(f.puts.length, 0, 'pas encore : le délai repart à chaque sauvegarde');
  mock.timers.tick(200);
  await flush();
  assert.equal(f.puts.length, 1);
  assert.equal(f.puts[0].xp, 2);
  assert.equal(cloud.st, 'ok');
});

test('sauvegarde pendant un envoi en cours : un seul envoi supplémentaire, avec le dernier état', async () => {
  const f = service(null, { delay: true });
  brancher(f);
  S.xp = 1;
  const p = cloudPush();
  S.xp = 2;
  cloudPush();
  S.xp = 3;
  cloudPush();
  assert.equal(f.puts.length, 1);
  f.pending.shift()();
  await p;
  await flush();
  assert.equal(f.puts.length, 2);
  assert.equal(f.puts[1].xp, 3);
  f.pending.shift()();
  await flush();
  assert.equal(cloud.st, 'ok');
});

test('pas d’envoi tant que la première réception n’a pas eu lieu (sinon on écraserait la version en ligne)', async () => {
  const f = service(REAL);
  brancher(f);
  cloud.ready = false;
  S.xp = 1;
  save();
  mock.timers.tick(5000);
  await flush();
  assert.equal(f.puts.length, 0);
});

test('réception : vraie sauvegarde en ligne sur un appareil vierge → récupérée et gardée en local', async () => {
  const f = service(REAL);
  brancher(f);
  cloud.ready = false;
  await cloudPull();
  await flush();
  assert.equal(S.xp, 500);
  assert.equal(Object.keys(S.learned).length, 15);
  assert.equal(JSON.parse(stock.get(KEY)).xp, 500);
  assert.ok(renders > 0, 'l’accueil est réaffiché');
  assert.equal(cloud.ready, true);
});

test('réception : progression locale plus riche → fusion, puis renvoi en ligne', async () => {
  replaceState({
    ...fresh(),
    ...REAL,
    at: REAL.at + HOUR,
    xp: 510,
    learned: { ...REAL.learned, た: { box: 1, due: T0 } },
  });
  const f = service(REAL);
  brancher(f);
  cloud.ready = false;
  await cloudPull();
  await flush();
  assert.equal(f.puts.length, 1);
  assert.equal(f.remote.xp, 510);
  assert.ok(f.remote.learned.た);
});

test('réception : rien en ligne → la progression locale est envoyée ; appareil vierge → rien à envoyer', async () => {
  replaceState({ ...fresh(), xp: 5, learned: { あ: { box: 1, due: 0 } } });
  let f = service(null);
  brancher(f);
  cloud.ready = false;
  await cloudPull();
  await flush();
  assert.equal(f.puts.length, 1);
  replaceState(fresh());
  f = service(null);
  brancher(f);
  cloud.ready = false;
  await cloudPull();
  await flush();
  assert.equal(f.puts.length, 0);
  assert.equal(cloud.st, 'ok');
});

test('erreurs : serveur injoignable → « err », accès révoqué → « local », progression locale intacte', async () => {
  replaceState({ ...fresh(), xp: 42 });
  brancher(service(REAL, { failGet: true }));
  await cloudPull();
  assert.equal(cloud.st, 'err');
  assert.equal(S.xp, 42);
  assert.match(cloudText(), /gardée sur cet appareil/);
  brancher(service(null, { failPut: { code: 'revoked' } }));
  await cloudPush();
  assert.equal(cloud.st, 'local');
  brancher(service(null, { failPut: new Error('500') }));
  await cloudPush();
  assert.equal(cloud.st, 'err');
});

test('réception d’une sauvegarde en ligne abîmée (learned à null) : fusionnée sans plantage, puis réparée en ligne', async () => {
  replaceState({ ...fresh(), learned: { あ: { box: 3, due: T0 } }, xp: 10, at: T0 - HOUR });
  const f = service({ learned: null, done: { 'h-a': true }, xp: 300, at: T0 });
  brancher(f);
  cloud.ready = false;
  await cloudPull();
  await flush();
  assert.deepEqual(S.learned, { あ: { box: 3, due: T0 } });
  assert.deepEqual(S.done, { 'h-a': true });
  assert.equal(S.xp, 300);
  assert.equal(f.puts.length, 1, 'la version réparée et fusionnée est renvoyée');
  assert.deepEqual(f.remote.learned, { あ: { box: 3, due: T0 } });
});

test('textes d’état', () => {
  Object.assign(cloud, { st: 'ok', mode: 'sb', last: 0 });
  assert.equal(cloudText(), 'Sauvegardée sur ton compte (joueur@example.test).');
  cloud.mode = 'claude';
  assert.equal(cloudText(), 'Sauvegardée automatiquement sur ton compte Claude.');
  cloud.st = 'anon';
  assert.match(cloudText(), /Crée un compte gratuit/);
});
