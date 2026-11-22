/* ---------- voix japonaise de l'appareil (synthèse vocale), si elle existe ---------- */
import{S}from'../core/state.js';
import{ui}from'./app-state.js';
import{render}from'./render.js';
let tts=false,jv=null;
function loadV(){try{jv=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang))||null;tts=!!jv}catch(e){tts=false}}
if('speechSynthesis'in window){loadV();try{speechSynthesis.onvoiceschanged=()=>{const was=tts;loadV();if(was!==tts&&ui.view==='home')render()}}catch(e){}}
function say(t){if(!tts)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.voice=jv;u.rate=.8;speechSynthesis.speak(u)}catch(e){}}
const earOK=()=>tts&&S.ear!==false;

export{tts,say,earOK};
