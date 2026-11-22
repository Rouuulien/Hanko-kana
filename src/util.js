/* Petits utilitaires : tirage au hasard, échappement HTML, conversion hiragana ↔ katakana. */
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const H2K=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x3041&&n<=0x3096?String.fromCharCode(n+0x60):c}).join('');
const K2H=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x30A1&&n<=0x30F6?String.fromCharCode(n-0x60):c}).join('');

export{shuffle,pick,esc,H2K,K2H};
