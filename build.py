#!/usr/bin/env python3
"""
Zoolympics — build.
Rimette insieme i pezzi di src/ e vendor/ in un unico dist/index.html,
identico byte per byte a quello che si mette online.
Uso:  python3 build.py
"""
import pathlib, sys

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

pezzi = []
for tipo, cosa in ORDINE:
    if tipo == "r":
        pezzi.append(cosa)
    else:
        p = BASE / cosa
        if not p.exists():
            sys.exit(f"manca {cosa}")
        pezzi.append(p.read_text(encoding="utf-8"))

fuori = BASE / "dist"
fuori.mkdir(exist_ok=True)
uscita = fuori / "index.html"
uscita.write_text("\n".join(pezzi), encoding="utf-8")
print(f"dist/index.html · {uscita.stat().st_size} byte")
