# Verifiche in sospeso

Cose che funzionano sulla carta ma che nessuno ha ancora visto succedere.
Non sono bug noti: sono punti dove la prova non è stata fatta, e finché non
la si fa non si sa. Ognuna dice cosa fare e cosa deve succedere se è a posto.

---

## 1. La PWA su un telefono vero

**Stato:** mai provata su un dispositivo. Verificato solo che il server
risponde 200 con i `Content-Type` giusti (`application/javascript` per
`sw.js`, `application/json` per il manifest: se fossero sbagliati il browser
rifiuterebbe il service worker e non mostrerebbe il tasto di installazione).

**Come provare**, su <https://gabry128.github.io/zoolympics/> da telefono:

1. Apri il sito. Nel menu del browser deve comparire **"Installa app"** o
   **"Aggiungi a schermata Home"**, con la giraffa su fondo scuro come icona.
2. Installa e apri dall'icona: deve partire a tutto schermo, senza la barra
   degli indirizzi.
3. Metti il telefono in **modalità aereo** e riapri l'app: deve partire lo
   stesso. È questo il punto che dimostra che il service worker ha preso.

**Se fallisce:** la console del browser dice quasi sempre perché. Un errore
su `sw.js` o sul manifest si vede lì al primo caricamento.

---

## 2. Il tema per arena, guardato con gli occhi

**Stato:** il codice è stato ripristinato dai file della sessione in cui era
stato scritto, e il `docs/index.html` ricostruito è identico byte per byte a
quello di allora. Ma la resa a schermo non è mai stata verificata da quando è
rientrato.

**Come provare:** gioca un round per arena, o almeno per le più lontane fra
loro — `oceano` (nuoto, regata, tuffi), `savana` (calcetto, staffetta),
`cielo` (volo). A ogni gara il fondo della pagina deve cambiare tinta, con
una transizione di mezzo secondo.

**Cosa guardare davvero:** la **leggibilità**. Le palette spostano solo i
colori d'ambiente e lasciano invariati avorio, oro, rosa e i cinque colori
giocatore, proprio perché restino leggibili su ogni arena. Se su qualche
arena un testo o un colore giocatore sparisce nel fondo, è lì che va corretto.

---

## 3. Il multigiocatore dopo un cambio di BUILD

**Stato:** `BUILD` è passato da `2026-09-19b` a `2026-09-19d` in questa
sessione. La conseguenza sull'handshake non è stata provata.

**Come provare:** due dispositivi, uno che ospita e uno che entra, **su reti
diverse** (uno in WiFi e uno in 4G) — è la condizione in cui serve il TURN, e
quella in cui i problemi di rete vengono fuori.

**Cosa deve succedere:** con lo stesso `BUILD` la partita parte. Con `BUILD`
diversi — per esempio se un dispositivo ha in cache una versione vecchia —
l'ospite dev'essere **rifiutato all'handshake con un messaggio chiaro**, non
restare appeso a un timeout.
