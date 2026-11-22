/* ---------- état : l'objet de progression S et sa sauvegarde locale ----------
   Règles (voir CLAUDE.md) : clé hanko-kana-v1 immuable ; évolutions de S uniquement additives (nouveau champ = valeur par défaut dans fresh()).
   S est un objet unique, jamais réaffecté : pour le remplacer entièrement, passer par replaceState(). */
const KEY='hanko-kana-v1';
const fresh=()=>({learned:{},done:{},tests:{},xp:0,streak:0,last:'',today:'',todayXp:0,unlock:false,ear:true,tab:'h',page:'path',rsc:'h',rct:'kana',rdu:60,rfmt:'deck',best:{},snd:true,draw:true,bsc:'h',bn:10,bl:2});
const S=fresh();
/** Remplace tout le contenu de S en gardant le même objet (les modules qui l'importent voient le changement). */
function replaceState(v){for(const k of Object.keys(S))delete S[k];Object.assign(S,v)}
/** Charge la sauvegarde locale si elle est lisible ; sinon S reste à l'état neuf. */
function loadLocal(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v.learned==='object')replaceState(Object.assign(fresh(),v))}catch(e){}}
const saveLocal=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};

export{KEY,fresh,S,replaceState,loadLocal,saveLocal};
