#!/usr/bin/env python3
"""
Zoolympics — build.
Rimette insieme i pezzi di src/ e vendor/ in un unico docs/index.html,
il file che si mette online.

Alza da solo BUILD in src/20-base.js: stesso giorno → lettera successiva,
giorno nuovo → "a". Lo stesso valore finisce in docs/versione.txt e in
sw.js, perche'
i due devono restare allineati: se divergono ogni client butta la cache e
ricarica.

Uso:  python3 build.py              # alza BUILD e ricostruisce
      python3 build.py --stessa     # ricostruisce lasciando BUILD com'e'
"""
import datetime, pathlib, re, shutil, sys

BASE = pathlib.Path(__file__).parent
ORDINE = [
    ("f", "src/01-testa.html"),
    ("r", "<style>"),
    ("f", "src/02-stile.css"),
    ("r", "</style>"),
    ("f", "src/03-corpo.html"),
    ("r", "<script>/* PeerJS 1.5.4 — MIT */"),
    ("f", "vendor/peerjs.js"),
    ("r", "</script>"),
    ("r", "<script>"),
    ("f", "src/10-dati.js"),
    ("f", "src/11-testi.js"),
    ("f", "src/20-base.js"),
    ("f", "src/21-punteggi.js"),
    ("f", "src/22-stato.js"),
    ("f", "src/23-ai.js"),
    ("f", "src/24-comunita.js"),
    ("f", "src/30-rete.js"),
    ("f", "src/31-lobby.js"),
    ("f", "src/32-partita.js"),
    ("f", "src/33-asta.js"),
    ("f", "src/40-disegno.js"),
    ("f", "src/41-info.js"),
    ("f", "src/42-avvio.js"),
    ("r", "</script>"),
    ("f", "src/04-coda.html"),
]

# GitHub Pages, servendo da un branch, pubblica solo dalla radice o da
# /docs: la cartella di uscita si chiama docs/ per questo.
USCITA = "docs"
SORGENTE_BUILD = "src/20-base.js"
# Altri file che portano lo stesso BUILD e vanno tenuti allineati. sw.js
# deve cambiare byte a ogni rilascio, altrimenti il browser non si accorge
# che c'e' un service worker nuovo.
SEGUONO_BUILD = ["src/sw.js"]
# Copiati in USCITA cosi' come sono, dopo il timbro del BUILD.
DA_COPIARE = ["src/sw.js"]
# Il manifest e le icone: non li tocca nessuno, ma stanno nel sorgente e non
# solo in USCITA, cosi' quella cartella e' interamente rigenerabile e si puo'
# buttare senza perdere niente.
STATICI = "statico"
RE_BUILD = re.compile(r'(const\s+BUILD\s*=\s*")(\d{4}-\d{2}-\d{2})([a-z]+)(")')


def leggi(p):
    """Legge senza tradurre le fini riga, cosi' riscrivere un file non le cambia."""
    with open(p, encoding="utf-8", newline="") as f:
        return f.read()


def scrivi(p, testo):
    """Scrive senza tradurre le fini riga: su Windows \n resterebbe \r\n e il
    build non sarebbe piu' identico a quello fatto altrove."""
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(testo)


def prossima_lettera(s):
    """a → b, z → aa, az → ba. Serve solo se in un giorno si fanno piu' di 26
    build, ma cosi' non c'e' un caso limite che rompe il confronto."""
    cifre = [ord(c) - 97 for c in s]
    i = len(cifre) - 1
    while i >= 0:
        cifre[i] += 1
        if cifre[i] < 26:
            break
        cifre[i] = 0
        i -= 1
    else:
        cifre.insert(0, 0)
    return "".join(chr(c + 97) for c in cifre)


def alza_build(alza):
    """Ritorna il BUILD da usare, riscrivendo src/20-base.js se serve."""
    p = BASE / SORGENTE_BUILD
    if not p.exists():
        sys.exit(f"manca {SORGENTE_BUILD}")
    testo = leggi(p)
    m = RE_BUILD.search(testo)
    if not m:
        sys.exit(f'in {SORGENTE_BUILD} non trovo const BUILD="AAAA-MM-GGx"')
    vecchio = m.group(2) + m.group(3)
    if not alza:
        return vecchio, False

    oggi = datetime.date.today().isoformat()
    # Se la data e' gia' oggi (o avanti, per un orologio sballato) si passa
    # alla lettera dopo, cosi' BUILD non torna mai indietro.
    if m.group(2) >= oggi:
        nuovo = m.group(2) + prossima_lettera(m.group(3))
    else:
        nuovo = oggi + "a"

    scrivi(p, testo[: m.start()] + m.group(1) + nuovo + m.group(4) + testo[m.end():])
    return nuovo, True


def allinea_seguaci(build):
    """Riscrive BUILD nei file che lo seguono. Gira anche con --stessa, cosi'
    se uno resta indietro il build dopo lo rimette in pari."""
    for nome in SEGUONO_BUILD:
        p = BASE / nome
        if not p.exists():
            sys.exit(f"manca {nome}")
        testo = leggi(p)
        m = RE_BUILD.search(testo)
        if not m:
            sys.exit(f'in {nome} non trovo const BUILD="AAAA-MM-GGx"')
        if m.group(2) + m.group(3) != build:
            scrivi(p, testo[: m.start()] + m.group(1) + build + m.group(4) + testo[m.end():])


def main():
    argomenti = sys.argv[1:]
    ignoti = [a for a in argomenti if a != "--stessa"]
    if ignoti:
        sys.exit(f"non conosco {' '.join(ignoti)} · uso: build.py [--stessa]")
    alza = "--stessa" not in argomenti

    build, alzato = alza_build(alza)
    allinea_seguaci(build)

    pezzi = []
    for tipo, cosa in ORDINE:
        if tipo == "r":
            pezzi.append(cosa)
        else:
            p = BASE / cosa
            if not p.exists():
                sys.exit(f"manca {cosa}")
            pezzi.append(leggi(p))

    fuori = BASE / USCITA
    fuori.mkdir(exist_ok=True)
    uscita = fuori / "index.html"
    scrivi(uscita, "\n".join(pezzi))
    scrivi(fuori / "versione.txt", build + "\n")
    for nome in DA_COPIARE:
        scrivi(fuori / pathlib.Path(nome).name, leggi(BASE / nome))
    # copyfile e non leggi/scrivi: quelle passano per UTF-8 e su un PNG
    # non funzionerebbero.
    statici = sorted(f for f in (BASE / STATICI).iterdir() if f.is_file())
    for f in statici:
        shutil.copyfile(f, fuori / f.name)

    print(f"BUILD {build}{'' if alzato else ' (invariato)'}")
    print(f"{USCITA}/index.html · {uscita.stat().st_size} byte")
    print(f"{USCITA}/versione.txt allineato")
    for nome in DA_COPIARE:
        print(f"{USCITA}/{pathlib.Path(nome).name} aggiornato")
    print(f"{len(statici)} file da {STATICI}/ copiati")


main()
