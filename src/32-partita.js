/* ─── partita a punti ─── */
function iniziaPartita(){
  const cum=modoCrediti==="tot";
  M={punti:sedie.map(()=>0),round:0,obiettivo,modoScelta,sceglie:0,storico:[],
     attesaScelta:false,chiuso:false,campione:null,giocate:[],opzioni:null,
     cumulativo:cum, dote:cum?creditiTot:crediti, valori:mostraValori,
     borsa:sedie.map(()=>cum?creditiTot:crediti)};
  nuovoRound();
}
function nuovoRound(){
  M.round++;verdetto=null;G=null;
  // a crediti per round si riparte da capo; a crediti cumulativi si continua
  if(!M.cumulativo) M.borsa=sedie.map(()=>M.dote);
  const n=sedie.length;
  const tutte=gareDisponibili(n);
  const disp=tutte.filter(s=>!M.giocate.includes(s.id));
  const scelta=disp.length?disp:tutte;
  if(M.modoScelta==="casuale"){avviaGara(scelta[(Math.random()*scelta.length)|0]);return;}
  M.attesaScelta=true;
  M.sceglie=(M.round-1)%n;
  M.opzioni=scelta.map(s=>s.id);
  pubblica();
}
function avviaGara(sp){
  M.attesaScelta=false;M.opzioni=null;
  sport=sp;if(!sp.custom&&!M.giocate.includes(sp.id))M.giocate.push(sp.id);
  pool=costruisciPool(sp,sedie.length);
  G={dim:sp.size,sim:MODO!=="locale",
    giocatori:sedie.map((s,i)=>({id:i,nome:(s.nome||"").trim()||((lang?"Player ":"Giocatore ")+(i+1)),col:COLORI[i],crediti:M.borsa[i],rosa:[],skip:1,online:true})),
    coda:[],riserva:[],introdotti:0,apre:(M.round-1)%sedie.length,lotto:null};
  const tot=Math.min(40,G.giocatori.length*G.dim),m=mischiaRari(pool);
  G.coda=m.slice(0,tot);G.riserva=m.slice(tot);G.introdotti=tot;
  prossimoLotto();
}
function chiudiRound(){
  const cls=classifica(sport,G.giocatori);
  G.giocatori.forEach(p=>M.borsa[p.id]=p.crediti);   // quel che avanza resta in cassa
  M.punti[cls[0].p.id]++;
  M.storico.push({gara:sport.custom?{custom:true,nome:sport.nome,emoji:sport.emoji}:{id:sport.id,emoji:sport.emoji},
    vincitore:cls[0].p.id,punteggi:cls.map(r=>({id:r.p.id,tot:r.tot}))});
  if(M.punti[cls[0].p.id]>=M.obiettivo){M.chiuso=true;M.campione=cls[0].p.id;}
  pubblica();
}
