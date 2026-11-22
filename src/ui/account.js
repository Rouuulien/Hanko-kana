/* ---------- écran Compte (Supabase) : connexion, mot de passe, suppression ---------- */
import { cloud } from '../sync/cloud.js';
import { ui } from './app-state.js';
import { esc } from '../util.js';
/** Libellé du bouton de suppression du compte (deux clics : armer, puis confirmer). */
const deleteLabel = () => (ui.armedDel ? 'Confirmer : tout supprimer' : 'Supprimer mon compte');
function accountV() {
  if (cloud.mode !== 'sb') return '';
  const msg = cloud.msg ? `<p class="amsg" role="status">${esc(cloud.msg)}</p>` : '';
  if (cloud.st === 'off')
    return `<h2>Compte</h2><p class="mut" style="margin:0">Connexion impossible hors ligne. Reviens quand tu as du réseau pour créer ton compte ou te connecter.</p>`;
  if (cloud.uid) {
    const pwForm = `<form id="setpw" class="lg"><input id="npw" class="rin" type="password" autocomplete="new-password" minlength="8" placeholder="Nouveau mot de passe (8 caractères min.)" aria-label="Nouveau mot de passe"><button class="btn ac">Enregistrer le mot de passe</button></form>`;
    return `<h2>Compte</h2><p style="margin:0">Connecté avec <b>${esc(cloud.email)}</b>.</p>
    ${cloud.recovery ? `<p style="margin:0"><b>Choisis ton nouveau mot de passe :</b></p>${pwForm}` : cloud.pwOpen ? pwForm : `<button class="link" style="justify-self:start" data-act="pwopen">Définir ou changer mon mot de passe</button>`}${msg}
    <div class="acts" style="justify-content:flex-start;margin:0"><button class="btn gh" data-act="logout">Se déconnecter</button><button class="btn danger" data-act="delacc">${deleteLabel()}</button></div>
    <p class="mut" style="margin:0">La suppression efface définitivement ton compte et ta progression en ligne.</p>`;
  }
  const tab = cloud.tab || 'pw';
  const body =
    tab === 'pw'
      ? `<input id="lmail" class="rin" type="email" autocomplete="email" placeholder="ton@email.fr" required aria-label="Adresse e-mail" value="${esc(cloud.email)}">
      <input id="lpw" class="rin" type="password" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe">
      <div class="acts" style="justify-content:flex-start;margin:0"><button class="btn ac" data-sub="login">Se connecter</button><button class="btn gh" data-sub="signup">Créer un compte</button></div>
      <button class="link" style="justify-self:start" data-sub="forgot">Mot de passe oublié ?</button>`
      : cloud.step === 'code'
        ? `<p style="margin:0">E-mail envoyé à <b>${esc(cloud.email)}</b>.</p><input id="lcode" class="rin" inputmode="numeric" autocomplete="one-time-code" placeholder="Code reçu par e-mail" maxlength="10" aria-label="Code reçu par e-mail"><button class="btn ac">Valider le code</button><button type="button" class="link" data-act="lreset">Changer d’adresse e-mail</button>`
        : `<input id="lmail" class="rin" type="email" autocomplete="email" placeholder="ton@email.fr" required aria-label="Adresse e-mail" value="${esc(cloud.email)}"><button class="btn ac">Recevoir un lien de connexion</button>`;
  return `<h2>Compte</h2><p class="mut" style="margin:0">Crée un compte gratuit pour sauvegarder ta progression en ligne et la retrouver sur tous tes appareils.</p>
    <div class="chips" role="tablist"><button data-act="atab" data-id="pw" aria-pressed="${tab === 'pw'}">E-mail et mot de passe</button><button data-act="atab" data-id="code" aria-pressed="${tab === 'code'}">Lien par e-mail</button></div>
    <form id="login" class="lg">${body}${msg}</form>
    <p class="mut" style="margin:0;font-size:14px">En créant un compte, tu acceptes la <a href="confidentialite.html">politique de confidentialité</a>.</p>`;
}

export { accountV, deleteLabel };
