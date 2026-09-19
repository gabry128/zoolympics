# -*- coding: utf-8 -*-
"""Rilegge CALIBRAZIONE.txt corretto a mano e adatta le doti degli animali.

Uso:
    python strumenti/tara-statistiche.py CALIBRAZIONE.txt           # prova e basta
    python strumenti/tara-statistiche.py CALIBRAZIONE.txt --scrivi  # applica

Come funziona, in breve. Ogni blocco che hai riordinato diventa un elenco di
vincoli "A deve stare sopra B". Le doti sono interi da 0 a 10 condivisi da
tutte le gare, quindi non si può accontentare un vincolo per volta: si cerca
il compromesso. L'obiettivo da minimizzare è

    quanto i vincoli sono violati  +  quanto le doti si allontanano da oggi

Il secondo termine serve a non stravolgere gli animali: senza, per far
vincere la lumaca basterebbe darle Velocità 10, e non è quello che vuoi.

Cosa NON fa: non tocca i pesi delle gare. Se due animali hanno le stesse doti
in tutto ciò che una gara premia, in quella gara sono pari e nessun valore di
dote li separa — lo script lo dice invece di fingere.
"""
import io, json, re, sys, random

# A deve stare sopra B, ma un pari merito va bene: chiedere un distacco
# minimo faceva risultare violate decine di coppie gia' a pari che nessuno
# aveva chiesto di separare.
# Due margini diversi, ed e' la differenza fra "lascia com'e'" e "cambia".
# Se nell'ordine di partenza A stava gia' sopra B, basta che non scenda: un
# pari merito va bene. Se invece li hai invertiti tu, allora un pari non
# basta - volevi un sorpasso vero - e si pretende un distacco.
MARGINE_TIENE = 0.0
MARGINE_INVERTE = 0.05
# Stare dalla parte sbagliata costa una penalita' fissa, oltre alla distanza:
# senza, un sorpasso mancato per un decimo valeva meno del punto di dote che
# serviva a sistemarlo, e l'ottimizzatore lasciava tutto com'era - a ragione.
PENALITA    = 0.8
# Lo scostamento costa al QUADRATO, non in proporzione: un punto costa 0,10,
# nove punti ne costano 8,1 e non 0,90. Con il costo lineare l'ottimizzatore
# dava Velocita' 10 alla tartaruga per farla vincere in acqua - il conto
# tornava, il gioco no. E comunque una dote non si sposta oltre MAX_SPOSTA:
# se una classifica non si ottiene senza stravolgere un animale, preferisco
# dirtelo che ottenerla.
COSTO_DRIFT = 0.10 # per punto di scostamento, al quadrato
MAX_SPOSTA  = 3    # di quanti punti al massimo puo' muoversi una dote
COSTO_POOL  = 6.0  # quanto costa far entrare o uscire un animale da una gara
GIRI        = 250000
T0, T1      = 0.60, 0.004   # temperatura iniziale e finale del raffreddamento
random.seed(12)

K10 = ['alt','frz','vel','agi','man','res','ter','acq','vol','mas']
K5  = ['pre','equ','cor','int','rif']
K   = K10 + K5
NOME = {'alt':'Altezza','frz':'Forza','vel':'Velocita','agi':'Agilita','man':'Presa',
        'res':'Fiato','ter':'Terra','acq':'Acqua','vol':'Volo','mas':'Stazza',
        'pre':'Precisione','equ':'Equilibrio','cor':'Coraggio','int':'Intelligenza','rif':'Riflessi'}

# ─── il gioco ───
SORG = io.open('src/10-dati.js', encoding='utf-8').read()
ANIMALI, ORDINE_FILE = {}, []
for ln in SORG.split('\n'):
    t = ln.strip()
    if t.startswith('["') and t.endswith('],'):
        id_, it, en, emoji, stat = json.loads('[' + t[:-1] + ']')[0]
        ANIMALI[id_] = {'id': id_, 'it': it, 'en': en, 'emoji': emoji,
                        'd': dict(zip(K, stat))}
        ORDINE_FILE.append(id_)
PER_NOME = {a['it'].lower(): i for i, a in ANIMALI.items()}

nomi_it = {m.group(1): m.group(2) for m in re.finditer(r'\n  (\w+):\["([^"]*)"', SORG)}
GARE = {}
for m in re.finditer(r'\{id:"(\w+)",size:(\d+),emoji:"([^"]*)",gruppo:"(\w+)",req:(\{[^}]*\}),pesi:(\{[^}]*\})', SORG):
    GARE[m.group(1)] = {'id': m.group(1), 'nome': nomi_it.get(m.group(1), m.group(1)),
                        'req': json.loads(m.group(5)), 'pesi': json.loads(m.group(6))}


def fit(d, pesi):
    lo = hi = raw = 0
    for k, w in pesi.items():
        raw += w * d.get(k, 0)
        if w < 0: lo += w * 10
        else:     hi += w * 10
    return 5.0 if hi == lo else max(0.0, min(10.0, 10 * (raw - lo) / (hi - lo)))


def ammesso(d, req):
    return all(d[k] >= v for k, v in req.items())


# ─── il file corretto ───
def leggi(percorso):
    """-> {id_gara: [id_animale, ...]} nell'ordine scritto nel file."""
    blocchi, corrente, ignoti = {}, None, []
    for n, riga in enumerate(io.open(percorso, encoding='utf-8'), 1):
        r = riga.strip()
        if r.startswith('==='):
            m = re.match(r'===\s*(\w+)', r)
            corrente = m.group(1) if m else None
            if corrente: blocchi[corrente] = []
            continue
        if not r or r.startswith('#') or corrente is None:
            continue
        # "  3. ghepardo   🐆 Ghepardo   8.8"  oppure solo "ghepardo".
        # L'id si prende con un'espressione e non spezzando sugli spazi: un id
        # lungo quanto la colonna resterebbe incollato all'emoji.
        m = re.match(r'^\s*(?:\d+\.\s*)?([A-Za-z][A-Za-z0-9_]*)', r)
        if not m: continue
        chiave = m.group(1).lower()
        aid = chiave if chiave in ANIMALI else PER_NOME.get(chiave)
        if aid is None:
            ignoti.append((n, m.group(1))); continue
        blocchi[corrente].append(aid)
    return blocchi, ignoti


if len(sys.argv) < 2:
    sys.exit(__doc__)
percorso = sys.argv[1]
scrivi = '--scrivi' in sys.argv

corretto, ignoti = leggi(percorso)
if ignoti:
    print('Righe che non ho riconosciuto (le salto):')
    for n, x in ignoti[:12]:
        print(f'  riga {n}: {x!r}')
    print()

# l'originale, ricostruito dal gioco: serve per capire cosa hai cambiato
def classifica_attuale(g, quanti=15):
    dentro = [a for a in ANIMALI.values() if ammesso(a['d'], g['req'])]
    return [a['id'] for a in sorted(dentro, key=lambda a: -fit(a['d'], g['pesi']))[:quanti]]

VINCOLI, cambiate, impossibili = [], [], []
for gid, elenco in corretto.items():
    g = GARE.get(gid)
    if not g:
        print(f'gara sconosciuta nel file: {gid}'); continue
    originale = classifica_attuale(g, len(elenco))
    if elenco == originale:
        continue                       # blocco non toccato: nessun vincolo
    cambiate.append(gid)
    fuori = [a for a in elenco if not ammesso(ANIMALI[a]['d'], g['req'])]
    for a in fuori:
        print(f"  nota: {ANIMALI[a]['it']} non supera l'accesso di {g['nome']} "
              f"({' e '.join(f'{NOME[k]}>={v}' for k,v in g['req'].items())})")
    # Quali coppie diventano vincoli. Prenderle TUTTE, su una gara da 79
    # animali, farebbe 3081 vincoli per gara: l'ottimizzatore non finirebbe.
    # Bastano le coppie vicine, che incatenano l'ordine per transitivita',
    # piu' tutte quelle che hai davvero invertito, che sono la tua richiesta.
    pos0 = {a: n for n, a in enumerate(originale)}
    coppie = set()
    for n in range(len(elenco) - 1):
        coppie.add((elenco[n], elenco[n + 1], MARGINE_TIENE))
    for n in range(len(elenco)):
        for j in range(n + 1, len(elenco)):
            A, B = elenco[n], elenco[j]
            if pos0.get(A, 10**6) > pos0.get(B, 10**6):
                coppie.discard((A, B, MARGINE_TIENE))
                coppie.add((A, B, MARGINE_INVERTE))
    for A, B, m in sorted(coppie):
        dA, dB = ANIMALI[A]['d'], ANIMALI[B]['d']
        if all(dA[k] == dB[k] for k in g['pesi']):
            impossibili.append((g['nome'], ANIMALI[A]['it'], ANIMALI[B]['it']))
            continue
        VINCOLI.append((A, B, gid, m))

print(f"gare corrette: {len(cambiate)}  {cambiate if cambiate else ''}")
inv = sum(1 for v in VINCOLI if v[3] == MARGINE_INVERTE)
print(f"vincoli 'A sopra B': {len(VINCOLI)}  ({inv} da sorpassi che hai chiesto tu, "
      f"{len(VINCOLI)-inv} per tenere l'ordine intorno)")
if impossibili:
    print(f"coppie inseparabili (doti identiche in cio' che la gara premia): {len(impossibili)}")
    for n, a, b in impossibili[:6]:
        print(f'   {n}: {a} e {b}')
if not VINCOLI:
    print('\nNiente da tarare: nessun blocco risulta modificato.')
    sys.exit(0)

# ─── ottimizzazione ───
D = {i: dict(a['d']) for i, a in ANIMALI.items()}
D0 = {i: dict(a['d']) for i, a in ANIMALI.items()}
# gare in cui ogni animale compare fra i vincoli: le uniche che vanno ricontrollate
GARE_DI = {}
for A, B, gid, _ in VINCOLI:
    GARE_DI.setdefault(A, set()).add(gid)
    GARE_DI.setdefault(B, set()).add(gid)
TOCCABILI = sorted(GARE_DI)
# quali doti hanno un effetto: solo quelle pesate o richieste dalle gare coinvolte
DOTI_DI = {}
for i in TOCCABILI:
    ks = set()
    for gid in GARE_DI[i]:
        ks |= set(GARE[gid]['pesi']) | set(GARE[gid]['req'])
    DOTI_DI[i] = sorted(ks)

POOL0 = {gid: {i for i in ANIMALI if ammesso(D0[i], GARE[gid]['req'])} for gid in GARE}

# Il costo si calcola per differenza e non da capo: rifarlo tutto a ogni
# tentativo voleva dire 94 animali per 27 gare per sessantamila giri, e il
# conto non finiva piu'. Cambiare una dote tocca solo i vincoli di
# quell'animale e le gare il cui accesso dipende da quella dote.

# i vincoli che toccano ogni animale, per non riguardare gli altri
VINCOLI_DI = {}
for n, (A, B, gid, _) in enumerate(VINCOLI):
    VINCOLI_DI.setdefault(A, []).append(n)
    VINCOLI_DI.setdefault(B, []).append(n)
# le gare il cui accesso dipende da una certa dote
GARE_PER_DOTE = {}
for gid, g in GARE.items():
    for k in g['req']:
        GARE_PER_DOTE.setdefault(k, []).append(gid)


def costo_vincolo(n):
    A, B, gid, m = VINCOLI[n]
    p = GARE[gid]['pesi']
    d = fit(D[A], p) - fit(D[B], p)
    return (PENALITA + m - d) if d < m else 0.0


def costo_pool(i, k):
    """quanto costa, per l'animale i, essere dentro o fuori dalle gare il cui
    accesso dipende dalla dote k, rispetto a com'era all'inizio"""
    c = 0.0
    for gid in GARE_PER_DOTE.get(k, ()):
        if ammesso(D[i], GARE[gid]['req']) != (i in POOL0[gid]):
            c += COSTO_POOL
    return c


def costo_locale(i, k):
    c = COSTO_DRIFT * (D[i][k] - D0[i][k]) ** 2 + costo_pool(i, k)
    for n in VINCOLI_DI.get(i, ()):
        c += costo_vincolo(n)
    return c


def violati():
    return sum(1 for n in range(len(VINCOLI)) if costo_vincolo(n) > 0)


def costo_totale():
    c = sum(costo_vincolo(n) for n in range(len(VINCOLI)))
    for i in TOCCABILI:
        for k in DOTI_DI[i]:
            c += COSTO_DRIFT * (D[i][k] - D0[i][k]) ** 2
    for gid in GARE:
        dentro = {i for i in ANIMALI if ammesso(D[i], GARE[gid]['req'])}
        c += COSTO_POOL * len(dentro ^ POOL0[gid])
    return c


print()
print(f'prima : {violati()}/{len(VINCOLI)} vincoli violati, costo {costo_totale():.1f}')
# Ricerca con raffreddamento: accettare ogni tanto un peggioramento serve a
# uscire dai minimi locali. Salire di un punto costa subito, e rende solo
# dopo che anche un'altra dote si e' mossa: accettando solo i miglioramenti
# immediati la ricerca non partiva nemmeno.
import math
accettate = 0
c = costo_totale()
# il costo totale si aggiorna per differenza: una mossa cambia solo i termini
# locali, quindi la variazione locale E' la variazione globale
costo_migliore = c
migliore = {i: dict(D[i]) for i in TOCCABILI}
for giro in range(GIRI):
    T = T0 * (T1 / T0) ** (giro / GIRI)
    i = random.choice(TOCCABILI)
    k = random.choice(DOTI_DI[i])
    nuovo_v = D[i][k] + random.choice((-1, 1))
    if not (0 <= nuovo_v <= 10) or abs(nuovo_v - D0[i][k]) > MAX_SPOSTA:
        continue
    prima = costo_locale(i, k)
    vecchio = D[i][k]
    D[i][k] = nuovo_v
    delta = costo_locale(i, k) - prima
    if delta <= 0 or random.random() < math.exp(-delta / T):
        accettate += 1
        c += delta
        if c < costo_migliore - 1e-9:
            costo_migliore = c
            migliore = {x: dict(D[x]) for x in TOCCABILI}
    else:
        D[i][k] = vecchio
for x in TOCCABILI:          # si tiene il migliore visto, non l'ultimo
    D[x] = migliore[x]
print(f'dopo  : {violati()}/{len(VINCOLI)} vincoli violati, costo {costo_totale():.1f}'
      f'  ({accettate} mosse accettate su {GIRI})')

mosse = [(i, k, D0[i][k], D[i][k]) for i in TOCCABILI for k in DOTI_DI[i] if D[i][k] != D0[i][k]]
print(f'\ndoti cambiate: {len(mosse)}')
for i, k, v0, v1 in sorted(mosse, key=lambda x: ANIMALI[x[0]]['it']):
    print(f"  {ANIMALI[i]['it']:<14}{NOME[k]:<14}{v0} -> {v1}")

restano = [(ANIMALI[A]['it'], ANIMALI[B]['it'], GARE[gid]['nome'])
           for A, B, gid, m in VINCOLI
           if fit(D[A], GARE[gid]['pesi']) - fit(D[B], GARE[gid]['pesi']) < m]
if restano:
    print(f'\nvincoli che NON sono riuscito a soddisfare: {len(restano)}')
    for a, b, n in restano[:15]:
        print(f'  in {n}: {a} dovrebbe stare sopra {b}')
    print('  (di solito vuol dire che due gare chiedono l\'opposto sulla stessa dote,')
    print('   oppure che servirebbe cambiare i pesi della gara e non le doti)')

if not scrivi:
    print('\nprova soltanto. Rilancia con --scrivi per applicare a src/10-dati.js')
    sys.exit(0)

fuori, n = [], 0
for ln in SORG.split('\n'):
    t = ln.strip()
    if t.startswith('["') and t.endswith('],'):
        id_, it, en, emoji, _ = json.loads('[' + t[:-1] + ']')[0]
        vals = ','.join(str(D[id_][k]) for k in K)
        fuori.append(f'["{id_}","{it}","{en}","{emoji}",[{vals}]],'); n += 1
    else:
        fuori.append(ln)
io.open('src/10-dati.js', 'w', encoding='utf-8', newline='').write('\n'.join(fuori))
print(f'\nscritto: {n} righe di ANIMALI aggiornate in src/10-dati.js')
print('ricorda: python build.py, e ricontrolla le classifiche')
