const FISSI={"x-tagline":"tagline","x-partitameta":"partitaMeta","btn-riprendi":"riprendi","btn-scarta":"buttaVia",
 "x-tuonome":"tuoNome","btn-crea":"creaStanza","btn-entra":"entraCodice","btn-locale":"unTelefono",
 "x-entratitolo":"entraTitolo","x-indietro":"indietro","x-chiedicodice":"chiediCodice","btn-collega":"collegati",
 "x-stanza":"stanza","esci-lobby":"esci","x-codicealtri":"codiceAgliAltri","x-numerogiocatori":"numeroGiocatori",
 "x-creditiatesta":"creditiATesta","x-puntipervincere":"puntiPerVincere","x-sceltagara":"sceltaGara","x-valori":"mostraValori",
 "x-altragara":"laGara","btn-ai-gara":"inventaAI",
 "x-impostazioni":"impostazioni","x-lingua":"lingua","x-commentoai":"commentoAI",
 "x-notachiave":"notaChiave","salva-chiave":"salva","togli-chiave":"rimuovi","azzera":"azzera","aggiorna":"aggiornaGioco"};
const $$$=id=>document.getElementById(id);
function applicaLingua(){
  document.documentElement.lang=lang?"en":"it";
  for(const id in FISSI){const e=$$$(id);if(e)e.textContent=t(FISSI[id]);}
  $$$("mio-nome").placeholder=t("comeTiChiamano");
  document.querySelectorAll(".bandiere button").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.lg===lang));
  if(!reteOk())$$$("nota-rete").textContent=t("offline");
  $$$("riga-versione").textContent=t("versione")+" "+BUILD;
  aggiornaMotore();
  const att=document.querySelector(".schermo.attivo");
  if(att&&att.id==="s-lobby"){disegnaSetupHost();disegnaLobby();}
  if(V&&att&&(att.id==="s-asta"||att.id==="s-fine"||att.id==="s-scelta"))disegna();
}
document.querySelectorAll(".bandiere").forEach(z=>z.addEventListener("click",e=>{
  const b=e.target.closest("[data-lg]");if(!b)return;
  lang=+b.dataset.lg;MEM.scrivi("lang",lang);/* Il gioco si tiene aggiornato da solo: chiede al server qual è la versione
   buona e, se non coincide, butta cache e service worker e ricarica.
   Non ci si può fidare del service worker: è lui che può restare indietro. */
async function buttaTutto(){
  try{ if("caches" in window){ const k=await caches.keys(); await Promise.all(k.map(x=>caches.delete(x))); } }catch{}
  try{ if(navigator.serviceWorker){ const r=await navigator.serviceWorker.getRegistrations();
        await Promise.all(r.map(x=>x.unregister())); } }catch{}
}
(function controllaVersione(){
  if(!location.protocol.startsWith("http")) return;
  const seg="zoo.ricaricato";
  fetch("versione.txt?"+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.text():null).then(async v=>{
    if(!v) return;
    v=v.trim();
    if(v===BUILD){ try{sessionStorage.removeItem(seg);}catch{} return; }
    let gia=null; try{ gia=sessionStorage.getItem(seg); }catch{}
    if(gia===v) return;
    try{ sessionStorage.setItem(seg,v); }catch{}
    await buttaTutto();
    location.replace(location.pathname+"?v="+encodeURIComponent(v));
  }).catch(()=>{});
})();

applicaLingua();}));

$$$("conta-giocatori").addEventListener("click",e=>{
  const b=e.target.closest("[data-ng]");if(!b)return;
  const n=+b.dataset.ng;
  if(MODO==="host"&&n<sedie.length)return;
  nGiocatori=n;
  if(MODO==="locale")sedie=Array.from({length:n},(_,i)=>({id:i,nome:(sedie[i]&&sedie[i].nome)||"",col:COLORI[i],online:true}));
  disegnaSetupHost();disegnaLobby();
  if(MODO==="host")trasmetti({t:"vista",v:vista()});});
function cambiaCrediti(v){
  const [lo,hi]=LIMITI[modoCrediti];
  v=Math.max(lo,Math.min(hi,Math.round(v)||lo));
  if(modoCrediti==="tot")creditiTot=v;else crediti=v;
  disegnaSetupHost();
  if(MODO==="host")trasmetti({t:"vista",v:vista()});
}
$$$("modo-crediti").addEventListener("click",e=>{
  const b=e.target.closest("[data-mc]");if(!b)return;
  modoCrediti=b.dataset.mc;$$$("crediti-altro").value="";
  disegnaSetupHost();
  if(MODO==="host")trasmetti({t:"vista",v:vista()});});
$$$("conta-crediti").addEventListener("click",e=>{
  const b=e.target.closest("[data-c]");if(!b)return;
  $$$("crediti-altro").value="";
  cambiaCrediti(+b.dataset.c);});
$$$("usa-crediti-altro").onclick=()=>{
  const v=+$$$("crediti-altro").value;
  if(v)cambiaCrediti(v);};
$$$("crediti-altro").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();$$$("usa-crediti-altro").onclick();}});
$$$("conta-punti").addEventListener("click",e=>{
  const b=e.target.closest("[data-pt]");if(!b)return;
  obiettivo=+b.dataset.pt;disegnaSetupHost();});
$$$("modo-valori").addEventListener("click",e=>{
  const b=e.target.closest("[data-mv]");if(!b)return;
  mostraValori=b.dataset.mv==="true";disegnaSetupHost();
  if(MODO==="host")trasmetti({t:"vista",v:vista()});});
$$$("modo-scelta").addEventListener("click",e=>{
  const b=e.target.closest("[data-ms]");if(!b)return;
  modoScelta=b.dataset.ms;disegnaSetupHost();});
$$$("sedie").addEventListener("input",e=>{const i=e.target.dataset.sed;if(i!==undefined)sedie[+i].nome=e.target.value;});
$$$("btn-inizia").onclick=()=>iniziaPartita();
$$$("esci-lobby").onclick=lasciaTutto;
document.querySelectorAll("[data-indietro]").forEach(b=>b.onclick=()=>{spegniPeer();vai(b.dataset.indietro);});
$$$("mio-nome").value=MEM.leggi("nome","");
$$$("mio-nome").oninput=()=>MEM.scrivi("nome",$$$("mio-nome").value);
$$$("btn-crea").onclick=()=>{if(reteOk())creaStanza();};
$$$("btn-entra").onclick=()=>{if(reteOk()){$$$("esito-entra").innerHTML="";vai("s-entra");}};
$$$("codice-in").oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);};
$$$("btn-collega").onclick=()=>{const c=$$$("codice-in").value.trim();if(c.length===4)entraStanza(c);};
$$$("btn-locale").onclick=()=>{
  spegniPeer();MODO="locale";mioId=null;codice="";M=null;G=null;sport=null;V=null;
  sedie=Array.from({length:nGiocatori},(_,i)=>({id:i,nome:"",col:COLORI[i],online:true}));
  $$$("card-codice").style.display="none";
  $$$("pannello-host").style.display="flex";
  $$$("attesa-ospite").style.display="none";
  disegnaSetupHost();disegnaLobby();vai("s-lobby");};
let prec="s-home";
$$$("apri-info").onclick=()=>{prec=document.querySelector(".schermo.attivo").id;menuInfo();vai("s-info");};
$$$("chiudi-info").onclick=()=>{
  if($$$("info-menu").style.display==="none") menuInfo();   // prima si torna al menu
  else vai(prec);                                           // poi si esce
};
$$$("apri-impostazioni").onclick=()=>{prec=document.querySelector(".schermo.attivo").id;aggiornaMotore();vai("s-impostazioni");};
$$$("chiudi-impostazioni").onclick=()=>vai(prec);
$$$("salva-chiave").onclick=()=>{const k=$$$("chiave").value.trim();if(!k||k.startsWith("•"))return;
  MEM.scrivi("chiave",k);motore=motoreAPI(k);aggiornaMotore();$$$("esito-chiave").innerHTML=`<p class="mini">${t("salvata")}</p>`;};
$$$("togli-chiave").onclick=()=>{MEM.togli("chiave");motore=null;$$$("chiave").value="";$$$("esito-chiave").innerHTML="";aggiornaMotore();};
$$$("azzera").onclick=()=>{["partita","chiave","nome","lang"].forEach(MEM.togli);location.reload();};
$$$("aggiorna").onclick=async()=>{
  $$$("aggiorna").textContent=t("sto_aggiornando");
  await buttaTutto();
  try{ sessionStorage.clear(); }catch{}
  location.replace(location.pathname+"?v="+Date.now());
};

$$$("btn-ai-gara").onclick=async()=>{
  const btn=$$$("btn-ai-gara"),out=$$$("esito-ai-gara");
  const max=Math.floor(40/Math.max(2,sedie.length));
  btn.disabled=true;btn.textContent=t("inventando");
  out.innerHTML=`<div class="pensa" style="padding:14px 0"><div class="pallini"><i></i><i></i><i></i></div><p class="mini">${t("qualcheSecondo")}</p></div>`;
  try{
    const d=await motore.chiedi(
`Inventa una gara o competizione a squadre, buffa ma plausibile, a cui potrebbero partecipare degli animali. Diversa dai soliti sport famosi.
Gli animali hanno queste statistiche da 0 a 10: alt (altezza/allungo), frz (forza), vel (velocità), agi (agilità), man (presa/mani), res (resistenza), ter (muoversi su terra), acq (acqua), vol (volo), mas (stazza).
Definisci quali statistiche contano e quali requisiti minimi servono per partecipare.
Il numero di animali per squadra deve essere tra 1 e ${max}.
Rispondi SOLO con un oggetto JSON, nome e descrizione ${lang?"in inglese":"in italiano"}:
{"nome":"Gara di ...","emoji":"🏆","size":3,"pesi":{"agi":3,"man":2,"vel":2},"req":{"ter":5}}
In "pesi" da 3 a 5 statistiche con peso da 1 a 4 (negativo penalizza). In "req" da 0 a 2 requisiti con soglia da 3 a 7.`);
    const size=Math.max(1,Math.min(max,parseInt(d.size)||3));
    const pesi={},req={};
    for(const k in (d.pesi||{}))if(K.includes(k))pesi[k]=Math.max(-3,Math.min(4,+d.pesi[k]||0));
    for(const k in (d.req||{}))if(K.includes(k))req[k]=Math.max(0,Math.min(8,+d.req[k]||0));
    if(!Object.keys(pesi).length)throw{code:"invalid_json"};
    out.innerHTML="";
    avviaGara({custom:true,nome:String(d.nome||t("garaMisteriosa")).slice(0,50),size,
      emoji:String(d.emoji||"🏆").slice(0,4),pesi,req});
  }catch(e){
    out.innerHTML=`<div class="errore">${esc(copiaErrore(e))}</div>`;
    if(e&&(e.code==="not_granted"||e.code==="chiave")){motore=null;aggiornaMotore();}
  }finally{btn.disabled=false;btn.textContent=t("inventaAI");}
};

applicaLingua();
disegnaSetupHost();
const salvata=MEM.leggi("partita",null);
if(salvata&&salvata.G&&salvata.M&&!salvata.M.chiuso){
  const box=$$$("box-riprendi");box.style.display="flex";
  const presi=salvata.G.giocatori.reduce((s,p)=>s+p.rosa.length,0);
  $$$("riprendi-desc").textContent=t("giaAssegnati",(salvata.sport.emoji||"🏆")+" "+nomeGara(salvata.sport),presi);
  $$$("btn-riprendi").onclick=()=>{
    MODO="locale";mioId=null;sport=salvata.sport;crediti=salvata.crediti;
    sedie=salvata.sedie;nGiocatori=sedie.length;G=salvata.G;M=salvata.M;
    pool=costruisciPool(sport,sedie.length);pubblica();};
  $$$("btn-scarta").onclick=()=>{MEM.togli("partita");box.style.display="none";};
}
if(!reteOk()){$$$("btn-crea").disabled=true;$$$("btn-entra").disabled=true;}
avviaMotore();
if("serviceWorker" in navigator) addEventListener("load",()=>{
  navigator.serviceWorker.register("sw.js").then(r=>{
    r.update();
    r.addEventListener("updatefound",()=>{
      const n=r.installing;
      n&&n.addEventListener("statechange",()=>{
        if(n.state==="installed"&&navigator.serviceWorker.controller) location.reload();
      });
    });
  }).catch(()=>{});
});