# Zoolympics — regole del progetto

PWA in **un file solo**. I sorgenti stanno in `src/` e `vendor/`; `build.py` li
riconcatena in `docs/index.html`. Quello che si pubblica è solo il file
compilato.

Prima di toccare qualunque cosa leggi **`ARCHITETTURA.md`**: è la mappa e dice
in quale modulo sta cosa. Apri solo i moduli che servono al compito.

**`VERIFICHE.md`** elenca le prove ancora da fare — cose che funzionano sulla
carta ma che nessuno ha visto succedere. Se ne chiudi una, toglila da lì;
se ne apri una nuova, aggiungila.

```
python3 build.py              # alza BUILD e ricostruisce docs/
python3 build.py --stessa     # ricostruisce lasciando BUILD com'è
```

`vendor/peerjs.js` sono 93 KB di libreria di terze parti: **non leggerlo mai**.

---

## Invarianti — non violarli

**1. `BUILD`, `versione.txt` e `sw.js` sempre allineati.**
`BUILD` sta in `src/20-base.js`, e lo stesso valore va in `docs/versione.txt`
e in `src/sw.js`. Se i due
valori divergono ogni client butta la cache e ricarica in continuazione. `BUILD`
è anche il controllo di compatibilità del multigiocatore: un ospite con un build
diverso viene rifiutato all'handshake.

**Non si toccano a mano**: li allinea `build.py`, che alza `BUILD` a ogni build
(stesso giorno → lettera successiva, giorno nuovo → `a`), lo timbra in
`src/sw.js` e riscrive `versione.txt`. Per una ricostruzione che non deve far
ricaricare nessuno usa `--stessa`.

Il service worker ha bisogno del timbro per un motivo suo: il browser installa
un SW nuovo solo se i byte del file cambiano. Se `sw.js` restasse identico, i
client continuerebbero a servirsi dalla cache vecchia.

**2. `PREFISSO` non si cambia mai.**
`const PREFISSO="zoolympics-"` in `src/20-base.js:5` è il prefisso degli id
PeerJS (`src/30-rete.js`). Cambiarlo taglia fuori chiunque abbia ancora la
versione vecchia aperta: non riuscirebbe più a entrare in una partita.

**3. Ogni stringa visibile ha la coppia `[it, en]` in `S`.**
Tutto il testo che l'utente legge sta in `S`, dentro `src/11-testi.js`, come
array di due elementi. La lingua è l'indice dell'array (`t()` in `20-base.js`),
quindi niente stringhe scritte a mano dentro i moduli — e una terza lingua
vorrebbe dire rifare `t()`.

**4. Il deploy è un file solo.**
Niente import, niente moduli, niente richieste a file esterni a runtime: tutto
finisce concatenato in un unico `<script>`. Tutti i nomi di primo livello sono
globali e **l'ordine di caricamento è l'ordine in `build.py`**. Una dipendenza
nuova va messa in `vendor/` e aggiunta a quell'elenco.

**5. `V` contiene solo dati semplici serializzabili.**
`V` è lo snapshot che `vista()` produce e che viaggia sul canale PeerJS verso
gli ospiti: numeri, stringhe, booleani, array e oggetti piatti. Niente funzioni,
niente `Map`/`Set`, niente riferimenti a nodi DOM, niente cicli. Quello che non
è in `V` per gli ospiti **non esiste**, e il renderer legge solo `V`, mai
`M`/`G`.

**6. Tetto di 40 animali per round.**
`src/32-partita.js:31` (`avviaGara`) e `src/33-asta.js:53` (`usaSkip`) limitano
a 40 gli animali introdotti in un round. Anche `gareDisponibili()` ci si appoggia
(`Math.floor(40/n)`). Se tocchi l'offerta di lotti, questo tetto resta.

**7. Il punteggio deve essere deterministico e derivabile da `V`.**
`classifica()` gira **sia sull'host** (`src/32-partita.js:36`, `chiudiRound`)
**sia su ogni client** (`src/40-disegno.js:158`, che la chiama su `v.sport` e
`v.giocatori`). Le due esecuzioni devono dare lo stesso risultato, quindi in
tutta la catena `fit` → `intesa` → `punteggio` → `applicaModificatori` →
`classifica`:

- niente `Math.random()`, niente `Date.now()`, niente orologio;
- niente lettura di `M`/`G`, di `localStorage` o dello stato del DOM;
- niente chiamate di rete o all'AI;
- ogni ingresso nuovo che sposta il punteggio va prima esposto in `V`.

Il corollario è il tie-break: l'ordinamento finale chiude su `a.p.id - b.p.id`
proprio perché due macchine devono produrre la stessa classifica.

**8. `tetto()` tiene un credito per ogni slot vuoto.**
Qualunque cosa tocchi i crediti deve preservarlo, altrimenti le rose si
bloccano a metà.

---

## Come lavorare

- Un **commit per ogni modifica separata**, così si può tornare indietro senza
  sciogliere un nodo di cambiamenti diversi.
- Non aprire tutto il progetto: `ARCHITETTURA.md` più i due o tre moduli che
  servono.
- Le fini riga sono **LF** ovunque (`.gitattributes`): il build deve riprodurre
  `docs/index.html` byte per byte anche su Windows.
- **Dentro `docs/` non si scrive mai a mano.** È tutta output: `index.html`,
  `versione.txt` e `sw.js` li genera il build, `manifest.json` e le icone
  arrivano da `statico/`. Si può cancellare per intero e `python3 build.py`
  la rimette identica. Una modifica fatta lì dentro la perdi al primo build.
- `docs/` **è tracciato** da git: la pubblicazione è GitHub Pages dal repo,
  impostato su branch `main` e cartella `/docs`. Pages, servendo da un branch,
  pubblica solo dalla radice o da `/docs`: una cartella `dist/` non la
  vedrebbe. Dopo una modifica ai sorgenti, ricostruisci e committa anche
  `docs/index.html`, `docs/versione.txt` e `docs/sw.js`, insieme al `BUILD`
  alzato in `src/20-base.js` e `src/sw.js`.
