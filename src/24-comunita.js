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

   ─── Il punto 3 è stato deciso (2026-09-19), ma è rimandato ───

   La strada scelta è un archivio vero — Supabase o Firebase, il piano
   gratuito basta — con una riga per partita finita. Non è ancora scritta
   una riga di codice: quando si riprenderà, il disegno è questo.

   QUANDO. Una volta sola, quando M.chiuso diventa true in chiudiRound()
   (32-partita.js), e soltanto dall'host: è l'unico che ha M completo, e
   così una partita in cinque non diventa cinque righe uguali.

   COSA. M.storico è già pronto e contiene quello che serve: per ogni
   round la gara, l'indice del vincitore e i punteggi. Più la data, il
   numero di giocatori e BUILD, che dice con quale bilanciamento si
   giocava.

   COSA NO. I nomi dei giocatori. Li scrivono gli utenti e sono spesso
   nomi veri: mandare numeri anonimi tiene la cosa fuori dai guai, mandare
   nomi la ci porta dentro. È una riga in meno, ma va decisa adesso e non
   quando l'archivio è già pieno.

   COME. La chiave finisce nel file pubblico, come tutto il resto: serve
   una chiave che sappia solo scrivere, con un limite di frequenza,
   altrimenti chiunque legga il sorgente può riempire la tabella. E
   l'invio va fatto senza aspettarlo e senza mostrare errori: il gioco
   funziona offline apposta, e una partita non deve finire male perché
   manca la rete.

   PERCHÉ CONVIENE. Con le partite vere in archivio, il ranking qui sotto
   smette di essere un sondaggio e diventa una misura: quale animale fa
   vincere davvero, non quale piace. E i punti 1 e 2 restano necessari
   lo stesso — il punteggio continua a dover essere uguale su host e
   client, quindi quei numeri dovranno passare da V.
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
