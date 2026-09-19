# Zoolympics — architecture map

Upload **this file** (plus the one or two modules a task touches) instead of the
whole `index.html`. The single file is ~193 KB, half of it vendor code; this map
is ~8 KB.

---

## Build

Deployment is still **one file**. `src/` and `vendor/` are just the source layout.

```
python3 build.py      # → docs/index.html
```

`build.py` concatenates the pieces in a fixed order and reproduces the original
file **byte for byte** (verified). `sw.js`, `manifest.json`, `versione.txt` and
the icons sit next to `docs/index.html`. The output folder is called `docs/`
because GitHub Pages, serving from a branch, only publishes the repo root or
`/docs`.

Two things that must stay in sync by hand:

- `BUILD` in `src/20-base.js` and the contents of `versione.txt` — a mismatch
  makes every client wipe its cache and reload.
- `BUILD` is also the multiplayer compatibility gate: a guest on a different
  build is refused at the handshake. Bump it whenever the network payload changes.

---

## File map

| file | lines (orig.) | size | what's in it |
|---|---|---|---|
| `src/01-testa.html` | 1–15 | 1 KB | `<head>`, meta, manifest, icons |
| `src/02-stile.css` | 17–176 | 13 KB | all CSS, design tokens in `:root` |
| `src/03-corpo.html` | 178–310 | 7 KB | the 8 `.schermo` sections |
| `vendor/peerjs.js` | 312–320 | 93 KB | PeerJS 1.5.4 + WebRTC adapter — **never read this** |
| `src/10-dati.js` | 323–454 | 9 KB | `K` (10 stats), `ANIMALI` (88), `SPORT_TUTTI`, `STAT`, `GARE` |
| `src/11-testi.js` | 455–628 | 15 KB | `S` — every UI string as `[it, en]` |
| `src/20-base.js` | 629–665 | 2 KB | `vai()`, `BUILD`, `ICE`, `DURATA`, `$`, `MEM`, `t()` |
| `src/21-punteggi.js` | 666–736 | 3 KB | `fit`, `costruisciPool`, `intesa`, `punteggio`, `classifica` |
| `src/22-stato.js` | 737–748 | 0.5 KB | all module-level game state |
| `src/23-ai.js` | 749–785 | 2 KB | `motoreAPI().chiedi()`, `estraiJSON` |
| `src/30-rete.js` | 786–934 | 7 KB | PeerJS host/guest, handshake, message handlers |
| `src/31-lobby.js` | 935–979 | 3 KB | host settings panel, seat list |
| `src/32-partita.js` | 980–1023 | 2 KB | match & round lifecycle |
| `src/33-asta.js` | 1024–1148 | 5 KB | **auction engine**, `eseguiAzione`, `salvaPartita` |
| `src/40-disegno.js` | 1149–1393 | 15 KB | all rendering + AI verdict |
| `src/41-info.js` | 1394–1475 | 4 KB | info screen, event cards, animal browser |
| `src/42-avvio.js` | 1476–1652 | 10 KB | i18n apply, event wiring, boot, service worker |
| `src/04-coda.html` | 1654–1656 | — | closing tags |

Everything is one concatenated `<script>`, so there are no modules or imports:
all top-level names are global and **load order is the order in `build.py`**.

---

## The spine

```
user tap → agisci(a) ─┬─ guest: send {t:"azione", a} to host
                      └─ host/local: eseguiAzione(a, chi)
                                        ↓ mutates M and G
                                     pubblica()
                                        ├─ V = vista()        (plain-data snapshot)
                                        ├─ broadcast {t:"vista", v:V} to guests
                                        ├─ disegna()          (renders from V only)
                                        └─ salvaPartita()     (local mode only)
```

The host is authoritative. Guests send intents and render whatever snapshot
comes back. The renderer never touches `M`/`G`, only `V`.

## State objects

- **`sedie`** — seats: `{id, nome, col, online}`.
- **`M`** (match) — `punti`, `round`, `obiettivo`, `storico`, `borsa` (credits
  carried between rounds), `giocate`, `modoScelta`, `cumulativo`, `valori`,
  `chiuso`, `campione`.
- **`G`** (round) — `dim` (team size), `sim` (simultaneous vs turn-based),
  `giocatori` (with `rosa`, `crediti`, `skip`), `coda`/`riserva`/`introdotti`
  (lot supply), `apre`, `lotto`.
- **`G.lotto`** (`L`) — the animal on the block: `animale`, `fase`, `offerta`,
  `migliore`, `turno`, `fuori`, `scadeA`.
- **`V`** — the snapshot. Anything not in here is invisible to guests.

`L.fase`: `apertura` → `rilanci` (turn-based) or `gara` (simultaneous) →
`venduto` | `scartato`.

## Action verbs (`eseguiAzione`)

`scegliGara` · `apri` · `skip` · `rilancia {v}` · `passa` · `avanti` · `prossimoRound`

## Network messages

guest→host: `entra {nome, v}` · `azione {a}`
host→guest: `posto {id}` · `vista {v}` · `rifiuto {perche}` · `chiuso`

---

## Extension points

Ranked roughly by cost. S ≈ an afternoon, M ≈ touches 3–4 places, L ≈ needs a
design decision first.

| # | name | where | purpose | cost |
|---|---|---|---|---|
| 1 | Action bus | `33-asta.js` · `eseguiAzione`, `agisci` | one door for every intent; new verbs need no network change | S |
| 2 | State snapshot | `30-rete.js` · `vista`, `pubblica` | one field here makes new state visible to guests + renderer | S |
| 3 | Lot phase machine | `33-asta.js` · `L.fase` chain | insert new phases between existing ones | M |
| 4 | Bid ceiling | `33-asta.js` · `riserva`, `tetto` | the only place purchasing power is decided | S |
| 5 | Event definition | `10-dati.js` · `SPORT_TUTTI`; `32-partita.js` · `avviaGara` | events are pure data; custom ones already work at runtime | S |
| 6 | Synergy type | `21-punteggi.js` · `intesa` (`sn.tipo`) | already a switch: add a branch, nothing else changes | S |
| 7 | Animal schema | `10-dati.js` · `K` + `ANIMALI` | new stats are additive; traits need a consumer (see 8) | M |
| 8 | Scoring pipeline | `21-punteggi.js` · `fit`→`intesa`→`punteggio`→`classifica` | pure functions; best place for a modifier slot | M |
| 9 | Lot supply | `33-asta.js` · `prossimoLotto`, `G.coda`/`riserva` | what enters the auction queue and when | M |
| 10 | Eligibility filter | `21-punteggi.js` · `costruisciPool` | who may appear for a given event | S |
| 11 | Round lifecycle | `32-partita.js` · `iniziaPartita`, `nuovoRound`, `chiudiRound` | clean before/after boundary; `M` already carries history | M |
| 12 | Screen registry | `03-corpo.html` + `20-base.js` `vai` + `40-disegno.js` `disegna`/`V_fase` | new screens = section + phase string + branch | M |
| 13 | Host settings | `31-lobby.js` · `disegnaSetupHost` + `42-avvio.js` handlers | recipe for making any mechanic optional | S |
| 14 | AI engine | `23-ai.js` · `chiedi(prompt)` | one contract; new features = prompt + validator. Bot players plug in here + point 1 | S |
| 15 | Persistence | `20-base.js` · `MEM`; `33-asta.js` · `salvaPartita` | one storage object, prefix `asta.` | M |
| 16 | Network envelope | `30-rete.js` · `daOspite` + guest handler | tagged messages, strict version gate | M |

### Four-step recipe for a new optional mechanic

1. toggle in `disegnaSetupHost` (`31-lobby.js`) + delegated `data-*` listener (`42-avvio.js`)
2. module-level variable (`22-stato.js`)
3. copy into `M` in `iniziaPartita` (`32-partita.js`)
4. expose in `vista()` (`30-rete.js`) so guests see it

### Where not to hook

- **Inside the render functions.** `disegnaAsta`/`disegnaFine` rebuild
  `innerHTML` wholesale. State kept there (`mostraRose`, `bozzaOfferta`) is
  invisible to guests and to the save file. Put game state in `M`/`G`.
- **The phase strings, as they stand.** `L.fase` is known both to the engine and
  to the renderer, and `V_fase()` re-derives the screen from a chain of
  conditions. Adding a third or fourth mechanic here means edits in two distant
  places each time.

---

## Invariants and gotchas

- `tetto()` keeps **one credit per empty slot**, so every roster can always be
  filled. Anything touching money must preserve this or rosters deadlock.
- Hard cap of **40 animals** introduced per round (`avviaGara`, `usaSkip`).
- `mioId === null` means **local hot-seat mode** — it's the flag half the
  renderer branches on.
- `G.sim` (simultaneous bidding + 7 s timer) is on whenever `MODO !== "locale"`.
- `V` travels over PeerJS: snapshot fields must be plain, serialisable data.
- `salvaPartita` only saves in local mode, and the save has **no schema version**
  — add one before it holds anything valuable.
- Every user-facing string needs an `[it, en]` pair in `S` (`11-testi.js`); the
  language is an array index, so a third language means changing `t()`.
- `buttaTutto()` and `controllaVersione()` are defined **inside** the language-flag
  click handler in `42-avvio.js` (lines ~1498–1523 of the original). It works, but
  it's the odd corner of the file — don't refactor it by accident.
