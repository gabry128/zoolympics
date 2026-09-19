/* ─── sezione Info ─── */
const VOCI=[["gare","infoGare","infoGareD"],["animali","infoAnimali","infoAnimaliD"],
            ["regole","comeSiGioca","infoRegoleD"],["stanza","stanza","infoStanzaD"],
            ["ai","commentoAI","infoAiD"]];
let filtroAn="", garaAn="";

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
      <div class="sa-capo"><span class="sa-em">${a.emoji}</span>
        <div class="sa-nomi"><b>${esc(nomeAn(a))}</b><span>${esc(lang?a.it:a.en)}</span></div>
        ${v!==null?`<span class="sa-ovr">${v.toFixed(1)}</span>`
                 :(sp?`<span class="sa-no">${t("nonAmmesso")}</span>`:"")}</div>
      <div class="sa-barre">${K.map(k=>`
        <div class="sa-b ${sp&&sp.pesi[k]?"conta":""}"><span>${lblStat(k)}</span>
          <i style="width:${a[k]*10}%"></i><em>${a[k]}</em></div>`).join("")}</div>
    </div>`).join("")||`<p class="mini">${t("nessunAnimale")}</p>`;
}
