/* Costruisce il JSON per la scheda tecnica, usando il codice vero del gioco
   per fit() e le sinergie, e i CSV per doti e assegnazione degli sport.
   Le gare stanno in una tabella condivisa: ripeterle per ogni animale
   gonfiava il file da 60 KB a 600. */
const fs = require("fs");

function csv(file) {
  const t = fs.readFileSync(file, "utf8").replace(/^﻿/, "").trim();
  const r = t.split(/\r?\n/).map(l => l.split(";"));
  const h = r[0];
  return {intest: h, righe: r.slice(1).map(x => Object.fromEntries(h.map((k, i) => [k, x[i]])))};
}

const K10 = ["alt","frz","vel","agi","man","res","ter","acq","vol","mas"];
const K5  = ["pre","equ","cor","int","rif"];
const K   = K10.concat(K5);
const NOME = {alt:"Altezza",frz:"Forza",vel:"Velocità",agi:"Agilità",man:"Presa",
  res:"Fiato",ter:"Terra",acq:"Acqua",vol:"Volo",mas:"Stazza",
  pre:"Precisione",equ:"Equilibrio",cor:"Coraggio",int:"Intelligenza",rif:"Riflessi"};
/* nel CSV le intestazioni sono senza accenti */
const COL = k => `${NOME[k].replace("à","a")} (${k})`;

const A = csv("animali-proposta.csv");
const R = csv("gare-regole.csv");
const primaGara = A.intest.indexOf("gare") + 1;
const colonneGara = A.intest.slice(primaGara);
const perNome = Object.fromEntries(R.righe.map(g => [g["gara"], g]));

/* --- il codice vero del gioco: fit(), i pesi e le sinergie --- */
const src = ["src/10-dati.js","src/21-punteggi.js"].map(f => fs.readFileSync(f,"utf8")).join("\n");
const ctx = {};
new Function("ctx", src + "\nctx.fit=fit;ctx.SPORT_TUTTI=SPORT_TUTTI;ctx.GARE=GARE;")(ctx);
const DAL_GIOCO = {};
for (const sp of ctx.SPORT_TUTTI) DAL_GIOCO[ctx.GARE[sp.id][0]] = sp;

/* "ter:5|man:4" -> {ter:5, man:4}. Le colonne "(dati)" esistono apposta:
   la scheda puo' dire quale requisito manca invece di limitarsi a un no,
   e puo' calcolare il voto anche per le gare non ancora nel gioco. */
const leggiCoppie = s => Object.fromEntries((s || "").split("|").filter(Boolean)
  .map(p => { const [k, v] = p.split(":"); return [k, +v]; }));

const gare = colonneGara.map(nome => {
  const reg = perNome[nome], sp = DAL_GIOCO[nome];
  const g = {nome, gruppo: reg.gruppo,
             regola: reg.accesso, premio: reg.premio,
             req: leggiCoppie(reg["accesso (dati)"]),
             pesi: leggiCoppie(reg["premio (dati)"]),
             ammessi: +reg["animali ammessi"], size: +reg.squadra,
             emoji: sp ? sp.emoji : null};
  if (sp && sp.sinergia) g.sinergia = sp.sinergia;
  return g;
});

const animali = A.righe.map(a => {
  const doti = {};
  for (const k of K) doti[k] = +a[COL(k)];
  return {
    id: a.id, it: a["nome (it)"], en: a["nome (en)"], emoji: a.emoji, raro: !!a.raro,
    d: K.map(k => doti[k]),
    dentro: colonneGara.map(n => a[n] ? 1 : 0),
    fit: gare.map(g => Math.round(ctx.fit(doti, g.pesi) * 10) / 10)
  };
});

const media = K.map((k, i) =>
  Math.round(animali.reduce((s, a) => s + a.d[i], 0) / animali.length * 10) / 10);

const dati = JSON.stringify({chiavi: K, nomi: NOME, media, gare, animali});
if (dati.includes("</script")) throw new Error("i dati chiuderebbero il tag script");

/* La pagina esce come file unico, con i dati dentro: si apre con un doppio
   clic, senza server e senza fetch. Stessa scelta del gioco. */
const modello = fs.readFileSync(__dirname + "/dossier-modello.html", "utf8");
if (!modello.includes("__DATI__")) throw new Error("nel modello manca __DATI__");
fs.writeFileSync("dossier.html", modello.replace("__DATI__", dati));

const kb = n => Math.round(fs.statSync(n).size / 1024);
console.log(`dossier.html: ${animali.length} atleti, ${gare.length} gare, ${kb("dossier.html")} KB`);
console.log(`  classiche / di ghiaccio  : ${gare.filter(g => g.gruppo === "classica").length} / ${gare.filter(g => g.gruppo === "ghiaccio").length}`);
console.log(`  gare con sinergia        : ${gare.filter(g => g.sinergia).length}`);
