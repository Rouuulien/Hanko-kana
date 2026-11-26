/* ---------- Koï vue du dessus, qui nage dans le bassin (src/ui/pond.js) ----------
   La Koï de profil, mascotte qui parlait dans des bulles, a été retirée le 26/11/2026 : seule reste la carpe du bassin. */

const TOP_BODY = 'M60 10 C79 10 87 40 86 70 C85 104 75 134 60 158 C45 134 35 104 34 70 C33 40 41 10 60 10 Z';

/** Koï vue du dessus, tête en haut, pour le bassin (src/ui/pond.js). Couleurs : variables --pond-* de styles.css. */
function koiTop() {
  return `<svg class="koi-top" viewBox="0 0 120 200" width="104" height="173" aria-hidden="true">
<defs><clipPath id="koi-top-clip"><path d="${TOP_BODY}"/></clipPath></defs>
<g class="kt-tail"><path class="kt-fin" d="M60 148 C50 164 37 178 32 197 C45 191 54 184 60 175 C66 184 75 191 88 197 C83 178 70 164 60 148 Z"/></g>
<g class="kt-pec kt-l"><path class="kt-fin" d="M39 60 C21 57 9 74 13 94 C24 85 33 79 42 76 Z"/></g>
<g class="kt-pec kt-r"><path class="kt-fin" d="M81 60 C99 57 111 74 107 94 C96 85 87 79 78 76 Z"/></g>
<path class="kt-fin" d="M44 110 C34 112 29 123 31 133 C37 126 42 122 47 120 Z M76 110 C86 112 91 123 89 133 C83 126 78 122 73 120 Z"/>
<path class="kt-body" d="${TOP_BODY}"/>
<g clip-path="url(#koi-top-clip)">
<ellipse class="kt-patch" cx="60" cy="32" rx="14" ry="12"/>
<path class="kt-patch" d="M42 70 C54 60 74 64 80 80 C74 96 56 99 44 88 C40 82 39 76 42 70 Z"/>
<ellipse class="kt-patch" cx="56" cy="124" rx="8" ry="12" transform="rotate(-15 56 124)"/>
</g>
</svg>`;
}

export { koiTop };
