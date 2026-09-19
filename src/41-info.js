/* ─── sezione Info ─── */
const VOCI=[["gare","infoGare","infoGareD"],["animali","infoAnimali","infoAnimaliD"],
            ["regole","comeSiGioca","infoRegoleD"],["stanza","stanza","infoStanzaD"],
            ["ai","commentoAI","infoAiD"]];
let filtroAn="", garaAn="", apertoAn="";

/* ─── scheda estesa di un animale ───
   Gli stessi numeri che il gioco usa per assegnare i punti, mostrati
   prima di comprare invece che dopo aver perso. Niente dati nuovi: tutto
   si ricava da ANIMALI, SPORT e fit(). */

/* la media di ogni dote, calcolata una volta sola: nel radar è il termine
   di paragone, un valore da solo non dice se è alto o basso */
let MEDIA_AN=null;
const mediaAn=()=>MEDIA_AN||(MEDIA_AN=K.map(k=>ANIMALI.reduce((s,a)=>s+(a[k]||0),0)/ANIMALI.length));

/* i pool costano un giro su tutti gli animali: si calcolano una volta per gara */
const POOL_AN={};
const poolAn=sp=>POOL_AN[sp.id]||(POOL_AN[sp.id]=costruisciPool(sp,2).map(a=>a.id));

function radarAn(a){
  const N=K.length,CX=130,CY=116,R=76,med=mediaAn();
  const pt=(i,v)=>{const g=-Math.PI/2+i*2*Math.PI/N,r=v/10*R;return [CX+r*Math.cos(g),CY+r*Math.sin(g)];};
  const poli=v=>v.map((x,i)=>pt(i,x).map(n=>n.toFixed(1)).join(",")).join(" ");
  let o=`<svg class="sa-radar" viewBox="0 0 260 236" role="img" aria-label="${esc(nomeAn(a))}">`;
  for(const anello of [2,4,6,8,10])
    o+=`<polygon points="${poli(K.map(()=>anello))}" fill="none" stroke="var(--bordo)" stroke-width="${anello===10?1:.6}"/>`;
  for(let i=0;i<N;i++){const [x,y]=pt(i,10);
    o+=`<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--bordo)" stroke-width=".6" opacity=".5"/>`;}
  o+=`<polygon points="${poli(med)}" fill="none" stroke="var(--fumo)" stroke-width="1.6" stroke-dasharray="4 3" opacity=".8"/>`;
  o+=`<polygon points="${poli(K.map(k=>a[k]||0))}" fill="var(--oro)" fill-opacity=".2" stroke="var(--oro)" stroke-width="1.8" stroke-linejoin="round"/>`;
  for(let i=0;i<N;i++){const [x,y]=pt(i,10),dx=x-CX,dy=y-CY;
    const lx=CX+dx*1.22,ly=CY+dy*1.22+3.5;
    const anc=Math.abs(dx)<6?"middle":(dx>0?"start":"end");
    o+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anc}" fill="var(--fumo)" font-size="8.5" font-weight="600">${K[i].toUpperCase()}</text>`;}
  return o+"</svg>";
}

function schedaAn(a){
  const voti=SPORT.map(sp=>({sp,f:fit(a,sp.pesi),dentro:poolAn(sp).includes(a.id)}))
                  .sort((x,y)=>y.f-x.f);
  const dentro=voti.filter(v=>v.dentro), fuori=voti.filter(v=>!v.dentro);
  const manca=sp=>Object.keys(sp.req||{}).filter(k=>(a[k]||0)<sp.req[k])
                    .map(k=>lblStat(k)+" "+(a[k]||0)+"/"+sp.req[k]).join(", ");
  const riga=(v,no)=>`<div class="sa-g${no?" no":""}">
      <span>${v.sp.emoji}</span><u>${esc(nomeGara(v.sp))}</u>
      <s><i style="width:${(v.f*10).toFixed(0)}%"></i></s><em>${v.f.toFixed(1)}</em>
      ${no&&manca(v.sp)?`<span class="sa-perche">${t("fuoriPer",esc(manca(v.sp)))}</span>`:""}</div>`;

  /* l'intesa, spiegata per questo animale: da che parte sta */
  const conIntesa=dentro.filter(v=>v.sp.sinergia).slice(0,3).map(v=>{
    const sn=v.sp.sinergia,val=a[sn.stat]||0;
    const come=sn.tipo==="ruoli"
      ? (val>=sn.soglia?t("ruoloAlto"):t("ruoloBasso"))+" "+sn.soglia
      : t("ruoloSimile",lblStat(sn.stat));
    return `<p class="mini">${v.sp.emoji} <b>${esc(nomeGara(v.sp))}</b> — ${lblStat(sn.stat)} ${val}: ${come}.</p>`;
  }).join("");

  return `<div class="sa-piu">
    ${radarAn(a)}
    <div class="sa-leg"><span><i></i>${esc(nomeAn(a))}</span><span><i class="med"></i>${t("mediaTutti")}</span></div>
    ${dentro.length?`<div><div class="sa-tit">${t("rendeDiPiu")}</div>${dentro.slice(0,6).map(v=>riga(v,false)).join("")}</div>`:""}
    ${fuori.length?`<div><div class="sa-tit">${t("nonEntraIn")}</div>${fuori.slice(0,4).map(v=>riga(v,true)).join("")}</div>`:""}
    <div><div class="sa-tit">${t("intesa")}</div>${conIntesa||`<p class="mini">${t("nessunaIntesa")}</p>`}</div>
  </div>`;
}

function menuInfo(){
  $("#info-menu").style.display="flex";
  $("#info-corpo").style.display="none";
  $("#info-ai").style.display="none";
  $("#info-menu").innerHTML=VOCI.map(([k,tit,des])=>
    `<button class="scelta" data-info="${k}"><b>${t(tit)}</b><span>${t(des)}</span></button>`).join("");
  $$("[data-info]").forEach(b=>b.onclick=()=>apriInfo(b.dataset.info));
}
function apriInfo(k){
  $("#info-menu").style.display="none";
  const c=$("#info-corpo"), ai=$("#info-ai");
  if(k==="ai"){ c.style.display="none"; ai.style.display="flex"; aggiornaMotore(); return; }
  ai.style.display="none"; c.style.display="flex";
  if(k==="gare")    c.innerHTML=schedeGare();
  if(k==="regole")  c.innerHTML=`<div class="card"><p class="mini" style="line-height:1.6">${t("regole")}</p></div>`;
  if(k==="stanza")  c.innerHTML=`<div class="card"><p class="mini" style="line-height:1.6">${t("notaStanza")}</p></div>`;
  if(k==="animali"){ c.innerHTML=telaioAnimali(); agganciaAnimali(); }
}

/* una scheda per gara: cosa conta, chi ci può stare, come si sta insieme */
function schedeGare(){
  return `<p class="mini">${t("infoGareLead")}</p>`+SPORT.map(sp=>{
    const pesi=Object.entries(sp.pesi).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
    const req=Object.entries(sp.req||{});
    const sn=sp.sinergia;
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div class="capo"><h3 style="font-family:var(--disp);font-size:17px">${sp.emoji} ${esc(nomeGara(sp))}</h3>
        <span class="mini">${sp.size} ${t("aTesta")}</span></div>
      <p class="mini">${esc(descGara(sp))}</p>
      <div class="chips">${pesi.map(([k,v])=>
        `<span class="chip ${v<0?"neg":""}">${lblStat(k)} <b>${v>0?"+"+v:v}</b></span>`).join("")}</div>
      ${req.length?`<p class="mini">${t("ammessiSolo",req.map(([k,v])=>lblStat(k)+" ≥ "+v).join(", "))}</p>`:""}
      <p class="mini"><b style="color:${sn?"var(--oro)":"var(--fumo)"}">${t("intesa")}:</b> ${
        !sn ? t("intesaNessuna")
        : sn.tipo==="ruoli"
          ? t("intesaRuoli",Math.round(sp.size*sn.quota),sp.size,lblStat(sn.stat),sn.soglia,Math.round(sn.max*100))
          : t("intesaSimili",lblStat(sn.stat),Math.round(sn.max*100))}</p>
    </div>`;}).join("");
}

/* schedario animali, con ricerca e voto per la gara scelta */
function telaioAnimali(){
  return `<div class="card" style="display:flex;flex-direction:column;gap:9px">
      <input type="text" id="an-cerca" placeholder="${t("cercaAnimale")}" value="${esc(filtroAn)}">
      <select id="an-gara"><option value="">${t("nessunaGara")}</option>
        ${SPORT.map(sp=>`<option value="${sp.id}" ${garaAn===sp.id?"selected":""}>${sp.emoji} ${esc(nomeGara(sp))}</option>`).join("")}</select>
      <p class="mini">${t("schedarioNota")}</p></div>
    <div id="an-elenco" style="display:flex;flex-direction:column;gap:9px"></div>`;
}
function agganciaAnimali(){
  const cerca=$("#an-cerca"), sel=$("#an-gara");
  cerca.oninput=()=>{filtroAn=cerca.value;elencoAnimali();};
  sel.onchange=()=>{garaAn=sel.value;elencoAnimali();};
  elencoAnimali();
}
function elencoAnimali(){
  const sp=SPORT.find(x=>x.id===garaAn)||null;
  const q=filtroAn.trim().toLowerCase();
  let lista=ANIMALI.filter(a=>!q||a.it.toLowerCase().includes(q)||a.en.toLowerCase().includes(q));
  if(sp){
    const dentro=costruisciPool(sp,2).map(a=>a.id);
    lista=lista.map(a=>({a,v:dentro.includes(a.id)?fit(a,sp.pesi):null}))
               .sort((x,y)=>(y.v===null?-1:y.v)-(x.v===null?-1:x.v));
  }else lista=lista.map(a=>({a,v:null}));
  $("#an-elenco").innerHTML=lista.map(({a,v})=>`
    <div class="scheda-an">
      <div class="sa-capo" role="button" tabindex="0" data-an="${a.id}"
           aria-expanded="${apertoAn===a.id}" title="${t("apriScheda")}"><span class="sa-em">${a.emoji}</span>
        <div class="sa-nomi"><b>${esc(nomeAn(a))}</b><span>${esc(lang?a.it:a.en)}</span></div>
        ${v!==null?`<span class="sa-ovr">${v.toFixed(1)}</span>`
                 :(sp?`<span class="sa-no">${t("nonAmmesso")}</span>`:"")}</div>
      <div class="sa-barre">${K.map(k=>`
        <div class="sa-b ${sp&&sp.pesi[k]?"conta":""}"><span>${lblStat(k)}</span>
          <i style="width:${a[k]*10}%"></i><em>${a[k]}</em></div>`).join("")}</div>
      ${apertoAn===a.id?schedaAn(a):""}
    </div>`).join("")||`<p class="mini">${t("nessunAnimale")}</p>`;
  /* una scheda per volta: novantaquattro radar insieme sarebbero
     novantaquattro SVG da disegnare a ogni ricerca */
  $$("[data-an]").forEach(b=>{
    const apri=()=>{apertoAn=apertoAn===b.dataset.an?"":b.dataset.an;elencoAnimali();
      if(apertoAn)$(`[data-an="${apertoAn}"]`).scrollIntoView({block:"nearest"});};
    b.onclick=apri;
    b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();apri();}};
  });
}
