# Domande aperte — portare le proposte dentro al gioco

Oggi il gioco online ha **88 animali e 14 gare**. Nelle tabelle ce ne sono
**97 e 33**: la differenza sono 9 animali e 19 gare che esistono solo come
proposta. Per farli entrare servono decisioni che il codice non può prendere
da solo.

**Come rispondere:** a voce libera, citando il numero. Dove c'è scritto
*Proposta mia*, ti basta dire "ok" e procedo così. Se una domanda non ti
interessa, dillo e scelgo io il default.

---

## A — Quali delle 19 gare tengo

Non è detto che servano tutte. Passare da 14 a 33 gare raddoppia abbondantemente
la scelta a inizio round, e alcune si somigliano molto fra loro (badminton e
tennistavolo premiano quasi le stesse doti del tennis; pattinaggio artistico e
ginnastica hanno pesi identici, `Agilità 4 · Equilibrio 4`).

Nella colonna *chi vince* c'è l'animale con il voto più alto: serve a capire
se la gara ha un carattere suo o se ripete uno già visto.

### Estive (9)

| # | gara | premia | ammessi | chi vince |
|---|---|---|---|---|
| 1 | Ciclismo a squadre | Fiato 4 · Velocità 3 | 69 | Drago 9,1 |
| 2 | Ginnastica a squadre | Agilità 4 · Equilibrio 4 | 77 | Gibbone 10,0 |
| 3 | Equitazione a squadre | Equilibrio 4 · Velocità 2 · Intelligenza 2 | 69 | Drago 9,8 |
| 4 | Tiro con l'arco | Precisione 5 · Equilibrio 2 | 32 | Drago 10,0 |
| 5 | Sollevamento pesi | Forza 5 · Stazza 3 | 77 | Elefante 10,0 |
| 6 | Judo a squadre | Forza 3 · Agilità 3 · Intelligenza 2 | 32 | Drago 8,9 |
| 7 | Taekwondo a squadre | Agilità 4 · Riflessi 3 · Velocità 2 | 77 | Gibbone 9,6 |
| 8 | Badminton doppio | Riflessi 4 · Agilità 3 | 32 | Gibbone 9,8 |
| 9 | Tennistavolo doppio | Riflessi 5 · Precisione 3 | 32 | Drago 10,0 |

### Invernali (10)

| # | gara | premia | ammessi | chi vince |
|---|---|---|---|---|
| 10 | Salto con gli sci | Coraggio 4 · Equilibrio 3 · Stazza −1 | 77 | Drago 8,9 |
| 11 | Slittino a squadre | Coraggio 4 · Stazza 2 · Equilibrio 2 | 77 | Drago 9,8 |
| 12 | Pattinaggio artistico | Agilità 4 · Equilibrio 4 | 77 | Gibbone 10,0 |
| 13 | Pattinaggio di velocità | Velocità 4 · Equilibrio 3 | 77 | Leopardo 9,6 |
| 14 | Sci di fondo | Fiato 5 · Velocità 1 | 69 | Cammello 9,2 |
| 15 | Snowboard a squadre | Equilibrio 4 · Agilità 3 · Coraggio 2 | 77 | Gibbone 9,1 |
| 16 | Discesa libera | Velocità 4 · Coraggio 3 · Equilibrio 2 | 77 | Drago 9,6 |
| 17 | Slalom speciale | Agilità 4 · Riflessi 3 | 77 | Gibbone 10,0 |
| 18 | Biathlon a squadre | Fiato 4 · Precisione 4 | 69 | Drago 9,5 |
| 19 | Combinata nordica | Fiato 4 · Velocità 3 | 77 | Drago 9,1 |

**Domanda 1.** Quali tengo? Puoi dire "tutte", oppure i numeri da togliere,
oppure "solo le invernali".

*Proposta mia: ne toglierei 4 perché doppiano gare già esistenti —* **2
Ginnastica** *(identica al 12 Pattinaggio artistico),* **9 Tennistavolo** *e*
**8 Badminton** *(troppo vicine al tennis),* **19 Combinata nordica**
*(identica all'1 Ciclismo nei pesi). Restano 15 gare, per un totale di 29.*

---

## B — Come configuro quelle che restano

Ogni gara nel gioco ha bisogno di tre cose che la tabella non ha: quanti
animali per squadra, in che arena si svolge, e se ha un'intesa di squadra.

**Domanda 2.** Va bene questa configurazione?

| gara | squadra | arena | intesa proposta |
|---|---|---|---|
| Ciclismo | 4 | savana | somiglianza su Fiato — il gruppo va come il più lento |
| Ginnastica | 4 | giungla | somiglianza su Agilità |
| Equitazione | 3 | savana | nessuna |
| Tiro con l'arco | 3 | paleolitico | nessuna |
| Sollevamento pesi | 3 | paleolitico | nessuna |
| Judo | 2 | paleolitico | nessuna |
| Taekwondo | 2 | paleolitico | nessuna |
| Badminton | 2 | giungla | somiglianza su Riflessi |
| Tennistavolo | 2 | giungla | nessuna |
| Salto con gli sci | 4 | ghiacciaio | ruoli su Stazza — servono pochi pesanti |
| Slittino | 2 | ghiacciaio | ruoli su Stazza — metà pesanti |
| Pattinaggio artistico | 2 | ghiacciaio | somiglianza su Equilibrio |
| Pattinaggio di velocità | 3 | ghiacciaio | nessuna |
| Sci di fondo | 4 | ghiacciaio | somiglianza su Fiato |
| Snowboard | 3 | ghiacciaio | nessuna |
| Discesa libera | 3 | ghiacciaio | nessuna |
| Slalom speciale | 4 | ghiacciaio | nessuna |
| Biathlon | 4 | ghiacciaio | somiglianza su Precisione |
| Combinata nordica | 3 | ghiacciaio | nessuna |

**Domanda 3.** Le 10 invernali finirebbero tutte nell'arena `ghiacciaio`, che
oggi ospita solo il bob. Un terzo delle gare avrebbe lo stesso sfondo.
Preferisci:

- **a)** va bene così, tutte ghiacciaio;
- **b)** aggiungo un'arena nuova (per esempio `montagna`, toni di roccia e
  pino) e ci metto sci di fondo, discesa, slalom, snowboard e salto,
  lasciando al `ghiacciaio` pattinaggio, slittino, biathlon e bob;
- **c)** altro.

*Proposta mia: la b. Serve una palette nuova in `02-stile.css`, sono sei righe.*

**Domanda 4.** Nomi e descrizioni in inglese: li scrivo io seguendo il tono
delle gare esistenti — "Aerial slalom / Flyers only", "Water relay / Aquatic
animals only" — oppure li vuoi scrivere tu? Ogni gara ha bisogno della coppia
`[it, en]` più una descrizione breve per entrambe.

*Proposta mia: li scrivo io e me li fai correggere dopo.*

---

## C — I 9 animali proposti

Leopardo, Pantera, Iena, Gazzella, Antilope, Bufalo, Bue, Asino, Mulo.

Il problema è che sono quasi-doppioni di animali già in gioco. In valori:
Pantera contro Leopardo differisce di 1 punto su due doti; Gazzella contro
Antilope idem; Bufalo contro Bisonte di 1; Bue contro Toro; Iena contro Lupo.
E quattro non hanno nemmeno un'emoji propria: Gazzella e Antilope userebbero
🦌 come il Cervo, Bue 🐂 come il Toro, Leopardo 🐆 come il Ghepardo, Iena 🐺
come il Lupo.

**Domanda 5.** Cosa ne faccio?

- **a)** entrano tutti e nove;
- **b)** entrano solo quelli che portano qualcosa di diverso;
- **c)** non entra nessuno, resta il gioco a 88 animali;
- **d)** entrano ma con valori rifatti, perché siano davvero diversi dai
  parenti (per esempio la Iena con Intelligenza alta e Fiato altissimo, il
  Mulo con Fiato e Stazza da bestia da soma, la Gazzella velocissima e
  fragile).

*Proposta mia: la d per Iena, Gazzella e Mulo, che hanno un carattere loro da
dare; la c per gli altri sei, che non aggiungono niente. Ma è una scelta di
gusto, non tecnica: se ti piace avere tanti animali, la a va benissimo e non
rompe nulla.*

**Domanda 6.** Se ne entra qualcuno, le emoji doppie ti danno fastidio?
Nel gioco l'animale si riconosce dall'emoji nella rosa, e due 🦌 diversi
confondono.

---

## D — La schermata di scelta della gara

Oggi a inizio round il gioco mostra **tutte** le gare disponibili come
bottoni: con 14 gare ne vedi una dozzina, con 29 o 33 ne vedresti una trentina.
Diventa un muro.

**Domanda 7.** Come la sistemo?

- **a)** ne mostro solo alcune a caso — per esempio 4 o 5 — e chi sceglie
  sceglie fra quelle;
- **b)** le mostro tutte ma divise per gruppo (estive / invernali) con due
  colonne o due schede;
- **c)** lascio tutto com'è, un muro di bottoni;
- **d)** altro.

*Proposta mia: la a con 5 opzioni. Rende anche la scelta più interessante —
adesso chi sceglie ha tutto il catalogo davanti e prende sempre la gara che
gli conviene. Il numero lo metto fra le impostazioni dell'host, così lo cambi
senza toccare il codice.*

**Domanda 8.** Il gioco evita di ripetere una gara già giocata, e solo quando
le ha esaurite ricomincia. Con 29 gare e partite da 5-7 round, la ripetizione
non capiterà quasi mai. Va bene, o preferisci che ogni partita peschi da un
sottoinsieme più ristretto perché si ripresentino?

---

## E — Tre dettagli che ho incontrato strada facendo

**Domanda 9.** **Riccio, Dodo e Lumaca non entrano in nessuna gara.** Hanno
valori troppo bassi e il filtro del pool li scarta sempre. Possono comparire
solo dalla via d'emergenza quando la riserva si esaurisce. Li lascio così —
sono una gag — oppure gli do un posto da qualche parte?

*Proposta mia: lasciarli. Il Dodo che non gareggia mai è divertente. Ma se
vuoi, una gara lenta (una "gara di resistenza" dove vince chi ha Fiato e non
Velocità) darebbe alla Lumaca il suo momento.*

**Domanda 10.** **Il drago esce nel 12% dei casi.** Ti sembra la dose giusta,
o lo vuoi ancora più raro? E vuoi che altri animali diventino rari — T-Rex,
Mammut, Unicorno? Oggi la rarità vale solo per il drago.

**Domanda 11.** **Il ranking comunitario**: lo lascio com'è, cioè struttura
pronta e spenta, o vuoi che diventi qualcosa di usabile? Se sì, il punto vero
non è il codice ma dove tenere i voti: oggi il gioco non ha un server, e i
voti resterebbero sul telefono di chi vota. Per farlo davvero "di comunità"
serve un servizio esterno — è una decisione con un costo, non una riga di
codice.

---

## F — Una cosa che chiedo io

**Domanda 12.** Quando avrò fatto tutto questo, i punteggi cambieranno di
nuovo, e parecchio. Vuoi che prima ti mostri il confronto prima/dopo come
l'ultima volta, così lo approvi, oppure procedo e guardi il risultato finito?
