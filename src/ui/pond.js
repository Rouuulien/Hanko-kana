/* ---------- Le bassin : Koï, vue du dessus, nage derrière les onglets ----------
   Posé une seule fois hors de #app (que render() remplace à chaque affichage) : la nage ne repart jamais de zéro.
   Trajectoire : une courbe de Lissajous (2:3) à l'échelle de la fenêtre, qui garde toujours Koï à l'écran. */
import { koiTop } from './koi.js';

const PERIOD = 90; // secondes pour une boucle complète (trois passages d'environ 30 s)
const AX = 0.34, // amplitudes : le centre de Koï reste entre 16 % et 84 % de la fenêtre
  AY = 0.36;
let pond = null,
  fish = null,
  on = true,
  timer = 0,
  fadeEnd = 0; // la nage continue pendant le fondu de sortie
const still = matchMedia('(prefers-reduced-motion: reduce)');

/** Position et cap de Koï à l'instant t (secondes), pour une fenêtre W × H. */
function at(t, W, H) {
  const a = (2 * Math.PI * t) / PERIOD;
  const x = W / 2 + W * AX * Math.sin(2 * a + 0.6),
    y = H / 2 + H * AY * Math.sin(3 * a);
  const dx = 2 * W * AX * Math.cos(2 * a + 0.6),
    dy = 3 * H * AY * Math.cos(3 * a);
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI + 90 }; // dessin tête en haut : +90°
}
function place(t) {
  const { x, y, deg } = at(t, innerWidth, innerHeight);
  fish.style.transform = `translate(${x - fish.offsetWidth / 2}px, ${y - fish.offsetHeight / 2}px) rotate(${deg}deg)`;
}
function tick() {
  timer = 0;
  if (still.matches) return place(PERIOD * 0.15); // immobile, à une place fixe
  place(performance.now() / 1000);
  // Bassin masqué (leçon, jeu, réglages) : on attend sans redessiner ; requestAnimationFrame s'arrête seul en arrière-plan.
  if (on || performance.now() < fadeEnd) timer = requestAnimationFrame(tick);
}
function mount() {
  pond = document.createElement('div');
  pond.className = 'pond';
  pond.setAttribute('aria-hidden', 'true');
  pond.innerHTML = `<div class="pond-k">${koiTop()}</div>`;
  fish = /** @type {HTMLElement} */ (pond.firstElementChild);
  document.body.prepend(pond);
  still.addEventListener('change', () => {
    cancelAnimationFrame(timer);
    tick();
  });
  addEventListener('resize', () => still.matches && tick());
}
/** Affiche ou masque le bassin (fondu CSS), en le créant au premier appel. */
function showPond(show) {
  if (!pond) mount();
  if (show === on && timer) return;
  on = show;
  if (!show) fadeEnd = performance.now() + 700;
  document.body.classList.toggle('pond-off', !show);
  if (show && !timer) tick();
}

export { at, showPond };
