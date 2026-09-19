/* ─── disegno ─── */
function disegna(){
  const v=V;if(!v)return;
  /* L'arena è solo derivata da v.sport, non è stato: si può calcolare qui
     senza violare la regola "niente stato dentro le funzioni di disegno". */
  document.documentElement.dataset.arena=arenaGara(v.sport);
  if(v.fase==="lobby"){disegnaLobby();return;}
  if(v.fase==="scelta"){disegnaScelta(v);return;}
  if(v.fase==="fine"){disegnaFine(v);return;}
  disegnaAsta(v);
}
function fermaTick(){if(tickId){clearInterval(tickId);tickId=null;}}
function dipingiTimer(){
  const el=$("#timer");if(!el){fermaTick();return;}
  const r=Math.max(0,scadenza-Date.now());
  el.textContent=(r/1000).toFixed(1);
  const b=$("#timer-barra");if(b)b.style.width=(r/DURATA*100)+"%";
  if(r<=0)fermaTick();
}
function tabellone(v){
  const gio=v.giocatori.length?v.giocatori:v.sedie;
  return `<div class="punti">${gio.map((p,i)=>
    `<div class="pt" style="--col:${p.col}"><span>${esc(p.nome)}</span><b>${v.match.punti[p.id!==undefined?p.id:i]}</b></div>`).join("")}</div>`;
}
function disegnaScelta(v){
  vai("s-scelta");fermaTick();
  const s=v.sedie[v.match.sceglie];
  $("#scelta-round").textContent=t("round",v.match.round)+" · "+t("primoA",v.match.obiettivo);
  $("#scelta-punti").innerHTML=tabellone(v);
  const mio=mioId===null||mioId===v.match.sceglie;
  $("#scelta-titolo").innerHTML=mio?t("tocchiTeScegliere"):t("sceglieLui",`<b style="color:${s.col}">${esc(s.nome)}</b>`);
  const g=$("#scelta-griglia");
  if(!mio){g.innerHTML=`<div class="attesa" style="grid-column:1/-1"><p class="nota">${t("attendiScelta")}</p></div>`;return;}
  const opz=(v.match.opzioni||[]).map(id=>SPORT.find(x=>x.id===id)).filter(Boolean);
  g.innerHTML=opz.map(sp=>`<button class="scelta" data-gara="${sp.id}"><b>${sp.emoji} ${esc(nomeGara(sp))}</b><span>${esc(descGara(sp))} · ${sp.size} ${t("aTesta")}</span></button>`).join("");
  $$("[data-gara]",g).forEach(b=>b.onclick=()=>agisci({t:"scegliGara",id:b.dataset.gara}));
}
/* Le rose di tutti, sempre consultabili: si apre toccando le plance. */
/* Le doti che contano in questa gara, più il voto complessivo. */
function dotiAnimale(a,sp){
  const pesi=(sp&&sp.pesi)||GENERICO;
  const ordine=Object.keys(pesi).filter(k=>pesi[k]>0).sort((x,y)=>pesi[y]-pesi[x]).slice(0,3);
  return `<div class="doti">
    <span class="ovr">${fit(a,pesi).toFixed(1)}</span>
    ${ordine.map(k=>`<span class="dt">${lblStat(k)} <b>${a[k]}</b></span>`).join("")}
    ${pesi.mas<0?`<span class="dt neg">${lblStat("mas")} <b>${a.mas}</b></span>`:""}</div>`;
}
function disegnaRose(v){
  const box=$("#rose-vive");
  if(!mostraRose){                       // chiuso: resta solo l'invito a toccare
    box.className="tocca-rose"; box.style.display="block";
    box.textContent=t("vediRose"); return;
  }
  box.className="rose-vive"; box.style.display="flex";
  box.innerHTML=v.giocatori.map(p=>`
    <div class="rv" style="--col:${p.col}">
      <div class="rv-capo"><b>${esc(p.nome)}${p.id===mioId?" ("+t("tu")+")":""}</b>
        <span>${p.crediti} ${t("crediti")} · ${p.rosa.length}/${v.dim}</span></div>
      ${p.rosa.length
        ? `<div class="rv-bestie">${p.rosa.map(a=>
            `<span class="rv-b">${a.emoji} ${esc(nomeAn(a))} <i>${a.prezzo}</i>${v.valori?`<em>${fit(a,(v.sport&&v.sport.pesi)||GENERICO).toFixed(1)}</em>`:""}</span>`).join("")}</div>`
        : `<div class="rv-vuoto">${t("ancoraNiente")}</div>`}
    </div>`).join("");
}
function disegnaAsta(v){
  vai("s-asta");fermaTick();
  const L=v.lotto;
  $("#etichetta-gara").textContent=`${v.sport.emoji||"🏆"} ${nomeGara(v.sport)}`;
  $("#etichetta-round").textContent=t("round",v.match.round);
  const presi=v.giocatori.reduce((s,p)=>s+p.rosa.length,0),tot=v.giocatori.length*v.dim;
  $("#progresso-testo").textContent=t("assegnati",presi,tot);
  $("#progresso-barra").style.width=(presi/tot*100)+"%";
  const pl=$("#plance");
  pl.className="plance"+(v.giocatori.length>=5?" fitte":"");
  pl.onclick=()=>{ mostraRose=!mostraRose; disegnaRose(V); };
  pl.style.cursor="pointer";
  pl.innerHTML=v.giocatori.map(p=>`
    <div class="plancia ${(L&&L.fase!=="venduto"&&L.fase!=="scartato"&&(v.simultanea?L.migliore===p.id:L.turno===p.id))?"turno":""} ${p.id===mioId?"io":""} ${p.online===false?"giu":""}" style="--col:${p.col}">
      <div class="nm">${esc(p.nome)}</div><div class="cr">${p.crediti}</div>
      <div class="sl">${p.rosa.map(a=>`<b>${a.emoji}</b>`).join("")}${"○".repeat(v.dim-p.rosa.length)}</div>
      <div class="sk">${p.skip?"skip ✓":"skip ✗"}</div></div>`).join("");
  if(!L)return;
  const lotto=$("#lotto"),azioni=$("#azioni"),nome=nomeAn(L.animale);

  if(L.fase==="venduto"){
    const w=v.giocatori[L.migliore];
    lotto.innerHTML=`<div class="venduto"><div class="bestia">${L.animale.emoji}</div>
      <div class="timbro">${t("venduto")}</div><div class="nomebestia" style="font-size:21px">${esc(nome)}</div>
      <p class="nota">${t("aPer",`<b style="color:${w.col}">${esc(w.nome)}</b>`,`<b style="color:var(--oro)">${L.offerta}</b>`)} ${plur(L.offerta)}</p></div>`;
    azioni.innerHTML=`<button class="btn" id="avanti">${t("prossimo")}</button>`;
    $("#avanti").onclick=()=>agisci({t:"avanti"});return;
  }
  if(L.fase==="scartato"){
    const s=v.giocatori[L.saltatoDa!==undefined?L.saltatoDa:0];
    lotto.innerHTML=`<div class="venduto"><div class="bestia" style="filter:grayscale(1);opacity:.4">${L.animale.emoji}</div>
      <div class="titolo" style="color:var(--fumo)">${t("saltato")}</div>
      <div class="nomebestia" style="font-size:21px;color:var(--fumo)">${esc(nome)}</div>
      <p class="nota">${t("haUsatoSkip",`<b style="color:${s.col}">${esc(s.nome)}</b>`)}</p></div>`;
    azioni.innerHTML=`<button class="btn" id="avanti">${t("avanti")}</button>`;
    $("#avanti").onclick=()=>agisci({t:"avanti"});return;
  }
  lotto.innerHTML=`<div class="bestia">${L.animale.emoji}</div>
    <div class="nomebestia">${esc(nome)}</div>
    ${v.valori?dotiAnimale(L.animale,v.sport):""}
    <div class="offerta">${L.migliore===null?t("nessunaOfferta"):t("offertaDi",L.offerta,esc(v.giocatori[L.migliore].nome))}</div>`;

  if(L.fase==="apertura"){
    const p=v.giocatori[L.turno];
    const minimo=Math.min(1,L.tetti[L.turno]);
    if(mioId!==null&&L.turno!==mioId){
      azioni.innerHTML=`<div class="attesa"><p class="nota">${t("toccaA",`<b style="color:${p.col}">${esc(p.nome)}</b>`)}</p></div>`;return;}
    azioni.innerHTML=`<div class="turnobanner" style="--col:${p.col}">
        <div class="chi">${esc(p.nome)}</div><div class="che">${minimo?t("bannerApri"):t("bannerApriZero")}</div></div>
      <button class="btn" id="apri">${t("apriA",minimo)}</button>
      <button class="btn fantasma" id="skip" ${p.skip?"":"disabled"}>${p.skip?t("saltaAnimale"):t("skipUsato")}</button>`;
    $("#apri").onclick=()=>agisci({t:"apri"});
    if(p.skip)$("#skip").onclick=()=>agisci({t:"skip"});
    return;
  }
  const io=mioId===null?v.giocatori[L.turno]:v.giocatori[mioId];
  const max=L.tetti[io.id];
  const bloccato=io.rosa.length>=v.dim?t("rosaPiena")
    :L.fuori.includes(io.id)?t("haiPassato")
    :L.migliore===io.id?t("seiInTesta")
    :max<=L.offerta?t("nonPuoi"):null;
  const barra=v.simultanea?`<div class="conto"><span id="timer">${(L.msRimasti/1000).toFixed(1)}</span>
      <div class="conto-barra"><i id="timer-barra" style="width:${L.msRimasti/DURATA*100}%"></i></div></div>`:"";
  if(bloccato){
    azioni.innerHTML=barra+`<div class="attesa"><p class="nota">${esc(bloccato)}</p></div>`;
  }else{
    const opz=[L.offerta+1,L.offerta+2,L.offerta+3,max].filter((x,i,a)=>x<=max&&x>L.offerta&&a.indexOf(x)===i);
    azioni.innerHTML=barra+`<div class="turnobanner" style="--col:${io.col}">
        <div class="chi">${esc(io.nome)}</div>
        <div class="che">${t("puoiArrivare",max)}${v.dim-io.rosa.length>1?t("tiServono",v.dim-io.rosa.length-1):""}</div></div>
      <div class="gradini">${opz.map(x=>`<button class="gradino" data-v="${x}">${x}${x===max&&opz.length>1?`<small>${t("tutto")}</small>`:""}</button>`).join("")}</div>
      <div class="offerta-libera">
        <input type="number" id="off-altro" inputmode="numeric" min="${L.offerta+1}" max="${max}"
               placeholder="${t("quantoOffri",L.offerta+1,max)}">
        <button class="btn piccolo" id="off-vai">${t("offri")}</button></div>
      <button class="btn fantasma" id="passo">${t("passo")}</button>`;
    $$(".gradino",azioni).forEach(b=>b.onclick=()=>{bozzaOfferta="";agisci({t:"rilancia",v:+b.dataset.v});});
    const campo=$("#off-altro");
    campo.value=bozzaOfferta;                       // non si perde quello che stavi scrivendo
    campo.oninput=()=>bozzaOfferta=campo.value;
    const offri=()=>{
      const n=Math.floor(+campo.value);
      if(!(n>L.offerta&&n<=max)){ campo.value=""; bozzaOfferta="";
        campo.placeholder=t("offertaFuori",L.offerta+1,max); return; }
      bozzaOfferta="";
      agisci({t:"rilancia",v:n});
    };
    $("#off-vai").onclick=offri;
    campo.onkeydown=e=>{ if(e.key==="Enter"){e.preventDefault();offri();} };
    $("#passo").onclick=()=>{bozzaOfferta="";agisci({t:"passa"});};
  }
  if(v.simultanea&&L.msRimasti>0){scadenza=Date.now()+L.msRimasti;tickId=setInterval(dipingiTimer,80);dipingiTimer();}
}
function disegnaFine(v){
  vai("s-fine");fermaTick();
  const m=v.match,ultimo=m.storico[m.storico.length-1];
  const cls=classifica(v.sport,v.giocatori);
  $("#fine-titolo").innerHTML=m.chiuso?t("partitaFinita"):t("astaChiusa");
  $("#fine-sottotitolo").innerHTML=m.chiuso?"":t("roundVinto",m.round,`<b style="color:${v.giocatori[ultimo.vincitore].col}">${esc(v.giocatori[ultimo.vincitore].nome)}</b>`);
  $("#fine-punti").innerHTML=tabellone(v)+(m.chiuso?"":`<p class="mini" style="text-align:center;margin-top:8px">${t("primoA",m.obiettivo)}</p>`);

  const camp=$("#fine-campione");
  if(m.chiuso){
    const c=v.giocatori[m.campione];
    camp.style.display="block";
    camp.innerHTML=`<div class="coppa">🏆</div>
      <div class="titolone" style="font-size:clamp(24px,7vw,34px);color:${c.col};text-align:center">${esc(c.nome)}</div>
      <p class="nota" style="text-align:center;margin-top:4px">${t("vinceLaPartita",m.punti[c.id],m.storico.length)}</p>
      <div class="storico">${m.storico.map(r=>{
        const sp=r.gara.custom?r.gara:(SPORT.find(x=>x.id===r.gara.id)||r.gara);
        const w=v.giocatori[r.vincitore];
        return `<div class="riga-st"><span>${r.gara.emoji||"🏆"} ${esc(nomeGara(sp))}</span><b style="color:${w.col}">${esc(w.nome)}</b></div>`;}).join("")}</div>`;
  }else camp.style.display="none";

  $("#rose-finali").innerHTML=cls.map((r,i)=>{
    const p=r.p,pesi=(v.sport&&v.sport.pesi)||GENERICO;
    return `<div class="rosa-sq" style="--col:${p.col}">
      <div class="capo"><h3>${i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}${esc(p.nome)}</h3>
        <span class="voto" style="color:${p.col}">${r.tot}</span></div>
      <p class="mini" style="margin-top:3px">${t("puntiForti",r.forti.map(lblStat).join(", "))} ${t("scoperta",lblStat(r.debole))}<br>${t("votoMedio",r.media.toFixed(1))}${r.sin!==null&&r.sin!==undefined
  ?` · ${t("intesa")} <b style="color:var(--oro)">+${Math.round(r.bonus*100)}%</b>`
  :` · <span style="opacity:.6">${t("senzaIntesa")}</span>`}${v.cumulativo?` · <b style="color:var(--oro)">${t("inCassa",p.crediti)}</b>`:""}</p>
      <div class="membri">${p.rosa.map(a=>`<span class="membro">${a.emoji} ${esc(nomeAn(a))} <i>${a.prezzo}</i><em>${fit(a,pesi).toFixed(1)}</em></span>`).join("")}</div>
      <p class="mini" style="margin-top:8px">${r.affare?`⬆︎ ${t("affare")}: ${esc(nomeAn(r.affare.a))} (${r.affare.a.prezzo})`:""}${r.disastro&&r.disastro!==r.affare?` · ⬇︎ ${t("disastro")}: ${esc(nomeAn(r.disastro.a))} (${r.disastro.a.prezzo})`:""}</p>
      <div class="barrine">${Object.keys(pesi).filter(k=>pesi[k]>0).map(k=>{
        const val=p.rosa.reduce((s,a)=>s+(a[k]||0),0)/Math.max(1,p.rosa.length);
        return `<div class="brg"><span>${lblStat(k)}</span><i style="width:${val*10}%;background:${p.col}"></i></div>`;}).join("")}</div></div>`;}).join("");
  $("#spiega").textContent=t("spiega");

  const z=$("#zona-verdetto");
  if(v.verdetto)z.innerHTML=htmlVerdetto(v.verdetto);
  else if(v.verdetto===false)z.innerHTML=`<div class="pensa"><div class="pallini"><i></i><i></i><i></i></div><p class="mini">${t("aiSimula")}</p></div>`;
  else if(MODO!=="ospite"&&motore){z.innerHTML=`<button class="btn rosa" id="btn-verdetto">${t("chiediAI")}</button>`;
    $("#btn-verdetto").onclick=chiediVerdetto;}
  else z.innerHTML="";

  const az=$("#fine-azioni");
  if(m.chiuso){
    az.innerHTML=`<button class="btn" id="a-home">${t("tornaHome")}</button>`;
    $("#a-home").onclick=lasciaTutto;
  }else if(MODO==="ospite"){
    az.innerHTML=`<div class="attesa"><p class="nota">${t("attendiRound")}</p></div>`;
  }else{
    az.innerHTML=`<button class="btn" id="a-round">${t("prossimoRound")}</button>
      <button class="btn fantasma" id="a-home">${t("tornaHome")}</button>`;
    $("#a-round").onclick=()=>agisci({t:"prossimoRound"});
    $("#a-home").onclick=lasciaTutto;
  }
}
function lasciaTutto(){
  if(MODO==="ospite"){spegniPeer();MODO="locale";mioId=null;M=null;V=null;G=null;sport=null;vai("s-home");return;}
  tornaHome();
}
function htmlVerdetto(d){
  return `${d.mvp?`<div class="card"><b>⭐ ${t("mvp")} — ${esc(d.mvp.animale||"")}</b><p class="mini" style="margin-top:4px">${esc(d.mvp.perche||"")}</p></div>`:""}
    ${d.flop?`<div class="card"><b>💤 ${t("flop")} — ${esc(d.flop.animale||"")}</b><p class="mini" style="margin-top:4px">${esc(d.flop.perche||"")}</p></div>`:""}
    ${Array.isArray(d.cronaca)&&d.cronaca.length?`<div class="titolo">${t("cronaca")}</div>
      <div class="cronaca">${d.cronaca.map(c=>`<p>${esc(c)}</p>`).join("")}</div>`:""}`;
}
async function chiediVerdetto(){
  verdetto=false;pubblica();
  const cls=classifica(sport,G.giocatori);
  const squadre=cls.map((r,i)=>`${i+1}. ${r.p.nome} (${r.tot}/100): ${r.p.rosa.map(a=>`${a.it} ${a.prezzo}`).join(", ")}`).join("\n");
  try{
    const d=await motore.chiedi(
`Racconta come è andata questa gara immaginaria: "${nomeGara(sport)}", ${G.dim} animali per squadra.
Il risultato è già deciso, questa è la classifica finale (tra parentesi il prezzo pagato all'asta):
${squadre}

Scrivi ${lang?"in inglese":"in italiano"}, divertente ma concreto. Rispetta la classifica: non ribaltarla.
Rispondi SOLO con questo JSON:
{"mvp":{"animale":"nome","perche":"una frase"},
 "flop":{"animale":"nome","perche":"una frase"},
 "cronaca":["momento 1","momento 2","momento 3"]}`);
    if(!d||(!d.mvp&&!d.cronaca))throw{code:"invalid_json"};
    verdetto=d;pubblica();
  }catch(e){
    verdetto=null;pubblica();
    $("#zona-verdetto").innerHTML=`<div class="errore">${esc(copiaErrore(e))}</div><button class="btn fantasma" id="btn-verdetto">${t("chiediAI")}</button>`;
    $("#btn-verdetto").onclick=chiediVerdetto;
  }
}

