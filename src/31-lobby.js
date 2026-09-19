/* ─── lobby ─── */
function disegnaSetupHost(){
  $("#conta-giocatori").innerHTML=[2,3,4,5].map(n=>
    `<button class="scelta ctr" data-ng="${n}" aria-pressed="${n===nGiocatori}"><b>${n}</b></button>`).join("");
  const cum=modoCrediti==="tot", val=cum?creditiTot:crediti;
  $("#modo-crediti").innerHTML=[["round","creditiRound"],["tot","creditiTot"]].map(([k,n])=>
    `<button class="scelta ctr" data-mc="${k}" aria-pressed="${k===modoCrediti}"><b>${t(n)}</b></button>`).join("");
  $("#conta-crediti").innerHTML=MAZZETTE[modoCrediti].map(c=>
    `<button class="scelta ctr" data-c="${c}" aria-pressed="${c===val}"><b>${c}</b></button>`).join("");
  $("#crediti-altro").placeholder=t("altraCifra");
  $("#crediti-altro").min=LIMITI[modoCrediti][0];
  $("#crediti-altro").max=LIMITI[modoCrediti][1];
  $("#usa-crediti-altro").textContent=t("usaCifra");
  $("#nota-crediti").textContent=cum?t("notaTot",val):t("notaRound",val);
  $("#conta-punti").innerHTML=[1,2,3].map(p=>
    `<button class="scelta ctr" data-pt="${p}" aria-pressed="${p===obiettivo}"><b>${p}</b><span>${p===1?t("vittoria"):t("vittorie")}</span></button>`).join("");
  $("#modo-valori").innerHTML=[[true,"valoriSi"],[false,"valoriNo"]].map(([k,n])=>
    `<button class="scelta ctr" data-mv="${k}" aria-pressed="${k===mostraValori}"><b>${t(n)}</b></button>`).join("");
  $("#nota-valori").textContent=mostraValori?t("valoriSiD"):t("valoriNoD");
  $("#modo-scelta").innerHTML=[["turno","sceltaTurno","sceltaTurnoD"],["casuale","sceltaCaso","sceltaCasoD"]].map(([k,n,d])=>
    `<button class="scelta" data-ms="${k}" aria-pressed="${k===modoScelta}"><b>${t(n)}</b><span>${t(d)}</span></button>`).join("");
}
function disegnaLobby(){
  if(MODO==="locale"){
    $("#sedie").innerHTML=sedie.map((s,i)=>
      `<div class="sedia" style="--col:${s.col}"><input type="text" data-sed="${i}" maxlength="12" value="${esc(s.nome)}" placeholder="${lang?"Player":"Giocatore"} ${i+1}" style="background:transparent;border:0;padding:4px 0"></div>`).join("");
    const b=$("#btn-inizia");b.disabled=false;b.textContent=t("apriAsta");
    return;
  }
  $("#sedie").innerHTML=Array.from({length:nGiocatori},(_,i)=>{
    const s=sedie[i];
    if(!s)return `<div class="sedia vuota"><b>${t("postoLibero")}</b></div>`;
    return `<div class="sedia" style="--col:${s.col}"><b>${esc(s.nome)}${s.id===mioId?" ("+t("tu")+")":""}</b>
      <span class="mini">${s.id===0?t("tieneStanza"):(s.online===false?t("disconnesso"):t("pronto"))}</span></div>`;
  }).join("");
  if(MODO==="host"){
    const b=$("#btn-inizia"),n=sedie.length;
    b.disabled=n<2||!peer||!peer.open;
    b.textContent=n>=nGiocatori?t("apriAsta"):t("iniziaCon",n,nGiocatori);
  }
  if(MODO==="ospite")$("#attesa-ospite").innerHTML=
    `<p class="nota">${t("aspettando","<b>"+esc(sedie[0]?sedie[0].nome:t("chiCreato"))+"</b>")}</p>
     <p class="mini" style="margin-top:6px">${t("inSala",sedie.length,nGiocatori)}</p>`;
}
