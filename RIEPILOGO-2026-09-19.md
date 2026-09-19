# Riepilogo della giornata — 19 settembre 2026

Ventisette commit, da un progetto senza controllo di versione a un gioco
ribilanciato e pubblicato. Questo file è la vista *di giornata*: cosa è
successo, in che ordine, e dove siamo adesso.

Per il dettaglio di ogni singola modifica ci sono i messaggi dei commit; per
il filo tematico c'è **`CAMBIAMENTI.md`**, che questo riepilogo non duplica.

---

## Dove siamo adesso

| | |
|---|---|
| **Gioco** | 94 animali · 27 gare · 15 doti · `BUILD 2026-09-19l` |
| **File compilato** | `docs/index.html`, 213 KB, autosufficiente |
| **Repository** | `github.com/svikjiod/zoolympics`, allineato al locale (`dee3b05`) |
| **Sito** | **fermo** — Pages da riattivare dopo il cambio nome dell'account |
| **Commit** | 27, albero pulito |

---

## Com'è andata, in tre atti

### 1. L'impalcatura

Il progetto non era sotto controllo di versione. Da lì: git, il primo commit,
e poi tutto quello che serviva perché la pubblicazione fosse una cosa che si fa
senza pensarci.

- **`build.py` alza `BUILD` da solo** e tiene allineati `versione.txt` e
  `sw.js`. `--stessa` ricostruisce senza alzare, perché una build a vuoto non
  deve far buttare la cache a tutti i client.
- **Pubblicazione su GitHub Pages**, con l'uscita spostata da `dist/` a
  `docs/`: Pages, servendo da un branch, pubblica solo dalla radice o da
  `/docs`.
- **La PWA era incompleta**: `manifest.json`, le icone e il service worker non
  esistevano, benché il codice li chiedesse a runtime da sempre.
- **`docs/` è diventata interamente rigenerabile**: si può cancellare e
  `build.py` la rimette identica byte per byte, icone comprese.
- **Il tema per arena è stato recuperato**: era andato perso fra due sessioni.

### 2. Il bilanciamento

Una review chiedeva di correggere la filosofia dei punteggi. Le diagnosi erano
giuste e misurabili.

- **La Presa dominava**: pesava 25 su tutte le gare, seconda solo all'Agilità,
  ed era anche requisito d'accesso in tre. Essendo rara, concentrava le prime
  posizioni sui primati. Ora pesa **6**.
- **Otto gare su quattordici si facevano pagare due volte lo stesso
  requisito**: il nuoto chiedeva `Acqua ≥ 7` e poi moltiplicava l'Acqua per 4.
  Ne resta una sola, dichiarata: il Volo nello slalom aereo.
- **Le doti sono passate da 10 a 15**. Precisione, Equilibrio, Coraggio,
  Intelligenza e Riflessi non esistevano, e senza di loro metà delle correzioni
  chieste non si potevano nemmeno scrivere.
- **Il drago è diventato raro, non debole.** Stava nei primi cinque di dodici
  gare su quattordici; ora compare in circa una partita su sedici, e quando
  appare ha un'aura.
- **Il catalogo è passato da 14 a 27 gare**, senza doppioni: Basket 3 e Basket
  5 avevano pesi identici e differivano solo nel numero di giocatori, e così
  Beach volley e Pallavolo.

### 3. La taratura a mano

Il motore sa dire chi è più forte secondo i numeri, non chi *dovrebbe* esserlo.
Da qui il giro: `CALIBRAZIONE.txt` esporta la classifica intera di ogni gara,
si riordina con un editor, e `strumenti/tara-statistiche.py` adatta le doti
perché il gioco produca quell'ordine.

Correzioni applicate: foca e pinguino su nei tuffi e in acqua, castoro e lontra
ai remi, canguro primo nel taekwondo, brontosauro ed elefante giù nella marcia
lenta. Il drago è protetto: non può perdere nessuna dote.

---

## Le cose imparate, che valgono più del risultato

**Non si può chiedere tutto.** Prese insieme, le 27 gare corrette facevano 3206
richieste di sorpasso, e soddisfarne l'85% voleva dire riscrivere 589 doti su
92 animali dei 94. La causa è dimostrabile: 121 coppie sono impossibili per
*dominanza* — si chiedeva l'Alce sopra il T-Rex a basket, ma l'Alce è peggiore
in tutte e cinque le doti che il basket guarda.

La soluzione non è stata tarare meglio ma **chiedere di meno**: le posizioni
profonde non cambiano una partita, ma generano la gran parte dei vincoli. Con
`--cima 8` si ottiene il 98% di ciò che conta toccando 46 animali invece di 92.

**Separare l'accesso dal premio ha risolto un problema che non stavamo
affrontando.** Le gare proposte avevano da 7 a 22 animali ammessi, troppo pochi
per squadre da quattro. Il difetto non era la soglia: era che le doti di
*prestazione* facevano da filtro d'ingresso. Separandole, l'accesso si è
allargato da solo a 32–82 e il problema è sparito senza toccare nessuna soglia.

**Un test su dati finti ha pagato più di qualunque revisione.** Provare la
pipeline di taratura prima di consegnarla ha trovato quattro difetti veri, fra
cui uno che avrebbe dato **Velocità 10 alla tartaruga** e uno silenzioso: una
riga non letta faceva risultare *modificata* una gara che nessuno aveva
toccato.

---

## Gli errori fatti, e come sono venuti fuori

- Un `.gitattributes` con `* text eol=lf` **normalizzava le fini riga dentro i
  PNG**, corrompendoli. Si sarebbe visto solo dopo un clone.
- Un `git add -A` ha trascinato in un commit file che dovevano restarne fuori.
  Commit rifatto.
- Ho diagnosticato il sito giù come «repository reso privato». **Era sbagliato**:
  il repository si era *spostato*, da `gabry128` a `svikjiod`. GitHub redirige
  le operazioni git ma la vecchia pagina web risponde 404, ed è quello che
  avevo visto. Il remote locale ora punta all'indirizzo nuovo.

---

## Cosa resta aperto

**Da fare con il telefono in mano** — sta in `VERIFICHE.md`. Sono tutte cose
verificate nel codice ma mai viste a schermo: l'installazione della PWA e
l'avvio offline, la resa delle otto palette d'arena, l'aura del drago, e la
scheda animale col radar a quindici assi su uno schermo stretto.

**Da riattivare**: GitHub Pages, in Settings → Pages, `main` + `/docs`. Finché
è ferma, il gioco si passa come file — `docs/index.html` funziona con un doppio
clic, tranne multigiocatore in rete e commento dell'AI, che hanno bisogno di un
indirizzo `https`.

**Deciso ma rimandato**: archiviare le partite finite in un backend, per sapere
se il bilanciamento regge davvero invece di simularlo. Il disegno completo è
in testa a `src/24-comunita.js`.

**Da sapere**: il dossier pubblicato non si aggiorna da solo. È una fotografia,
e va ripubblicato a mano dopo ogni modifica al gioco.

---

## La mappa dei file

| file | a cosa serve |
|---|---|
| `ARCHITETTURA.md` | dove sta cosa, modulo per modulo |
| `CLAUDE.md` | le regole da non violare |
| `CAMBIAMENTI.md` | cosa è cambiato e perché, per tema |
| `VERIFICHE.md` | le prove ancora da fare |
| `DOMANDE.md` | le decisioni prese e come |
| `CALIBRAZIONE.txt` | le classifiche, da correggere a mano |
| `strumenti/` | esportazione, taratura, tabelle, dossier |
