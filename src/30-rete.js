/* ─── rete ─── */
const reteOk=()=>typeof window.Peer==="function";
const nuovoCodice=()=>Array.from({length:4},()=>ALFA[(Math.random()*ALFA.length)|0]).join("");
function invia(c,m){try{if(c&&c.open)c.send(m);}catch{}}
function trasmetti(m){conns.forEach(c=>invia(c,m));}
const mioNome=()=>($("#mio-nome").value||"").trim().slice(0,12)||"Player";
function spegniPeer(){
  fermaTimer();fermaTick();
  try{if(connOspite)connOspite.close();}catch{}
  try{if(peer&&!peer.destroyed)peer.destroy();}catch{}
  peer=null;connOspite=null;conns.clear();
}
function tornaHome(){
  if(MODO==="host")trasmetti({t:"chiuso"});
  setTimeout(spegniPeer,150);
  MODO="locale";mioId=null;codice="";G=null;M=null;V=null;verdetto=null;sport=null;
  MEM.togli("partita");
  $("#nota-rete").textContent="";
  vai("s-home");
}
function V_fase(){
  if(!M)return "lobby";
  if(M.attesaScelta)return "scelta";
  if(M.chiuso||!G||!G.lotto&&G.giocatori.every(p=>p.rosa.length>=G.dim))return "fine";
  return "asta";
}
function vista(){
  const L=G&&G.lotto;
  return {fase:V_fase(),codice,crediti:(M?M.dote:(modoCrediti==="tot"?creditiTot:crediti)),cumulativo:(M?M.cumulativo:modoCrediti==="tot"),valori:(M?M.valori:mostraValori),sport,sedie,simultanea:MODO!=="locale",
    nGiocatori,dim:G?G.dim:0,match:M,
    giocatori:G?G.giocatori.map(p=>({id:p.id,nome:p.nome,col:p.col,crediti:p.crediti,rosa:p.rosa,skip:p.skip,online:p.online!==false})):[],
    lotto:L?{animale:L.animale,fase:L.fase,offerta:L.offerta,migliore:L.migliore,turno:L.turno,
      fuori:L.fuori,saltatoDa:L.saltatoDa,tetti:G.giocatori.map(tetto),
      msRimasti:L.scadeA?Math.max(0,L.scadeA-Date.now()):0}:null,
    verdetto};
}
function pubblica(){
  if(MODO==="ospite")return;
  V=vista();
  if(MODO==="host")trasmetti({t:"vista",v:V});
  disegna();salvaPartita();
}
function creaStanza(){
  if(!reteOk())return;
  spegniPeer();
  MODO="host";mioId=0;codice=nuovoCodice();
  sedie=[{id:0,nome:mioNome(),col:COLORI[0],online:true}];
  M=null;G=null;sport=null;verdetto=null;
  $("#card-codice").style.display="block";
  $("#pannello-host").style.display="flex";
  $("#attesa-ospite").style.display="none";
  $("#mostra-codice").textContent="· · · ·";
  $("#stato-stanza").textContent=t("creandoStanza");
  disegnaSetupHost();disegnaLobby();vai("s-lobby");
  apriPeerHost();
}
function apriPeerHost(){
  peer=new Peer(PREFISSO+codice,{debug:0,config:ICE});
  peer.on("open",()=>{                       /* il codice compare SOLO ora */
    $("#mostra-codice").textContent=codice;
    $("#stato-stanza").textContent="";
    disegnaLobby();
  });
  peer.on("error",e=>{
    if(e.type==="unavailable-id"){codice=nuovoCodice();try{peer.destroy();}catch{}apriPeerHost();return;}
    if(e.type==="peer-unavailable")return;
    $("#stato-stanza").textContent=t("servizioKO")+" ["+(e&&e.type||"?")+"]";
    if(!peer||!peer.open) $("#mostra-codice").textContent="· · · ·";
  });
  peer.on("disconnected",()=>{try{peer.reconnect();}catch{}});
  peer.on("connection",conn=>{
    conn.on("data",m=>daOspite(conn,m));
    conn.on("close",()=>{for(const [id,c] of conns)if(c===conn){conns.delete(id);offline(id);}});
  });
}
function offline(id){
  const s=sedie.find(x=>x.id===id);if(s)s.online=false;
  if(G&&G.giocatori[id])G.giocatori[id].online=false;
  if(M)pubblica();
  disegnaLobby();
}
function daOspite(conn,m){
  if(!m||typeof m!=="object")return;
  if(m.t==="entra"){
    if(m.v!==BUILD) return invia(conn,{t:"rifiuto",perche:t("versioniDiverse",m.v||"?",BUILD)});
    const nome=String(m.nome||"Player").slice(0,12).trim()||"Player";
    let s=sedie.find(x=>x.nome.toLowerCase()===nome.toLowerCase());
    if(!s){
      if(M)return invia(conn,{t:"rifiuto",perche:t("giaIniziata")});
      if(sedie.length>=nGiocatori)return invia(conn,{t:"rifiuto",perche:t("stanzaPiena")});
      s={id:sedie.length,nome,col:COLORI[sedie.length],online:true};sedie.push(s);
    }
    s.online=true;if(G&&G.giocatori[s.id])G.giocatori[s.id].online=true;
    conns.set(s.id,conn);
    invia(conn,{t:"posto",id:s.id});
    disegnaLobby();
    if(M)pubblica();else trasmetti({t:"vista",v:vista()});
    return;
  }
  if(m.t==="azione"){let chi=null;for(const [id,c] of conns)if(c===conn)chi=id;
    if(chi!==null)eseguiAzione(m.a,chi);}
}
function entraStanza(cod){
  if(!reteOk())return;
  spegniPeer();
  codice=cod;MODO="ospite";M=null;G=null;V=null;
  const out=$("#esito-entra");
  tentativi=0;provaEntrata(cod,out);
}
function provaEntrata(cod,out){
  tentativi++;
  let fase="servizio";
  const dillo=()=>{ out.innerHTML=`<div class="pensa" style="padding:14px 0">
    <div class="pallini"><i></i><i></i><i></i></div>
    <p class="mini">${t("fase_"+fase)}${tentativi>1?" ("+tentativi+")":""}</p></div>`; };
  dillo();
  peer=new Peer({debug:0,config:ICE});
  let fatto=false;
  const fallito=msg=>{
    if(fatto)return;fatto=true;clearTimeout(to);
    try{peer.destroy();}catch{}
    if(tentativi<4){setTimeout(()=>provaEntrata(cod,out),1200*tentativi);return;}
    out.innerHTML=`<div class="errore">${msg||t("bloccato_"+fase)}</div>
      <button class="btn fantasma" id="riprova-entra" style="margin-top:10px">${t("riprova")}</button>`;
    $("#riprova-entra").onclick=()=>entraStanza(cod);
  };
  const to=setTimeout(()=>fallito(null),14000);
  peer.on("open",()=>{
    fase="stanza"; dillo();
    connOspite=peer.connect(PREFISSO+cod,{reliable:true});
    connOspite.on("open",()=>{fase="presentazione";dillo();invia(connOspite,{t:"entra",nome:mioNome(),v:BUILD});});
    connOspite.on("data",m=>{
      if(m.t==="chiuso"){spegniPeer();MODO="locale";M=null;V=null;$("#nota-rete").textContent=t("stanzaChiusa");vai("s-home");return;}
      if(m.t==="rifiuto"){fatto=true;clearTimeout(to);
        out.innerHTML=`<div class="errore">${esc(m.perche)}</div>`;spegniPeer();return;}
      fatto=true;clearTimeout(to);out.innerHTML="";
      if(m.t==="posto"){mioId=m.id;
        $("#pannello-host").style.display="none";
        $("#card-codice").style.display="block";$("#attesa-ospite").style.display="block";
        $("#stato-stanza").textContent="";$("#mostra-codice").textContent=codice;vai("s-lobby");return;}
      if(m.t==="vista"){V=m.v;sedie=V.sedie;sport=V.sport;crediti=V.crediti;M=V.match;
        nGiocatori=V.nGiocatori;disegnaLobby();disegna();}
    });
    connOspite.on("close",()=>{if(MODO==="ospite"&&V){V=null;M=null;$("#nota-rete").textContent=t("stanzaChiusa");vai("s-home");}});
  });
  peer.on("error",e=>fallito(e&&e.type==="peer-unavailable"?t("nessunaStanza")
    :t("bloccato_"+fase)+" ["+(e&&e.type||"?")+"]"));
}
