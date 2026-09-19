/* ─── AI ─── */
let motore=null;
function estraiJSON(x){
  const f=x.match(/```(?:json)?\s*([\s\S]*?)```/);const g=f?f[1]:x;
  try{return JSON.parse(g.trim());}catch{}
  const a=g.indexOf("{"),b=g.lastIndexOf("}"),c=g.indexOf("["),d=g.lastIndexOf("]");
  const k=(a>=0&&b>a)?g.slice(a,b+1):(c>=0&&d>c)?g.slice(c,d+1):null;
  if(k){try{return JSON.parse(k);}catch{}}
  throw {code:"invalid_json"};
}
function motoreAPI(k){return{tipo:"api",async chiedi(p){
  let r;try{r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
    headers:{"content-type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-5",max_tokens:2500,messages:[{role:"user",content:p}]})});}catch{throw{code:"rete"};}
  if(r.status===401)throw{code:"chiave"};if(r.status===429)throw{code:"rate_limited"};if(!r.ok)throw{code:"upstream_error"};
  const d=await r.json();
  return estraiJSON((d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n"));
}};}
function copiaErrore(e){const c=e&&e.code;
  if(c==="chiave")return t("errChiave");if(c==="rete")return t("errRete");
  if(c==="not_granted")return t("errPermesso");if(c==="rate_limited")return t("errTroppe");
  if(c==="invalid_json")return t("errJson");if(c==="refused")return t("errRifiuto");
  return t("errGenerico");}
function aggiornaMotore(){
  document.body.classList.toggle("ai-on",!!motore);
  const st=$("#stato-ai"),zc=$("#zona-chiave");
  if(motore&&motore.tipo==="claude"){st.textContent=t("aiClaude");zc.style.display="none";}
  else{zc.style.display="flex";st.textContent=motore?t("aiChiave"):t("aiSpento");
    $("#chiave").value=MEM.leggi("chiave","")?"••••••••••••••••":"";}
}
async function avviaMotore(){
  try{if(window.claude&&window.claude.use){const s=await window.claude.use("sample");
    if(s){motore={tipo:"claude",chiedi:p=>s.json(p,{modelTier:"default"})};aggiornaMotore();return;}}}catch{}
  const k=MEM.leggi("chiave","");if(k)motore=motoreAPI(k);
  aggiornaMotore();
}
