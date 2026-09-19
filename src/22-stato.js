/* ─── stato ─── */
let MODO="locale",mioId=null,codice="",peer=null,connOspite=null;
const conns=new Map();
let crediti=20,creditiTot=200,modoCrediti="round";
let nGiocatori=3,obiettivo=2,modoScelta="turno";
const MAZZETTE={round:[20,30,50],tot:[100,200,500]};
const LIMITI={round:[5,300],tot:[20,3000]};
let sport=null,pool=ANIMALI.slice(),sedie=[],G=null,M=null,V=null,verdetto=null;
let timerId=null,tickId=null,scadenza=0,tentativi=0;
let mostraRose=false, bozzaOfferta="";
let mostraValori=true;     // pannello rose aperto · cifra che sto scrivendo
