# -*- coding: utf-8 -*-
"""Ricostruisce animali-proposta.csv e gare-regole.csv dal gioco.

Unica fonte: src/10-dati.js. Animali, gare, accessi, premi e sinergie si
leggono da li' e non si riscrivono a mano. Prima c'era anche un file di
proposte esterne: ora le proposte sono entrate nel gioco e non serve piu'.

Le due tabelle servono a rivedere i numeri a colpo d'occhio, e a dare i
dati al dossier. Si rigenerano in un secondo, quindi non stanno in git.
"""
import io, json, re, sys

K10 = ['alt','frz','vel','agi','man','res','ter','acq','vol','mas']
K5  = ['pre','equ','cor','int','rif']
K   = K10 + K5
NOME = {'alt':'Altezza','frz':'Forza','vel':'Velocita','agi':'Agilita','man':'Presa',
        'res':'Fiato','ter':'Terra','acq':'Acqua','vol':'Volo','mas':'Stazza',
        'pre':'Precisione','equ':'Equilibrio','cor':'Coraggio','int':'Intelligenza','rif':'Riflessi'}

sorgente = io.open('src/10-dati.js', encoding='utf-8').read()

# ─── animali ───
ANIMALI = []
for ln in sorgente.split('\n'):
    t = ln.strip()
    if t.startswith('["') and t.endswith('],'):
        id_, it, en, emoji, stat = json.loads('[' + t[:-1] + ']')[0]
        if len(stat) != len(K):
            sys.exit(f'{id_} ha {len(stat)} doti invece di {len(K)}')
        a = {'id': id_, 'it': it, 'en': en, 'emoji': emoji}
        a.update(dict(zip(K, stat)))
        ANIMALI.append(a)

# ─── gare ───
RARI = set(re.findall(r'(\w+):[\d.]+', re.search(r'const RARITA=\{([^}]*)\}', sorgente).group(1)))
nomi_it = {m.group(1): m.group(2) for m in re.finditer(r'\n  (\w+):\["([^"]*)"', sorgente)}
GARE = []
pat = re.compile(r'\{id:"(\w+)",size:(\d+),emoji:"([^"]*)",gruppo:"(\w+)",req:(\{[^}]*\}),pesi:(\{[^}]*\})(,sinergia:\{[^}]*\})?\}')
for m in pat.finditer(sorgente):
    sinergia = None
    if m.group(7):
        s = m.group(7)
        sinergia = {'tipo': re.search(r'tipo:"(\w+)"', s).group(1),
                    'stat': re.search(r'stat:"(\w+)"', s).group(1),
                    'max': float(re.search(r'max:([\d.]+)', s).group(1))}
        q = re.search(r'soglia:(\d+),quota:([\d.]+)', s)
        if q:
            sinergia['soglia'] = int(q.group(1)); sinergia['quota'] = float(q.group(2))
    GARE.append({'id': m.group(1), 'size': int(m.group(2)), 'emoji': m.group(3),
                 'gruppo': m.group(4), 'nome': nomi_it.get(m.group(1), m.group(1)),
                 'req': json.loads(m.group(5)), 'pesi': json.loads(m.group(6)),
                 'sinergia': sinergia})
if not GARE:
    sys.exit('nessuna gara letta: il formato di SPORT_TUTTI e\' cambiato?')

# ─── controllo: nessuna dote da tutt'e due le parti ───
doppie = [(g['nome'], k) for g in GARE for k in g['req'] if k in g['pesi']]
if doppie:
    print('ATTENZIONE, doti usate sia per accesso sia per premio:')
    for n, k in doppie:
        print(f'   {n}: {NOME[k]}')

passa = lambda a, req: all(a[k] >= v for k, v in req.items())

def fit(a, pesi):
    """La stessa formula di 21-punteggi.js, riscritta in Python. Se cambia
    la', va cambiata anche qui."""
    lo = hi = raw = 0
    for k, w in pesi.items():
        raw += w * a.get(k, 0)
        if w < 0: lo += w * 10
        else:     hi += w * 10
    return 5.0 if hi == lo else max(0.0, min(10.0, 10 * (raw - lo) / (hi - lo)))

SEP = ';'
def cella(v):
    s = str(v)
    return '"' + s.replace('"', '""') + '"' if any(c in s for c in '";\n') else s
def scrivi(nome, righe):
    io.open(nome, 'w', encoding='utf-8-sig', newline='').write(
        '\r\n'.join(SEP.join(cella(x) for x in r) for r in righe) + '\r\n')

intest = (['id','nome (it)','nome (en)','emoji','raro']
          + [f'{NOME[k]} ({k})' for k in K] + ['gare'] + [g['nome'] for g in GARE])
out = [intest]
for a in ANIMALI:
    dentro = [g for g in GARE if passa(a, g['req'])]
    out.append([a['id'], a['it'], a['en'], a['emoji'], 'raro' if a['id'] in RARI else '']
               + [a[k] for k in K] + [len(dentro)]
               + ['✓' if g in dentro else '' for g in GARE])
scrivi('animali-proposta.csv', out)

reg = [['id','gara','gruppo','squadra','accesso','premio','intesa',
        'accesso (dati)','premio (dati)','animali ammessi','% sul totale','migliore']]
for g in GARE:
    dentro = [a for a in ANIMALI if passa(a, g['req'])]
    top = max(dentro, key=lambda a: fit(a, g['pesi'])) if dentro else None
    s = g['sinergia']
    intesa = '' if not s else (
        f"ruoli su {NOME[s['stat']]}: {round(s['quota']*100)}% sopra {s['soglia']}, fino a +{round(s['max']*100)}%"
        if s['tipo'] == 'ruoli' else
        f"somiglianza su {NOME[s['stat']]}, fino a +{round(s['max']*100)}%")
    reg.append([
        g['id'], g['nome'], g['gruppo'], g['size'],
        ' e '.join(f'{NOME[k]}>={v}' for k, v in g['req'].items()),
        ' · '.join((f'{NOME[k]} x{w}' if w > 0 else f'{NOME[k]} penalizza {w}') for k, w in g['pesi'].items()),
        intesa,
        '|'.join(f'{k}:{v}' for k, v in g['req'].items()),
        '|'.join(f'{k}:{w}' for k, w in g['pesi'].items()),
        len(dentro), '%d%%' % (len(dentro) * 100 // len(ANIMALI)),
        f"{top['it']} {fit(top, g['pesi']):.1f}" if top else '',
    ])
scrivi('gare-regole.csv', reg)

print(f'animali-proposta.csv : {len(ANIMALI)} animali x {len(GARE)} gare')
print(f'gare-regole.csv      : {len(GARE)} gare '
      f'({sum(1 for g in GARE if g["gruppo"]=="classica")} classiche, '
      f'{sum(1 for g in GARE if g["gruppo"]=="ghiaccio")} di ghiaccio), '
      f'{sum(1 for g in GARE if g["sinergia"])} con intesa')
print(f'doti usate da tutt\'e due le parti: {len(doppie)}')
