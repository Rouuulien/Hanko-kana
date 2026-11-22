import { allDone } from '../core/progress.js';
/* ---------- Daru, la mascotte (daruma original) ---------- */
function daru(mood, size, both) {
  const s = size || 72,
    ink = '#1d1b20';
  const eyes =
    mood === 'happy'
      ? `<path d="M33 47q5-7 10 0M57 47q5-7 10 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
      : mood === 'oops'
        ? `<circle cx="38" cy="47" r="4.2" fill="${ink}"/><circle cx="62" cy="47" r="4.2" fill="${ink}"/>`
        : `<circle cx="38" cy="47" r="6" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="38" cy="47" r="3.6" fill="${ink}"/><circle cx="62" cy="47" r="6" fill="#fff" stroke="${ink}" stroke-width="2"/>${both ? `<circle cx="62" cy="47" r="3.6" fill="${ink}"/>` : ''}`;
  const brows =
    mood === 'oops'
      ? `<path d="M29 38q8 0 14-4M71 38q-8 0-14-4" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<path d="M29 37q7-8 15-3M71 37q-7-8-15-3" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const mouth =
    mood === 'oops'
      ? `<ellipse cx="50" cy="61" rx="3.5" ry="4" fill="${ink}"/>`
      : mood === 'happy'
        ? `<path d="M43 58q7 8 14 0z" fill="${ink}"/>`
        : `<path d="M45 59q5 4 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<svg class="daru ${mood === 'idle' ? 'bob' : ''}" viewBox="0 0 100 112" width="${s}" height="${Math.round(s * 1.12)}" aria-hidden="true">
  <ellipse cx="50" cy="106" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
  <path d="M50 5C23 5 9 29 9 60c0 28 17 44 41 44s41-16 41-44C91 29 77 5 50 5z" fill="#e3402a"/>
  <path d="M50 104c-24 0-41-16-41-44 0 0 6 30 41 33s41-33 41-33c0 28-17 44-41 44z" fill="#b8301d"/>
  <ellipse cx="30" cy="26" rx="7" ry="12" transform="rotate(30 30 26)" fill="#fff" opacity=".22"/>
  <ellipse cx="50" cy="50" rx="27" ry="22" fill="#fff7ef"/>
  <circle cx="31" cy="57" r="4.5" fill="#f7a8a0" opacity=".8"/><circle cx="69" cy="57" r="4.5" fill="#f7a8a0" opacity=".8"/>
  ${brows}${eyes}${mouth}
  <path d="M28 82q22 12 44 0" stroke="#f2b33d" stroke-width="4" fill="none" stroke-linecap="round"/>
  <text x="50" y="99" text-anchor="middle" font-size="13" font-weight="900" fill="#f2b33d" font-family="Zen Maru Gothic">福</text></svg>`;
}
const mascot = (mood, html, size) =>
  `<div class="mascot">${daru(mood, size || 76, allDone())}<div class="bubble">${html}</div></div>`;

export { daru, mascot };
