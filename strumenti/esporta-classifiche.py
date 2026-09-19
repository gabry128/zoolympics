# -*- coding: utf-8 -*-
"""Esporta CALIBRAZIONE.txt: la classifica attuale di ogni gara, da correggere a mano.

Il formato è fatto per essere modificato con un editor qualunque: una riga
per animale, in ordine di classifica. Si riordinano le righe e basta.

Poi `strumenti/tara-statistiche.py` rilegge il file, confronta con questa
versione originale e adatta le doti degli animali perché la classifica
somigli a quella che hai scritto.
"""
import io, json, re, sys

QUANTI = None   # None = la classifica intera di ogni gara

K10 = ['alt','frz','vel','agi','man','res','ter','acq','vol','mas']
K5  = ['pre','equ','cor','int','rif']
K   = K10 + K5
NOME = {'alt':'Altezza','frz':'Forza','vel':'Velocita','agi':'Agilita','man':'Presa',
        'res':'Fiato','ter':'Terra','acq':'Acqua','vol':'Volo','mas':'Stazza',
        'pre':'Precisione','equ':'Equilibrio','cor':'Coraggio','int':'Intelligenza','rif':'Riflessi'}

sorgente = io.open('src/10-dati.js', encoding='utf-8').read()

ANIMALI = {}
for ln in sorgente.split('\n'):
    t = ln.strip()
    if t.startswith('["') and t.endswith('],'):
        id_, it, en, emoji, stat = json.loads('[' + t[:-1] + ']')[0]
        a = {'id': id_, 'it': it, 'emoji': emoji}
        a.update(dict(zip(K, stat)))
        ANIMALI[id_] = a

nomi_it = {m.group(1): m.group(2) for m in re.finditer(r'\n  (\w+):\["([^"]*)"', sorgente)}
GARE = []
pat = re.compile(r'\{id:"(\w+)",size:(\d+),emoji:"([^"]*)",gruppo:"(\w+)",req:(\{[^}]*\}),pesi:(\{[^}]*\})')
for m in pat.finditer(sorgente):
    GARE.append({'id': m.group(1), 'size': int(m.group(2)), 'emoji': m.group(3),
                 'gruppo': m.group(4), 'nome': nomi_it.get(m.group(1), m.group(1)),
                 'req': json.loads(m.group(5)), 'pesi': json.loads(m.group(6))})
if not GARE:
    sys.exit('nessuna gara letta da src/10-dati.js')


def fit(a, pesi):
    """La stessa formula di 21-punteggi.js."""
    lo = hi = raw = 0
    for k, w in pesi.items():
        raw += w * a.get(k, 0)
        if w < 0: lo += w * 10
        else:     hi += w * 10
    return 5.0 if hi == lo else max(0.0, min(10.0, 10 * (raw - lo) / (hi - lo)))


def pool(g):
    """Chi puo' entrare: il requisito d'accesso, senza il filtro sul fit che
    costruisciPool applica in partita (quello dipende da quanti giocano)."""
    return [a for a in ANIMALI.values() if all(a[k] >= v for k, v in g['req'].items())]


righe = ["""# ─────────────────────────────────────────────────────────────────────
# CALIBRAZIONE DELLE CLASSIFICHE
#
# Per ogni gara c'è la classifica INTERA che il gioco produce OGGI, dalla
# migliore alla peggiore. Correggila: sposta le righe nell'ordine che secondo
# te è giusto. Poi la rimando indietro e adatto le doti degli animali perché
# il gioco produca quell'ordine.
#
# COME SI MODIFICA
#   · Riordina le righe dentro un blocco. Conta solo l'ordine.
#   · Il numero a destra è il voto attuale: lo ignoro quando rileggo, serve
#     solo a te per vedere quanto sono distanti fra loro.
#   · Puoi cancellare una riga: vuol dire "non mi interessa dove sta".
#   · Puoi aggiungere una riga scrivendo il nome di un animale: se supera il
#     requisito d'accesso lo metto dove l'hai messo, altrimenti te lo dico.
#   · NON toccare le righe che cominciano con === o con #.
#
# I BLOCCHI CHE NON TOCCHI NON CONTANO. Confronto con l'originale e prendo
# vincoli solo dalle gare che hai davvero cambiato: puoi correggerne tre e
# lasciare stare le altre ventiquattro.
#
# COSA SO FARE E COSA NO
#   Le doti sono numeri interi da 0 a 10 condivisi da tutte le gare: alzare
#   la Velocità di un animale per sistemare la staffetta lo sposta anche nel
#   calcetto e nella discesa. Quindi cercherò il compromesso che rispetta più
#   vincoli possibile restando vicino ai valori di adesso, e ti dirò
#   esattamente quali richieste non sono riuscito a soddisfare e perché.
#   Due animali con doti identiche nelle voci che una gara premia non si
#   possono separare in quella gara: si separano solo cambiando i pesi.
# ─────────────────────────────────────────────────────────────────────
"""]

for g in GARE:
    dentro = pool(g)
    ord_ = sorted(dentro, key=lambda a: -fit(a, g['pesi']))
    if QUANTI: ord_ = ord_[:QUANTI]
    premia = ', '.join((f'{NOME[k]} x{w}' if w > 0 else f'{NOME[k]} penalizza {w}')
                       for k, w in g['pesi'].items())
    accesso = ' e '.join(f'{NOME[k]}>={v}' for k, v in g['req'].items())
    righe.append(f"=== {g['id']} · {g['emoji']} {g['nome']} ===")
    righe.append(f"#   accesso: {accesso}")
    righe.append(f"#   premia : {premia}")
    quanti = 'tutti e %d' % len(ord_) if len(ord_) == len(dentro) else 'qui i primi %d' % len(ord_)
    righe.append(f"#   {len(dentro)} ammessi, {quanti}. Squadra da {g['size']}.")
    for i, a in enumerate(ord_, 1):
        # lo spazio dopo l'id e' obbligatorio: "pescetropicale" riempie la
        # colonna e senza resterebbe incollato all'emoji
        righe.append(f"{i:>3}. {a['id']:<15} {a['emoji']} {a['it']:<18}{fit(a, g['pesi']):>5.1f}")
    righe.append("")

io.open('CALIBRAZIONE.txt', 'w', encoding='utf-8', newline='\n').write('\n'.join(righe) + '\n')
print(f"CALIBRAZIONE.txt: {len(GARE)} gare, classifica " + ("intera" if not QUANTI else f"ai primi {QUANTI}"))
print(f"  {sum(1 for r in righe if r and r[0].isdigit() or r[:4].strip().rstrip('.').isdigit())} righe da riordinare")
