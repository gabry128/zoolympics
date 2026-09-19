/* ─── ranking comunitario: predisposizione ─────────────────────────────
   Struttura pronta, effetto spento. Qui c'è dove i voti della comunità
   verrebbero tenuti e riletti. Nessun punteggio li guarda: MODIFICATORI
   in 21-punteggi.js resta vuota e la classifica è identica a prima.

   Forma del dato, una voce per animale, sotto la chiave "gradimento":

     { "drago": {voti: 12, somma: 54}, "lumaca": {voti: 3, somma: 5} }

   Si tiene somma e conteggio invece della media già fatta: così un voto
   nuovo è un'addizione e non serve rileggere lo storico.

   ─── Come accenderlo, e perché non basta scriverlo qui ───

   classifica() gira sia sull'host sia su ogni client, e le due esecuzioni
   devono dare lo stesso risultato. Questi voti stanno in MEM, cioè nel
   localStorage del singolo dispositivo: leggerli dentro il punteggio
   farebbe vedere classifiche diverse a host e ospiti. Servono tre passi,
   in quest'ordine:

     1. esporre i voti in V (vista(), 30-rete.js), così viaggiano con lo
        snapshot e tutti calcolano sugli stessi numeri;
     2. aggiungere un modificatore a MODIFICATORI (21-punteggi.js) che
        legga ctx.gradimento — mai MEM direttamente;
     3. decidere da dove arrivano i voti davvero. MEM è locale al
        dispositivo: un ranking "di comunità" vuole un server o un canale
        condiviso, che oggi il gioco non ha. È la decisione vera, e non è
        una riga di codice.

   Le scommesse interne, se mai, vengono dopo il punto 3: hanno bisogno di
   uno storico attendibile, che un archivio locale non può dare.
*/
const VOTO_MIN=1, VOTO_MAX=5;

const gradimento={
  /* tutte le voci, come oggetto. Vuoto se non ha mai votato nessuno. */
  tutti(){return MEM.leggi("gradimento",{});},

  /* media dei voti su un animale, o null se non ne ha ancora. */
  medio(id){const v=this.tutti()[id];return v&&v.voti?v.somma/v.voti:null;},

  /* registra un voto da VOTO_MIN a VOTO_MAX e restituisce la voce aggiornata. */
  vota(id,voto){
    const v=Math.max(VOTO_MIN,Math.min(VOTO_MAX,Math.round(+voto||0)));
    if(!id||!v)return null;
    const t=this.tutti(),r=t[id]||{voti:0,somma:0};
    t[id]={voti:r.voti+1,somma:r.somma+v};
    MEM.scrivi("gradimento",t);
    return t[id];
  },

  /* la classifica della comunità, dal più amato al meno. Solo gli animali
     che hanno almeno `minimo` voti: sotto quella soglia una media non
     significa niente. */
  classifica(minimo=3){
    const t=this.tutti();
    return Object.keys(t)
      .filter(id=>t[id].voti>=minimo)
      .map(id=>({id,voti:t[id].voti,medio:t[id].somma/t[id].voti}))
      .sort((a,b)=>b.medio-a.medio||b.voti-a.voti||(a.id<b.id?-1:1));
  },

  /* forma adatta a V: dati semplici e serializzabili, come vuole
     l'invariante sullo snapshot. È il ponte per il passo 1. */
  perVista(minimo=3){
    const o={};
    for(const r of this.classifica(minimo))o[r.id]=Math.round(r.medio*100)/100;
    return o;
  },

  azzera(){MEM.togli("gradimento");}
};

/* Il modificatore che userebbe tutto questo, quando i tre passi saranno
   fatti. Non è in MODIFICATORI: è qui come promemoria della forma esatta.

   {id:"gradimento",
    attivo: ctx=>!!ctx.gradimento,
    calcola: ctx=>{
      const v=ctx.rosa.map(a=>ctx.gradimento[a.id]).filter(x=>x!=null);
      if(!v.length)return {mult:1};
      const media=v.reduce((s,x)=>s+x,0)/v.length;        // 1..5
      return {mult:1+(media-3)*0.02,                      // ±4% agli estremi
              etichetta:"Gradimento "+media.toFixed(1)};
    }}
*/
