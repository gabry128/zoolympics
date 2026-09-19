/* ─── punteggi ─── */
function fit(a,pesi){
  let lo=0,hi=0,raw=0;
  for(const k in pesi){const w=pesi[k];raw+=w*(a[k]||0);if(w<0)lo+=w*10;else hi+=w*10;}
  return hi===lo?5:Math.max(0,Math.min(10,10*(raw-lo)/(hi-lo)));
}
function costruisciPool(sp,n){
  const bisogno=n*sp.size, comodo=Math.min(60,bisogno+8), req=sp.req||{};
  const idonei=ANIMALI.filter(a=>Object.keys(req).every(k=>(a[k]||0)>=req[k]));
  for(let s=35;s>=0;s-=5){
    const ok=idonei.filter(a=>fit(a,sp.pesi)>=s/10);
    if(ok.length>=comodo) return ok;
  }
  if(idonei.length>=bisogno) return idonei;
  let r=Object.assign({},req),ok=idonei;
  for(let g=0;g<6&&ok.length<bisogno;g++){
    for(const k in r)r[k]=Math.max(0,r[k]-2);
    ok=ANIMALI.filter(a=>Object.keys(r).every(k=>(a[k]||0)>=r[k]));
  }
  return ok.length>=bisogno?ok:ANIMALI.slice();
}
/* Quanto la squadra sta bene insieme. "simili" premia chi si assomiglia
   nella dote indicata (i tuffi sincronizzati vogliono corpi uguali, la
   staffetta va come il più lento); "vari" premia chi si completa
   (a basket serve chi arriva in alto E chi è svelto). */
/* Quanto la squadra sta bene insieme, da 0 a 1. Due modi soltanto:
   "simili"  → gli animali devono somigliarsi in una dote
               (nei tuffi corpi uguali entrano in acqua insieme);
   "ruoli"   → serve una certa proporzione fra grandi e piccoli
               (a basket tre lunghi e due piccoli, non cinque torri).
   Molte gare non hanno intesa: nella staffetta basta passare il testimone,
   al tiro alla fune si sommano le forze e basta. */
function intesa(rosa,sn){
  if(!sn||!rosa||rosa.length<2)return null;
  const v=rosa.map(a=>a[sn.stat]||0);
  if(sn.tipo==="ruoli"){
    const frazione=v.filter(x=>x>=sn.soglia).length/v.length;
    const errore=Math.abs(frazione-sn.quota);
    const peggio=Math.max(sn.quota,1-sn.quota);
    return Math.max(0,1-errore/peggio);
  }
  const m=v.reduce((a,b)=>a+b,0)/v.length;
  const sd=Math.sqrt(v.reduce((s,x)=>s+(x-m)*(x-m),0)/v.length);
  return Math.max(0,1-Math.min(1,sd/3.5));
}

/* ─── modificatori ───────────────────────────────────────────────────────
   Slot per gli effetti che agiscono DOPO il punteggio base: meteo,
   stanchezza, bonus a chi sta perdendo. Oggi la lista è vuota e il gioco
   si comporta esattamente come prima: applicaModificatori esce subito.

   Un modificatore è un oggetto:

     { id:      "meteo",                       // stringa breve, per il log
       attivo:  ctx => ctx.match.meteo==="pioggia",   // facoltativo
       calcola: ctx => ({mult:0.9, etichetta:"Pioggia −10%"}) }

   calcola restituisce mult (moltiplica) e/o add (somma punti secchi).
   Neutro = {mult:1, add:0}. I mult di tutti i modificatori si moltiplicano
   fra loro e gli add si sommano, quindi l'ordine nella lista non cambia il
   risultato. Si applicano al punteggio NON ancora arrotondato, così si
   arrotonda una volta sola alla fine.

   Il ctx che arriva a attivo/calcola contiene:
     rosa, pesi, sinergia, media, sin, bonus, grezzo   (dal punteggio base)
     giocatore, giocatori, sport                       (aggiunti da classifica)
   più qualsiasi cosa passi il chiamante come ultimo argomento.

   Due regole da rispettare, altrimenti si rompe la partita in rete:

   1. DETERMINISMO. classifica() gira sia sull'host (chiudiRound) sia su
      ogni client (disegnaFine), separatamente. Un modificatore deve essere
      una funzione pura di dati presenti in V, altrimenti host e ospiti
      vedono punteggi diversi. Il meteo va quindi sorteggiato una volta
      dall'host, salvato in M e esposto in vista() — mai tirato a caso qui.
   2. NIENTE GIRI VIZIOSI. Un modificatore non può leggere la classifica di
      questo round: la classifica dipende da lui. Il bonus a chi sta
      perdendo deve guardare M.punti, cioè i round già chiusi.

   Un modificatore che esplode viene saltato: meglio un effetto mancante
   che una partita bloccata a fine round. */
const MODIFICATORI=[];

function applicaModificatori(grezzo,ctx){
  if(!MODIFICATORI.length) return {grezzo:grezzo, mods:[]};
  let mult=1, add=0; const mods=[];
  for(const m of MODIFICATORI){
    if(!m||typeof m.calcola!=="function") continue;
    let r;
    try{
      if(typeof m.attivo==="function" && !m.attivo(ctx)) continue;
      r=m.calcola(ctx);
    }catch(e){ continue; }
    if(!r) continue;
    const dm=(typeof r.mult==="number"&&isFinite(r.mult))?r.mult:1;
    const da=(typeof r.add==="number"&&isFinite(r.add))?r.add:0;
    if(dm===1&&da===0) continue;
    mult*=dm; add+=da;
    mods.push({id:m.id||"?",etichetta:r.etichetta||m.id||"",mult:dm,add:da});
  }
  return {grezzo:grezzo*mult+add, mods:mods};
}

/* Punteggio di squadra = media dei voti, più una percentuale di bonus
   per l'intesa. Niente altro: due numeri che si leggono a occhio.
   Poi, se ci sono modificatori, si applicano sopra: tot è il punteggio
   finale, totBase quello prima dei modificatori, mods l'elenco di cosa
   è stato applicato (dati semplici, si possono mettere in V). */
function punteggio(rosa,pesi,sn,ctx){
  if(!rosa||!rosa.length)return{tot:0,stat:{},totBase:0,mods:[]};
  const media=rosa.reduce((s,a)=>s+fit(a,pesi),0)/rosa.length;
  let w=0,cop=0;const stat={};
  for(const k in pesi){if(pesi[k]<=0)continue;
    w+=pesi[k];cop+=pesi[k]*Math.max(...rosa.map(a=>a[k]||0));
    stat[k]=rosa.reduce((s,a)=>s+(a[k]||0),0)/rosa.length;}
  const sin=intesa(rosa,sn);
  const bonus=sin===null?0:sin*sn.max;
  const grezzo=media*10*(1+bonus);
  const mod=applicaModificatori(grezzo,
    Object.assign({rosa:rosa,pesi:pesi,sinergia:sn,media:media,sin:sin,bonus:bonus,grezzo:grezzo},ctx||{}));
  return {tot:Math.max(0,Math.min(100,Math.round(mod.grezzo))),
          totBase:Math.min(100,Math.round(grezzo)),
          mods:mod.mods,
          stat, media, sin, bonus};
}
function classifica(sp,giocatori,ctx){
  const pesi=(sp&&sp.pesi)||GENERICO;
  const extra=ctx||{};
  return giocatori.map(p=>{
    const q=punteggio(p.rosa,pesi,sp&&sp.sinergia,
      Object.assign({},extra,{giocatore:p,giocatori:giocatori,sport:sp}));
    const ch=Object.keys(q.stat).sort((a,b)=>q.stat[b]-q.stat[a]);
    const val=p.rosa.map(a=>({a,f:fit(a,pesi),r:fit(a,pesi)/Math.max(1,a.prezzo)}));
    return {p,tot:q.tot,totBase:q.totBase,mods:q.mods,media:q.media,sin:q.sin,bonus:q.bonus,forti:ch.slice(0,2),debole:ch[ch.length-1],
      affare:val.slice().sort((x,y)=>y.r-x.r)[0],
      disastro:val.filter(x=>x.a.prezzo>=2).sort((x,y)=>x.r-y.r)[0]};
  }).sort((a,b)=>b.tot-a.tot||b.p.crediti-a.p.crediti||a.p.id-b.p.id);
}
