# -*- coding: utf-8 -*-
"""Ricostruisce animali-proposta.csv e gare-regole.csv.

Fonti:
  src/10-dati.js                    gli 88 animali del gioco e le 14 gare vere
  strumenti/animali-proposti.csv    i 9 animali ancora solo proposti

Le 14 gare del gioco portano qui le loro regole senza riscriverle: req e
pesi vengono letti dal sorgente. Le 19 proposte stanno nella tabella qui
sotto, e seguono la stessa divisione:

  ACCESSO  chi puo' entrare. Una condizione di ambiente o di attrezzo:
           stare in piedi sulla terra, avere una mano per tenere un arco.
  PREMIO   cosa rende, una volta dentro.

Una dote non sta mai da tutt'e due le parti: farsi pagare due volte lo
stesso requisito e' il difetto che la review chiedeva di togliere.
"""
import io, json, re, sys

K10 = ['alt','frz','vel','agi','man','res','ter','acq','vol','mas']
K5  = ['pre','equ','cor','int','rif']
K   = K10 + K5
NOME = {'alt':'Altezza','frz':'Forza','vel':'Velocita','agi':'Agilita','man':'Presa',
        'res':'Fiato','ter':'Terra','acq':'Acqua','vol':'Volo','mas':'Stazza',
        'pre':'Precisione','equ':'Equilibrio','cor':'Coraggio','int':'Intelligenza','rif':'Riflessi'}

# id, nome, gruppo, accesso, premio
PROPOSTE = [
 ('ciclismo',   'Ciclismo a squadre',               'estiva',    {'ter':6},          {'res':4,'vel':3,'equ':1}),
 ('ginnastica', 'Ginnastica a squadre',             'estiva',    {'ter':5},          {'agi':4,'equ':4}),
 ('equitazione','Equitazione a squadre',            'estiva',    {'ter':6},          {'equ':4,'vel':2,'int':2}),
 ('arco',       "Tiro con l'arco a squadre",        'estiva',    {'ter':5,'man':4},  {'pre':5,'equ':2}),
 ('pesi',       'Sollevamento pesi a squadre',      'estiva',    {'ter':5},          {'frz':5,'mas':3}),
 ('judo',       'Judo a squadre',                   'estiva',    {'ter':5,'man':4},  {'frz':3,'agi':3,'int':2}),
 ('taekwondo',  'Taekwondo a squadre',              'estiva',    {'ter':5},          {'agi':4,'rif':3,'vel':2}),
 ('badminton',  'Badminton doppio',                 'estiva',    {'ter':5,'man':4},  {'rif':4,'agi':3,'vel':1}),
 ('pingpong',   'Tennistavolo doppio',              'estiva',    {'ter':5,'man':4},  {'rif':5,'pre':3}),
 ('saltosci',   'Salto con gli sci di squadra',     'invernale', {'ter':5},          {'cor':4,'equ':3,'mas':-1}),
 ('slittino',   'Slittino a squadre',               'invernale', {'ter':5},          {'cor':4,'mas':2,'equ':2}),
 ('pattinaggio','Pattinaggio artistico a squadre',  'invernale', {'ter':5},          {'agi':4,'equ':4}),
 ('velocita',   'Pattinaggio di velocita a squadre','invernale', {'ter':5},          {'vel':4,'equ':3}),
 ('fondo',      'Sci di fondo a squadre',           'invernale', {'ter':6},          {'res':5,'vel':1}),
 ('snowboard',  'Snowboard a squadre',              'invernale', {'ter':5},          {'equ':4,'agi':3,'cor':2}),
 ('discesa',    'Discesa libera a squadre',         'invernale', {'ter':5},          {'vel':4,'cor':3,'equ':2}),
 ('slalom',     'Slalom speciale a squadre',        'invernale', {'ter':5},          {'agi':4,'rif':3}),
 ('biathlon',   'Biathlon a squadre',               'invernale', {'ter':6},          {'res':4,'pre':4}),
 ('combinata',  'Combinata nordica a squadre',      'invernale', {'ter':5},          {'res':4,'vel':3,'equ':1}),
]

INVERNALI_DEL_GIOCO = {'bob'}   # l'unica gara invernale gia' nel gioco

# ─── gli animali del gioco ───
sorgente = io.open('src/10-dati.js', encoding='utf-8').read()
ANIMALI = []
for ln in sorgente.split('\n'):
    t = ln.strip()
    if t.startswith('["') and t.endswith('],'):
        id_, it, en, emoji, stat = json.loads('[' + t[:-1] + ']')[0]
        if len(stat) != len(K):
            sys.exit(f'{id_} ha {len(stat)} doti invece di {len(K)}: rilancia prima aggiungi-doti')
        a = {'id': id_, 'it': it, 'en': en, 'emoji': emoji, 'nuovo': ''}
        a.update(dict(zip(K, stat)))
        ANIMALI.append(a)

# ─── i 9 ancora proposti ───
import csv as _csv
prop = list(_csv.reader(io.open('strumenti/animali-proposti.csv', encoding='utf-8-sig'), delimiter=';'))
hp = prop[0]
for r in prop[1:]:
    a = {'id': r[0], 'it': r[1], 'en': r[2], 'emoji': r[3], 'nuovo': 'nuovo'}
    for k in K:
        a[k] = int(r[hp.index(f'{NOME[k]} ({k})')])
    ANIMALI.append(a)

# ─── le 14 gare vere, lette dal gioco ───
GARE = []
pat = re.compile(r'\{id:"(\w+)",size:(\d+),emoji:"([^"]*)",req:(\{[^}]*\}),pesi:(\{[^}]*\})')
nomi_it = {m.group(1): m.group(2) for m in re.finditer(r'\n  (\w+):\["([^"]*)"', sorgente)}
for m in pat.finditer(sorgente):
    gid = m.group(1)
    GARE.append({'id': gid, 'nome': nomi_it.get(gid, gid), 'gruppo': 'invernale' if gid in INVERNALI_DEL_GIOCO else 'estiva',
                 'stato': 'attuale', 'size': int(m.group(2)),
                 'req': json.loads(m.group(4)), 'pesi': json.loads(m.group(5))})
if len(GARE) != 14:
    sys.exit(f'lette {len(GARE)} gare dal gioco invece di 14')

for gid, nome, gruppo, req, pesi in PROPOSTE:
    GARE.append({'id': gid, 'nome': nome, 'gruppo': gruppo, 'stato': 'nuova', 'size': None,
                 'req': req, 'pesi': pesi})

# ─── controllo: nessuna dote da tutt'e due le parti ───
doppie = [(g['nome'], k) for g in GARE for k in g['req'] if k in g['pesi']]
if doppie:
    print('ATTENZIONE, doti usate sia per accesso sia per premio:')
    for n, k in doppie:
        print(f'   {n}: {NOME[k]}')

passa = lambda a, req: all(a[k] >= v for k, v in req.items())

def fit(a, pesi):
    """La stessa formula di 21-punteggi.js, riscritta qui perche' questo
    script gira in Python. Se cambia la', va cambiata anche qui."""
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

# ─── animali-proposta.csv ───
intest = (['id','nome (it)','nome (en)','emoji','stato']
          + [f'{NOME[k]} ({k})' for k in K] + ['gare'] + [g['nome'] for g in GARE])
out = [intest]
for a in ANIMALI:
    dentro = [g for g in GARE if passa(a, g['req'])]
    out.append([a['id'], a['it'], a['en'], a['emoji'], a['nuovo']]
               + [a[k] for k in K] + [len(dentro)]
               + ['✓' if g in dentro else '' for g in GARE])
scrivi('animali-proposta.csv', out)

# ─── gare-regole.csv ───
reg = [['id','gara','gruppo','stato','accesso','premio','accesso (dati)','premio (dati)',
        'animali ammessi','% sul totale','size','migliore']]
for g in GARE:
    dentro = [a for a in ANIMALI if passa(a, g['req'])]
    top = max(dentro, key=lambda a: fit(a, g['pesi'])) if dentro else None
    reg.append([
        g['id'], g['nome'], g['gruppo'], g['stato'],
        ' e '.join(f'{NOME[k]}>={v}' for k, v in g['req'].items()),
        ' · '.join((f'{NOME[k]} x{w}' if w > 0 else f'{NOME[k]} penalizza {w}') for k, w in g['pesi'].items()),
        '|'.join(f'{k}:{v}' for k, v in g['req'].items()),
        '|'.join(f'{k}:{w}' for k, w in g['pesi'].items()),
        len(dentro), '%d%%' % (len(dentro) * 100 // len(ANIMALI)),
        g['size'] if g['size'] else max(1, (len(dentro) - 8) // 5),
        f"{top['it']} {fit(top, g['pesi']):.1f}" if top else '',
    ])
scrivi('gare-regole.csv', reg)

print(f'animali-proposta.csv : {len(ANIMALI)} animali x {len(GARE)} gare')
print(f'gare-regole.csv      : {len(GARE)} gare ({sum(1 for g in GARE if g["stato"]=="attuale")} nel gioco, '
      f'{sum(1 for g in GARE if g["stato"]=="nuova")} proposte)')
print(f'doti usate da tutt\'e due le parti: {len(doppie)}')
