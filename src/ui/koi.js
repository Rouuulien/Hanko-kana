/* ---------- Koï, la mascotte (carpe koï) ----------
   Version d'attente, en attendant le dessin de l'illustrateur : tracés repris de koi/koi-demo.html.
   Les écrans n'utilisent que koi(état, taille) et mascot(état, html, taille) : remplacer le dessin ne touche qu'ici.
   États et animations : `data-state`, règles `.koi` de styles.css. */

const KOI_STATES = ['resting', 'swimming', 'greeting', 'happy', 'encouraging', 'sleeping', 'celebrating'];
let n = 0; // identifiants uniques des clipPath : plusieurs koï peuvent coexister dans la page

const BODY =
  'M250 585 C300 520 420 480 540 470 C680 458 790 400 805 295 C810 262 815 240 818 222 L872 222 C900 330 885 450 795 560 C705 665 520 705 380 683 C300 670 240 640 250 585 Z';

/** @param {string} state un des KOI_STATES @param {number} size largeur en px (hauteur = 3/4) */
function koi(state, size) {
  if (!KOI_STATES.includes(state)) throw new Error(`état de Koï inconnu : ${state}`);
  const id = `koi-clip-${++n}`;
  return `<svg class="koi" data-state="${state}" viewBox="0 0 1200 900" width="${size}" height="${Math.round(size * 0.75)}" aria-hidden="true">
<defs><clipPath id="${id}"><path d="${BODY}"/></clipPath></defs>
<g class="root">
<g class="tail">
<path class="f-fin" d="M815 232 C760 200 722 135 730 55 C785 108 836 118 858 158 C876 100 930 50 998 22 C1006 102 966 178 875 232 Z"/>
<path class="line" d="M818 228 C760 196 722 135 730 55 C785 108 836 118 858 158 C876 100 930 50 998 22 C1006 102 966 178 872 228"/>
<path class="thin" d="M834 216 C786 190 756 142 752 96 M842 208 C806 176 782 140 778 104 M850 200 C826 168 810 140 806 118"/>
<path class="thin" d="M868 196 C896 150 940 98 984 52 M874 206 C914 168 956 112 986 70 M862 188 C880 152 904 118 930 88"/>
</g>
<g class="dorsal">
<path class="f-fin" d="M430 495 C438 430 500 392 575 404 C562 430 568 452 615 468 Z"/>
<path class="line" d="M430 495 C438 430 500 392 575 404 C562 430 568 452 615 468"/>
<path class="thin" d="M470 462 C482 432 515 415 548 410"/>
</g>
<g class="farpec">
<path class="f-fin" d="M868 395 C925 470 990 458 1012 412 C962 414 920 405 885 365 Z"/>
<path class="line" d="M868 395 C925 470 990 458 1012 412 C962 414 920 405 885 365"/>
<path class="thin" d="M915 425 C945 435 975 432 993 420"/>
</g>
<g class="pec">
<path class="f-fin" d="M540 665 C515 740 590 795 685 772 C730 760 748 724 716 698 C676 716 626 700 610 660 Z"/>
<path class="line" d="M540 665 C515 740 590 795 685 772 C730 760 748 724 716 698 C676 716 626 700 610 660"/>
<path class="thin" d="M600 705 C625 735 660 748 695 744"/>
</g>
<g class="body">
<path class="f-body" d="${BODY}"/>
<g clip-path="url(#${id})">
<path class="f-patch" d="M440 522 C450 490 500 482 535 497 C560 508 575 482 600 492 C625 507 610 542 570 550 C540 557 520 577 490 572 C455 567 436 546 440 522 Z"/>
<path class="f-patch" d="M650 542 C660 507 700 492 740 497 C780 502 800 482 822 470 C842 502 832 547 792 567 C752 587 702 592 667 577 C652 567 646 554 650 542 Z"/>
<path class="f-patch" d="M835 282 C860 264 886 292 883 332 C879 362 850 367 838 342 Z"/>
<path class="f-patch" d="M300 560 C305 535 340 525 366 536 C376 556 346 576 318 576 Z"/>
</g>
<path class="line" d="M872 222 C900 330 885 450 795 560 C705 665 520 705 380 683 C300 670 240 640 250 585 C300 520 420 480 540 470 C680 458 790 400 805 295 C810 262 815 240 818 222"/>
</g>
<g class="face">
<path class="line barbel" d="M250 585 C225 580 212 560 218 540"/>
<path class="line barbel" d="M262 628 C240 642 240 670 262 692"/>
<path class="line gill" d="M432 560 C458 590 458 630 436 662"/>
<path class="brush eye-open" d="M318 614 C338 582 374 582 396 608 C374 598 340 598 318 614 Z"/>
<path class="line eye-happy" d="M326 612 C342 594 366 594 380 612"/>
<path class="line eye-sleep" d="M326 604 C342 620 366 620 380 604"/>
</g>
</g>
<g class="zz" font-family="system-ui, sans-serif" font-size="46"><text x="300" y="500">z</text><text x="300" y="500">z</text><text x="300" y="500">z</text></g>
<g class="sparkles"><circle cx="250" cy="420" r="9"/><circle cx="960" cy="300" r="9"/><circle cx="1010" cy="560" r="8"/><circle cx="380" cy="300" r="8"/></g>
<ellipse class="ripple" cx="560" cy="740" rx="260" ry="40"/>
</svg>`;
}

/** Koï et sa bulle. L'enveloppant `.koi-w` porte les déplacements (arrivée en nageant). */
const mascot = (state, html, size) =>
  `<div class="mascot"><span class="koi-w">${koi(state, size || 76)}</span><div class="bubble">${html}</div></div>`;

export { KOI_STATES, koi, mascot };
