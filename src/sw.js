/* ─── service worker ──────────────────────────────────────────────────
   BUILD lo riscrive build.py, come in 20-base.js. Deve cambiare a ogni
   rilascio per due motivi: il browser installa un service worker nuovo
   solo se i byte del file sono diversi, ed e' il nome della cache, cosi'
   ogni versione riparte pulita invece di ereditare i resti di quella
   prima. */
const BUILD="2026-09-19e";
const CACHE="zoolympics-"+BUILD;
const GUSCIO=["./","index.html","manifest.json","icon-192.png","icon-512.png","apple-touch-icon.png"];

self.addEventListener("install",e=>{
  self.skipWaiting();
  /* Se un file del guscio manca, addAll rifiuta e resteremmo senza
     service worker: meglio installarsi lo stesso con la cache a meta',
     tanto il fetch ricade sulla rete. */
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(GUSCIO)).catch(()=>{}));
});

self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const chiavi=await caches.keys();
    await Promise.all(chiavi.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const u=new URL(req.url);
  if(u.origin!==location.origin)return;   // PeerJS e il motore AI vanno per conto loro
  /* versione.txt deve arrivare sempre dalla rete: e' il file con cui
     controllaVersione() si accorge che il service worker e' rimasto
     indietro. Servendolo dalla cache non si uscirebbe piu' dal giro. */
  if(u.pathname.endsWith("/versione.txt"))return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    /* ignoreSearch perche' dopo un aggiornamento si rientra con ?v=... */
    const salvata=await c.match(req,{ignoreSearch:true});
    if(salvata)return salvata;
    try{
      const rete=await fetch(req);
      if(rete.ok&&rete.type==="basic")c.put(req,rete.clone());
      return rete;
    }catch(err){
      if(req.mode==="navigate"){const g=await c.match("index.html",{ignoreSearch:true});if(g)return g;}
      return Response.error();
    }
  })());
});
