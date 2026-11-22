/* ---------- synchronisation de la progression ----------
   Local d'abord : chaque save() écrit dans localStorage, puis envoie en ligne 1,2 s plus tard (cloudSoon).
   À la connexion et au retour sur l'onglet, cloudPull() fusionne la version en ligne avec la locale (merge) sans rien perdre.
   Deux services : compte Claude (window.claude, version claude.ai) ou Supabase (connexion e-mail).
   Le module ne connaît pas l'interface : elle lui est branchée par bindUI() (afficher, écran courant, changer d'écran). */
import{S,fresh,replaceState,saveLocal}from'../core/state.js';
import{merge}from'../core/merge.js';
const ui={render(){},view:()=>'home',go(){},resetTip(){}};
/** Branche l'interface : { render, view: () => écran courant, go: écran => void, resetTip }. */
function bindUI(o){Object.assign(ui,o)}
const save=()=>{S.at=Date.now();saveLocal();cloudSoon()};
/* ---------- sauvegarde en ligne : compte Claude (version claude.ai) ou Supabase (GitHub Pages) ---------- */
const cloud={mode:null,st:'local',api:null,ready:false,busy:false,dirty:false,t:0,last:0,sb:null,uid:null,email:'',step:'',msg:''};
const SB_URL='https://hxnptpndukqivjewwxnj.supabase.co',SB_KEY='sb_publishable_jRnM6-6jhF_T0BZHPMjnhg_rGkdS-u0';
function cloudSoon(){if(!cloud.ready||!cloud.api)return;clearTimeout(cloud.t);cloud.t=setTimeout(cloudPush,1200)}
async function cloudPush(){if(!cloud.api)return;if(cloud.busy){cloud.dirty=true;return}cloud.busy=true;cloud.st='sync';paintCloud();
  try{await cloud.api.put(S);cloud.st='ok';cloud.last=Date.now()}catch(e){cloud.st=e&&e.code==='revoked'?'local':'err'}
  cloud.busy=false;if(cloud.dirty){cloud.dirty=false;cloudPush()}else paintCloud()}
async function cloudPull(){const api=cloud.api;if(!api)return;let rem;try{rem=await api.get()}catch(e){cloud.st='err';paintCloud();return}
  if(api!==cloud.api)return;
  if(rem&&typeof rem.learned==='object'){const m=merge(S,rem),same=JSON.stringify(m)===JSON.stringify(rem);replaceState(m);saveLocal();ui.resetTip();
    if(['home','set','res','rushres'].includes(ui.view()))ui.render();cloud.ready=true;if(!same)return cloudPush()}
  else if(Object.keys(S.learned).length||S.xp){cloud.ready=true;return cloudPush()}
  cloud.ready=true;cloud.st='ok';cloud.last=Date.now();paintCloud()}
async function cloudInit(){
  if(window.claude&&typeof window.claude.use==='function'){cloud.mode='claude';
    const to=setTimeout(()=>{if(!cloud.ready&&cloud.api){cloud.st='err';paintCloud()}},10000);
    try{const[db,user]=await Promise.all([claude.use('db'),claude.use('user')]);if(!db||!user)return clearTimeout(to);
      const id=await user.id();if(!id)return clearTimeout(to);const ref=db.doc('data/users/'+id+'/progress');
      cloud.api={get:async()=>{const s=await ref.get();if(!s.exists)return null;try{return JSON.parse(s.data().data)}catch(e){return null}},put:st=>ref.set({v:1,at:st.at||Date.now(),data:JSON.stringify(st)})};
      cloud.st='sync';paintCloud();await cloudPull()}catch(e){cloud.st='local'}clearTimeout(to);paintCloud();return}
  cloud.mode='sb';cloud.st='anon';
  try{const h=new URLSearchParams(location.hash.slice(1));if(h.get('error')||h.get('error_code')){const c=h.get('error_code')||'';
    cloud.msg=/otp_expired|invalid/i.test(c+h.get('error_description'))?'Ce lien a expiré ou a déjà été utilisé. Chaque nouvel e-mail annule le précédent : redemande un e-mail une seule fois et ouvre uniquement le plus récent.':'La connexion par lien a échoué. Réessaie, ou utilise l’e-mail et le mot de passe.';
    history.replaceState(null,'',location.pathname+location.search);ui.go('set')}}catch(e){}
  if(ui.view()==='home'||ui.view()==='set')ui.render();
  if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
  try{if(!window.supabase)await new Promise((ok,ko)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';sc.onload=ok;sc.onerror=ko;document.head.appendChild(sc)});
    cloud.sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
    cloud.sb.auth.onAuthStateChange((ev,ses)=>{if(ev==='PASSWORD_RECOVERY'){cloud.recovery=true;cloud.msg='';ui.go('set')}setTimeout(()=>{sbSession(ses);if(ev==='PASSWORD_RECOVERY')ui.render()},0)});
    const r=await cloud.sb.auth.getSession();sbSession(r.data&&r.data.session)}
  catch(e){cloud.st='off';paintCloud();if(ui.view()==='set')ui.render()}}
function sbSession(ses){const uid=ses&&ses.user?ses.user.id:null;if(uid===cloud.uid&&cloud.api!==undefined&&(uid?cloud.api:true))return;
  cloud.uid=uid;cloud.ready=false;
  if(!uid){cloud.api=null;cloud.st='anon';paintCloud();if(ui.view()==='set'||ui.view()==='home')ui.render();return}
  cloud.email=ses.user.email||cloud.email;cloud.step='';cloud.msg='';const sb=cloud.sb;
  cloud.api={get:async()=>{const{data,error}=await sb.from('progress').select('data').eq('user_id',uid).maybeSingle();if(error)throw error;return data?data.data:null},
    put:async st=>{const{error}=await sb.from('progress').upsert({user_id:uid,data:st,updated_at:new Date().toISOString()});if(error)throw error}};
  cloud.st='sync';paintCloud();if(ui.view()==='set'||ui.view()==='home')ui.render();cloudPull()}
const authErr=e=>{const m=(e&&e.message)||'';
  if(/invalid login credentials/i.test(m))return'E-mail ou mot de passe incorrect. Si ton compte a été créé avec un code ou un lien, définis d’abord un mot de passe (« Mot de passe oublié ? » ou depuis un appareil déjà connecté).';
  if(/already registered|already exists/i.test(m))return'Un compte existe déjà avec cette adresse : connecte-toi.';
  if(/email not confirmed/i.test(m))return'Adresse pas encore confirmée : ouvre le lien reçu par e-mail, puis reconnecte-toi ici.';
  if(/password.*(short|least|characters)|weak/i.test(m))return'Mot de passe trop faible : au moins 8 caractères, avec lettres et chiffres.';
  if(/rate|seconds|too many/i.test(m))return'Trop de tentatives : patiente une minute avant de réessayer.';
  return'Opération impossible pour le moment. Vérifie ta connexion et réessaie.'};
const redir=()=>location.origin+location.pathname;
async function sbLogin(form,act){const sb=cloud.sb;if(!sb)return;for(const b of form.querySelectorAll('button'))b.disabled=true;cloud.msg='';
  try{
    if(cloud.tab!=='code'){const email=(form.querySelector('#lmail').value||'').trim(),pw=(form.querySelector('#lpw')||{}).value||'';if(!email)throw{message:''};cloud.email=email;
      if(act==='forgot'){const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:redir()});if(error)throw error;cloud.msg='Si un compte existe, tu vas recevoir un e-mail. Ouvre le lien, puis choisis ton nouveau mot de passe.'}
      else if(act==='signup'){if(pw.length<8)throw{message:'password short'};const{data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:redir()}});if(error)throw error;
        if(data&&data.user&&data.user.identities&&!data.user.identities.length)throw{message:'already registered'};
        if(!data.session)cloud.msg='Compte créé ! Ouvre le lien de confirmation reçu par e-mail (sur n’importe quel appareil), puis reviens ici et connecte-toi.'}
      else{const{error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error}}
    else if(cloud.step!=='code'){const email=form.querySelector('#lmail').value.trim();if(!email)throw{message:''};cloud.email=email;
      const{error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:redir()}});if(error)throw error;
      cloud.step='code';cloud.msg='Regarde ta boîte mail (et les indésirables). Saisis le code s’il y en a un, ou ouvre le lien reçu dans ce même navigateur.'}
    else{const token=form.querySelector('#lcode').value.replace(/\s/g,'');if(!token)throw{message:''};const{error}=await sb.auth.verifyOtp({email:cloud.email,token,type:'email'});if(error)cloud.msg='Code invalide ou expiré. Redemande un code si besoin.'}
  }catch(e){cloud.msg=e&&e.message?authErr(e):'Renseigne ton adresse e-mail.'}
  ui.render()}
async function sbSetPw(form){const sb=cloud.sb,pw=form.querySelector('#npw').value;for(const b of form.querySelectorAll('button'))b.disabled=true;
  if(pw.length<8){cloud.msg='Mot de passe trop faible : au moins 8 caractères.';return ui.render()}
  const{error}=await sb.auth.updateUser({password:pw});cloud.msg=error?authErr(error):'Mot de passe enregistré. Tu peux maintenant te connecter avec ton e-mail et ce mot de passe sur tous tes appareils.';cloud.recovery=false;cloud.pwOpen=false;ui.render()}
async function sbDelete(){const sb=cloud.sb;if(!sb)return;const{error}=await sb.rpc('delete_user');
  if(error){cloud.msg='Suppression impossible pour le moment. Réessaie plus tard.';return ui.render()}
  await sb.auth.signOut();replaceState(fresh());saveLocal();ui.resetTip();cloud.msg='Ton compte et ta progression en ligne ont été supprimés.';ui.render()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloud.api&&!cloud.busy)cloudPull()});
const syncAt=()=>cloud.last?' · synchro à '+new Date(cloud.last).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
const cloudText=()=>({ok:cloud.mode==='sb'?`Sauvegardée sur ton compte (${cloud.email})${syncAt()}.`:`Sauvegardée automatiquement sur ton compte Claude${syncAt()}.`,
  sync:'Synchronisation en cours…',
  err:'Serveur injoignable pour l’instant : ta progression est gardée sur cet appareil et sera synchronisée dès que possible.',
  anon:'Progression enregistrée sur cet appareil uniquement. Crée un compte gratuit dans Réglages pour la sauvegarder en ligne.',
  off:'Hors ligne : progression gardée sur cet appareil.',
  local:'Enregistrée seulement dans ce navigateur.'})[cloud.st];
function paintCloud(){for(const e of document.querySelectorAll('[data-cloud]'))e.textContent=cloudText()}

export{bindUI,cloud,save,cloudSoon,cloudPush,cloudPull,cloudInit,sbLogin,sbSetPw,sbDelete,cloudText,paintCloud,SB_URL};
