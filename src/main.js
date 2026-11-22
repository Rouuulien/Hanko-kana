/* ---------- Hanko · point d'entrée : charge la progression, branche la synchro, affiche ---------- */
import'./ui/events.js'; // écouteurs de clics, formulaires et clavier
import{loadLocal}from'./core/state.js';
import{loadKS}from'./draw/strokes.js';
import{bindUI,cloudInit}from'./sync/cloud.js';
import{ui}from'./ui/app-state.js';
import{render}from'./ui/render.js';
loadLocal();
bindUI({render,view:()=>ui.view,go:v=>{ui.view=v},resetTip:()=>{ui.homeTip=null}});
render();cloudInit();loadKS().then(()=>{if(ui.view==='home'||ui.view==='cards')render()}).catch(()=>{});
