/* ─── motore d'asta ─── */
const pieno=p=>p.rosa.length>=G.dim;
const liberi=p=>G.dim-p.rosa.length;
/* Un credito va tenuto da parte per ogni slot ancora vuoto, così la rosa
   si completa sempre. A crediti cumulativi però si può finire in bolletta:
   in quel caso il tetto è 0 e si può solo raccogliere ciò che nessuno vuole. */
const riserva=p=>Math.min(p.crediti,Math.max(0,liberi(p)-1));
const tetto=p=>pieno(p)?0:Math.max(0,p.crediti-riserva(p));
const finita=()=>G.giocatori.every(pieno);
function fermaTimer(){if(timerId){clearTimeout(timerId);timerId=null;}}
function avviaTimer(){
  fermaTimer();G.lotto.scadeA=Date.now()+DURATA;
  timerId=setTimeout(()=>{timerId=null;if(G&&G.lotto&&G.lotto.fase==="gara")vendi();},DURATA);
}
function ammessi(){
  const L=G.lotto;
  return G.giocatori.filter(p=>!pieno(p)&&!L.fuori.includes(p.id)&&p.id!==L.migliore&&tetto(p)>L.offerta);
}
function prossimoLotto(){
  fermaTimer();
  if(finita()){G.lotto=null;chiudiRound();return;}
  if(!G.coda.length){
    if(!G.riserva.length)G.riserva=mischiaRari(pool).slice();
    G.coda.push(G.riserva.length?G.riserva.shift():mischiaRari(ANIMALI)[0]);G.introdotti++;
  }
  let a=G.apre,g=0;
  while(pieno(G.giocatori[a])&&g<G.giocatori.length){a=(a+1)%G.giocatori.length;g++;}
  G.apre=a;
  G.lotto={animale:G.coda.shift(),fase:"apertura",offerta:0,migliore:null,turno:a,fuori:[],scadeA:0};
  pubblica();
}
function prossimoAttivo(da,escludi){
  const e=new Set(escludi);
  for(let k=1;k<=G.giocatori.length;k++){const i=(da+k)%G.giocatori.length;
    if(!pieno(G.giocatori[i])&&!e.has(i))return i;}
  return null;
}
function apriA1(){
  const L=G.lotto;
  L.offerta=Math.min(1,tetto(G.giocatori[L.turno]));   // 0 se è a secco
  L.migliore=L.turno;
  G.giocatori.forEach(q=>{if(!pieno(q)&&q.id!==L.turno&&tetto(q)<=L.offerta)L.fuori.push(q.id);});
  if(G.sim){L.fase="gara";if(!ammessi().length)return vendi();avviaTimer();pubblica();return;}
  L.fase="rilanci";
  const n=prossimoAttivo(L.turno,[...L.fuori,L.turno]);
  if(n===null)return vendi();
  L.turno=n;pubblica();
}
function usaSkip(){
  const L=G.lotto,p=G.giocatori[L.turno];
  if(!p.skip)return;
  p.skip--;
  for(let k=0;k<3;k++){if(!G.riserva.length||G.introdotti>=40)break;G.coda.push(G.riserva.shift());G.introdotti++;}
  L.fase="scartato";L.saltatoDa=L.turno;
  G.apre=(L.turno+1)%G.giocatori.length;
  pubblica();
}
function rilancia(v,chi){
  const L=G.lotto,p=G.giocatori[chi];
  v=Math.floor(v);
  if(pieno(p)||L.fuori.includes(chi)||chi===L.migliore)return;
  if(!(v>L.offerta&&v<=tetto(p)))return;
  L.offerta=v;L.migliore=chi;L.turno=chi;
  G.giocatori.forEach(q=>{if(!pieno(q)&&q.id!==chi&&tetto(q)<=v&&!L.fuori.includes(q.id))L.fuori.push(q.id);});
  if(G.sim){if(!ammessi().length)return vendi();avviaTimer();pubblica();return;}
  const n=prossimoAttivo(chi,[...L.fuori,chi]);
  if(n===null)return vendi();
  L.turno=n;pubblica();
}
function passa(chi){
  const L=G.lotto;
  if(!L.fuori.includes(chi))L.fuori.push(chi);
  if(G.sim){if(!ammessi().length)return vendi();pubblica();return;}
  const n=prossimoAttivo(chi,[...L.fuori,L.migliore]);
  if(n===null)return vendi();
  L.turno=n;pubblica();
}
function vendi(){
  fermaTimer();
  const L=G.lotto,p=G.giocatori[L.migliore];
  p.crediti-=L.offerta;p.rosa.push(Object.assign({},L.animale,{prezzo:L.offerta}));
  L.fase="venduto";L.scadeA=0;
  G.apre=(L.migliore+1)%G.giocatori.length;
  pubblica();
}
function eseguiAzione(a,chi){
  if(!a||!M)return;
  if(M.attesaScelta){
    if(a.t!=="scegliGara")return;
    if(chi!==null&&chi!==M.sceglie)return;
    if(!(M.opzioni||[]).includes(a.id))return;
    const sp=SPORT.find(s=>s.id===a.id);
    if(sp)avviaGara(sp);
    return;
  }
  if(M.chiuso)return;
  if(!G||!G.lotto){
    if(a.t==="prossimoRound"&&(chi===null||chi===0))nuovoRound();
    return;
  }
  const L=G.lotto;
  if(L.fase==="venduto"||L.fase==="scartato"){if(a.t==="avanti")prossimoLotto();return;}
  if(L.fase==="apertura"){
    if(chi!==null&&chi!==L.turno)return;
    if(a.t==="apri")apriA1();else if(a.t==="skip")usaSkip();
    return;
  }
  if(G.sim){
    const id=chi===null?L.turno:chi;
    if(a.t==="rilancia")rilancia(a.v,id);else if(a.t==="passa")passa(id);
    return;
  }
  if(chi!==null&&chi!==L.turno)return;
  if(a.t==="rilancia")rilancia(a.v,L.turno);else if(a.t==="passa")passa(L.turno);
}
function agisci(a){
  if(MODO==="ospite")return invia(connOspite,{t:"azione",a});
  eseguiAzione(a,MODO==="locale"?null:mioId);
}
function salvaPartita(){
  if(MODO!=="locale"||!G||!M)return;
  if(M.chiuso)return MEM.togli("partita");
  MEM.scrivi("partita",{sport,crediti,sedie,G,M});
}
