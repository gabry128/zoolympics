# Cambiamenti

Cosa è successo al progetto, in ordine, con i numeri che lo dimostrano. I
dettagli di ogni singola modifica stanno nei messaggi dei commit: qui c'è il
filo del discorso, per chi torna fra un mese e non ha voglia di leggersi
ventuno commit.

---

## 2026-09-19 — Il bilanciamento

`BUILD 2026-09-19j` · commit da `010baaa` a `f6a1c3b`

### Le doti passano da 10 a 15

`K` aveva dieci doti. Ne servivano altre cinque — **Precisione, Equilibrio,
Coraggio, Intelligenza, Riflessi** — perché la scherma premiasse l'astuzia e
il biathlon la mira. Senza di quelle, metà delle correzioni chieste non si
potevano nemmeno scrivere.

I dieci valori originali non sono stati toccati: lo script si rifiutava di
scrivere se la fonte non li avesse riportati identici animale per animale.
Nessun peso usava ancora le doti nuove, quindi quel commit da solo non ha
spostato un punteggio.

### Accesso e premio non sono più la stessa cosa

Era il difetto più grosso, e si misurava: **otto gare su quattordici usavano
la stessa dote per decidere chi entra e per assegnare il voto**. Il nuoto
chiedeva `Acqua ≥ 7` e poi moltiplicava l'Acqua per 4 — il requisito veniva
pagato due volte.

Oggi la dote d'accesso non compare più fra i premi. Resta **un'eccezione
dichiarata**: il Volo nello slalom aereo, che la review chiedeva esplicitamente
di non toccare. `strumenti/costruisci-tabelle.py` la segnala a ogni
esecuzione, così resta una scelta e non una svista.

### La Presa non decide più tutto

Pesava **25** su tutte le gare, seconda solo all'Agilità, ed era anche
requisito d'accesso in tre. Essendo rara fra gli animali (media 3,5)
concentrava le prime posizioni sui primati: Gorilla, Scimpanzé, Gibbone e
Orango occupavano 22 dei posti nei primi cinque.

Ora pesa **6**, e resta dove ha senso: come condizione d'ingresso dove serve
una mano per tenere qualcosa — fioretto, racchetta, remo — non come voto.

### Il drago è raro, non debole

Stava nei primi cinque di **dodici gare su quattordici**. Nessuna delle sue
statistiche è stata abbassata: è diventato raro. `RARITA` dice la probabilità
che un animale, quando toccherebbe a lui entrare fra i lotti, ci entri davvero.

Misurato, prima e dopo:

| gara | compariva | compare |
|---|---|---|
| Basket 5 | 38,7% | **2,1%** |
| Scherma | 15,0% | **1,3%** |
| Slalom aereo | 58,0% | **3,5%** |

(`RARITA.drago` è passata prima a 0,12 e poi a 0,06; i numeri sopra sono
misurati su 6000 estrazioni per gara col valore finale.)

Quando appare si vede: aura dorata pulsante e la dicitura "apparizione rara".
Il renderer la ricava da `RARITA` e dall'id, che viaggia già dentro `V`:
nessun campo nuovo sulla rete.

### Il catalogo delle gare: da 14 a 27

**Via i doppioni.** Basket 3 e Basket 5 avevano pesi identici e differivano
solo nel numero di giocatori; idem Beach volley e Pallavolo 6. Delle 19 gare
proposte ne sono cadute quattro per lo stesso motivo.

**Squadre fra 2 e 5.** La Scherma era da 1, e quel `size:1` era un baco
silenzioso: `SPORT` scarta le gare sotto i due giocatori, quindi la scherma
non veniva mai offerta a nessuno. Ora è "Scherma a coppie".

**Sedici gare nuove**, ognuna con emoji, accesso, premi e — dove ha senso —
un'intesa.

**Una gara per chi non gareggiava mai.** Riccio, Dodo e Lumaca non passavano
il filtro di nessun pool. La **Marcia lentissima** ha pesi negativi su
Velocità e Stazza: vince chi è lento e leggero. La Lumaca è prima con 8,0, la
Tartaruga seconda, il Riccio dodicesimo, il Dodo quarantunesimo. Il Ghepardo
non entra nemmeno nel pool: è troppo veloce per una gara di lentezza.

**Due gruppi.** Le gare hanno un campo `gruppo`, `classica` o `ghiaccio`, e la
schermata di scelta li mostra separati: con 27 gare un elenco unico era un
muro di bottoni.

**Un'arena nuova.** Otto gare invernali tutte nel `ghiacciaio` erano troppe:
cinque sono passate a `montagna`, palette di roccia e pino.

### Sei animali nuovi

Dei nove proposti ne sono entrati sei — **Leopardo, Pantera, Iena, Gazzella,
Bufalo, Asino** — con i valori riscritti perché avessero un carattere loro e
non fossero fotocopie di animali già presenti. Il Bufalo è l'unico bovino
davvero acquatico e finisce nelle gare d'acqua; l'Asino ha Fiato 10 ed
Equilibrio 9 dove il Cavallo ha la velocità; la Iena ha Presa 7 dove il Lupo
ha 2.

Fuori Antilope, Bue e Mulo: restavano indistinguibili da Gazzella, Toro e
Asino anche rifacendo i valori.

### Il risultato, misurato

Simulando 2000 gare per sport e guardando chi è davvero il migliore in campo
**fra quelli che escono** — non fra quelli che potrebbero uscire:

| | prima | dopo |
|---|---|---|
| animale più dominante | Drago, nei primi 5 di 12 gare su 14 | Aquila, migliore in campo nel 9,7% |
| animali diversi migliori almeno una volta | — | **81** |
| animali che non entrano in nessuna gara | 3 | **0** |

### Lo schedario animali diventa una scheda vera

La schermata **Informazioni → Animali** aveva le barre delle quindici doti e
basta. Toccando la testata di un animale ora si apre la sua scheda: il radar
delle doti con sovrapposta la media di tutti in tratteggio, le gare dove rende
di più con il voto, quelle dove **non entra e perché** ("manca Presa 2/4"), e
l'intesa spiegata per lui — "Altezza 10: sta sopra la soglia, accanto servono
compagni sotto 6".

Sono gli stessi numeri con cui il gioco assegna i punti a fine round, mostrati
prima di comprare invece che dopo aver perso. Nessun dato nuovo: tutto si
ricava da `ANIMALI`, `SPORT` e `fit()`. Una scheda per volta, perché
novantaquattro radar insieme sarebbero novantaquattro SVG a ogni ricerca.

Costa 6,4 KB sul file compilato, il 3%.

### Il ranking comunitario è predisposto, non acceso

`src/24-comunita.js` tiene i voti e sa produrne una classifica, ma nessun
punteggio li guarda: `MODIFICATORI` resta vuota. Nel file c'è scritto perché
non basta collegarlo — quei voti stanno in `MEM`, cioè nel localStorage del
singolo dispositivo, e `classifica()` gira sia sull'host sia su ogni client.

---

## 2026-09-19 — L'impalcatura

`BUILD` da `2026-09-18f` a `2026-09-19i` · commit da `75da6c7` a `e65d9a7`

- **Git, da zero.** Il progetto non era sotto controllo di versione.
- **`build.py` alza `BUILD` da solo** e tiene allineati `versione.txt` e
  `sw.js`. `--stessa` ricostruisce senza alzare: una build a vuoto non deve
  far buttare la cache a tutti i client.
- **Pubblicazione su GitHub Pages**, con l'uscita spostata da `dist/` a
  `docs/` — Pages, servendo da un branch, pubblica solo dalla radice o da
  `/docs`.
- **La PWA è completa**: `manifest.json`, le icone e il service worker non
  esistevano, benché il codice li chiedesse a runtime da sempre.
- **`docs/` è interamente rigenerabile**: si può cancellare e `build.py` la
  rimette identica byte per byte, icone comprese.
- **Il tema per arena è stato ripristinato**, era andato perso fra due
  sessioni.
- **Quattro correzioni per iOS**, mai provate su un dispositivo: stanno in
  `VERIFICHE.md`.

### Due errori fatti e corretti lungo la strada

- Un `.gitattributes` con `* text eol=lf` **normalizzava le fini riga dentro i
  PNG**, corrompendoli. Si sarebbe visto solo dopo un clone.
- Un `git add -A` ha trascinato in un commit file che dovevano restarne
  fuori. Rifatto.

---

## Cosa resta aperto

Sta in **`VERIFICHE.md`**: la PWA su un telefono vero, la resa a schermo del
tema per arena, l'handshake del multigiocatore dopo un cambio di `BUILD`. E le
domande a cui non è stato risposto stanno in **`DOMANDE.md`**.

Una cosa è decisa ma rimandata di proposito: **archiviare le partite finite**
in un backend, per sapere se il bilanciamento regge davvero invece di
simularlo. Il disegno completo — quando inviare, cosa mandare, cosa non
mandare e perché — è scritto in testa a `src/24-comunita.js`.
