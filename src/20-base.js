function vai(id){document.querySelectorAll(".schermo").forEach(s=>s.classList.toggle("attivo",s.id===id));window.scrollTo(0,0);}
"use strict";
const COLORI=["var(--p1)","var(--p2)","var(--p3)","var(--p4)","var(--p5)"];
const BUILD="2026-09-19c";
const PREFISSO="zoolympics-";     // NON cambiarlo mai: chi ha la versione
                                  // vecchia non riuscirebbe più a entrare.
/* Senza un TURN, due dispositivi su reti diverse (uno in WiFi, uno in 4G)
   spesso non aprono il canale e si arriva al timeout. */
const ICE={iceServers:[
  {urls:"stun:stun.l.google.com:19302"},
  {urls:"stun:stun1.l.google.com:19302"},
  {urls:"turn:openrelay.metered.ca:80",username:"openrelayproject",credential:"openrelayproject"},
  {urls:"turn:openrelay.metered.ca:443",username:"openrelayproject",credential:"openrelayproject"},
  {urls:"turn:openrelay.metered.ca:443?transport=tcp",username:"openrelayproject",credential:"openrelayproject"}
]};
const ALFA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DURATA=7000;
const GENERICO={vel:2,agi:2,frz:2,res:2,man:2,alt:1};

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const mischia=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[b[i],b[j]]=[b[j],b[i]];}return b;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MEM={leggi(k,d){try{const v=localStorage.getItem("asta."+k);return v?JSON.parse(v):d;}catch{return d;}},
  scrivi(k,v){try{localStorage.setItem("asta."+k,JSON.stringify(v));}catch{}},
  togli(k){try{localStorage.removeItem("asta."+k);}catch{}}};

/* ─── lingua ─── */
let lang=MEM.leggi("lang",(navigator.language||"it").toLowerCase().startsWith("it")?0:1);
const t=(k,...a)=>{let s=(S[k]||["?","?"])[lang];a.forEach(v=>s=s.replace(/%[sd]/,v));return s;};
const nomeGara=sp=>!sp?"":sp.custom?sp.nome:(GARE[sp.id]||[])[lang*2]||sp.id;
const descGara=sp=>sp.custom?t("garaPersonalizzata"):(GARE[sp.id]||[])[lang*2+1]||"";
const nomeAn=a=>a[lang?"en":"it"]||a.nome||a.id;
const lblStat=k=>(STAT[k]||[k,k])[lang];
const plur=n=>n===1?t("credito"):t("crediti");
const gareDisponibili=n=>SPORT.filter(s=>s.size<=Math.floor(40/n));
