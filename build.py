#!/usr/bin/env python3
"""
Zoolympics — build.
Rimette insieme i pezzi di src/ e vendor/ in un unico dist/index.html,
il file che si mette online.

Alza da solo BUILD in src/20-base.js: stesso giorno → lettera successiva,
giorno nuovo → "a". Lo stesso valore finisce in dist/versione.txt, perche'
i due devono restare allineati: se divergono ogni client butta la cache e
ricarica.

Uso:  python3 build.py              # alza BUILD e ricostruisce
      python3 build.py --stessa     # ricostruisce lasciando BUILD com'e'
"""
import datetime, pathlib, re, sys

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

SORGENTE_BUILD = "src/20-base.js"
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


def main():
    argomenti = sys.argv[1:]
    ignoti = [a for a in argomenti if a != "--stessa"]
    if ignoti:
        sys.exit(f"non conosco {' '.join(ignoti)} · uso: build.py [--stessa]")
    alza = "--stessa" not in argomenti

    build, alzato = alza_build(alza)

    pezzi = []
    for tipo, cosa in ORDINE:
        if tipo == "r":
            pezzi.append(cosa)
        else:
            p = BASE / cosa
            if not p.exists():
                sys.exit(f"manca {cosa}")
            pezzi.append(leggi(p))

    fuori = BASE / "dist"
    fuori.mkdir(exist_ok=True)
    uscita = fuori / "index.html"
    scrivi(uscita, "\n".join(pezzi))
    scrivi(fuori / "versione.txt", build + "\n")

    print(f"BUILD {build}{'' if alzato else ' (invariato)'}")
    print(f"dist/index.html · {uscita.stat().st_size} byte")
    print("dist/versione.txt allineato")


main()
