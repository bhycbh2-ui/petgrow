from pathlib import Path
import re

APP=Path('src/App.jsx'); W=Path('src/PetDailyWidgets.jsx'); N=Path('api/news.js')
app=APP.read_text(encoding='utf-8'); w=W.read_text(encoding='utf-8'); n=N.read_text(encoding='utf-8')

def rep(s,old,new,label,count=1):
    if old not in s: raise RuntimeError('missing anchor: '+label)
    return s.replace(old,new,count)

# 1) Bundle Leaflet in the web build so the desktop map does not depend on unpkg JS/CSS loading.
app=rep(app,'import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";','import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";\nimport * as LeafletLib from "leaflet";\nimport "leaflet/dist/leaflet.css";','leaflet imports')
app=rep(app,'    if(!window.L){\n      if(!document.getElementById("petgrow-leaflet-css")){','    if(!window.L) window.L=LeafletLib;\n    if(!window.L){\n      if(!document.getElementById("petgrow-leaflet-css")){','leaflet fallback')

# 2) PetTalk feed should open from the menu even before login; write actions retain their own account checks.
app=app.replace('"guide", "community", "content", "my", "admin"','"guide", "content", "my", "admin"')

# 3) Align Pet Tarot sidebar icon/text to every other menu item; no odd leading visual gap.
app=rep(app,'<button className={view === "tarot" ? "active" : ""} onClick={() => goView("tarot")}><span style={{fontSize:18}}>🃏</span><span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</span></button>','<button className={`tarot-nav ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span className="sidebar-tarot-mark">🃏</span><span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</span></button>','tarot sidebar')

# 4) Standardize empty-state cards for Saju and PetBTI.
old_empty='<div className="feature-module-shell" style={{ display: "flex", justifyContent: "center", padding: "24px 20px 40px" }}><div className="bg-card" style={{ textAlign: "center", width: "100%", maxWidth: 560, padding: "34px 30px" }}>'
app=app.replace(old_empty,'<div className="feature-module-shell feature-empty-wrap"><div className="bg-card feature-empty-card">',2)
old_tarot='{featurePet ? <PetTarotPanel pet={featurePet} lang={lang} /> : <div className="bg-card" style={{textAlign:"center",padding:28}}><b>Pet타로를 보려면 우리 아이를 먼저 등록해 주세요.</b><button className="bg-btn" style={{display:"block",margin:"14px auto 0"}} onClick={()=>{setMode("onboarding");goView("pets")}}>우리 아이 등록</button></div>}'
new_tarot='{featurePet ? <PetTarotPanel pet={featurePet} lang={lang} /> : <div className="feature-empty-wrap"><div className="bg-card feature-empty-card"><span className="feature-empty-icon">🃏</span><h2>등록된 아이가 아직 없어요</h2><p className="bg-sub">Pet타로는 \'우리 아이\'에 등록한 반려동물만 이용할 수 있어요. 먼저 반려동물을 등록해 주세요.</p><button className="bg-btn" onClick={()=>{setMode("onboarding");goView("pets")}}>우리 아이 등록하러 가기</button></div></div>}'
app=rep(app,old_tarot,new_tarot,'tarot empty')

# 5) About page: remove Growth Records card so the feature grid is 3 x 3.
app=app.replace('    ["pets","📈",lang==="en"?"Growth records":"성장 기록",lang==="en"?"Track weight and growth":"체중과 성장 변화를 기록해요"],\n','')

# 6) Information guide title hierarchy should clearly differ from the page title.
app=app.replace('<section className="bg-card info-guide-search-card"><h2>무엇이 궁금하세요?</h2><p className="bg-sub">메뉴 이름이나 하고 싶은 일을 검색해 보세요.</p>','<section className="bg-card info-guide-search-card"><small className="info-guide-kicker">QUICK HELP</small><h2>궁금한 기능을 찾아보세요</h2><p className="bg-sub">메뉴 이름이나 하고 싶은 일을 검색하면 바로 이용방법을 찾을 수 있어요.</p>')

# Shared UI polish.
css=r'''
/* PETGROW_FIXES_V5 */
.petgrow-sidebar-nav .tarot-nav{gap:9px!important}.sidebar-tarot-mark{width:20px;min-width:20px;height:20px;display:grid;place-items:center;font-size:17px;line-height:1;margin:0!important}.feature-empty-wrap{display:flex;justify-content:center;width:100%;padding:24px 20px 40px!important}.feature-empty-card{width:100%!important;max-width:560px!important;min-height:250px!important;padding:34px 30px!important;text-align:center!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important}.feature-empty-card h2{font-size:19px!important;margin:8px 0 7px!important}.feature-empty-card p{font-size:13px!important;line-height:1.65!important;margin:0 0 22px!important;max-width:430px!important;word-break:keep-all}.feature-empty-card .bg-btn{width:100%!important;max-width:430px!important;font-size:14px!important}.feature-empty-icon{font-size:40px;line-height:1;margin-bottom:5px}.info-guide-kicker{display:block;font-size:10px;font-weight:900;letter-spacing:.13em;color:var(--primary);margin-bottom:6px}.landing-feature-grid,.about-feature-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}@media(max-width:700px){.feature-empty-wrap{padding:14px 0 32px!important}.feature-empty-card{min-height:235px!important;padding:28px 20px!important}.landing-feature-grid,.about-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:420px){.landing-feature-grid,.about-feature-grid{grid-template-columns:1fr!important}}
'''
app=rep(app,'.app-bottom-nav{position:fixed;',css+'\n.app-bottom-nav{position:fixed;','v5 app css')

# 7) PetNews: enrich real article og:image safely; image-less results are omitted without turning the whole feed into an error.
insert=r'''
function safeRemoteUrl(value=""){
  try{const u=new URL(value);if(!/^https?:$/.test(u.protocol))return null;const h=u.hostname.toLowerCase();if(h==="localhost"||h.endsWith(".local")||h==="0.0.0.0"||h==="127.0.0.1"||h==="::1"||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return null;return u;}catch{return null;}
}
async function fetchOgMeta(startUrl){
  let current=safeRemoteUrl(startUrl);if(!current)return {image:"",url:startUrl};
  for(let hop=0;hop<4;hop++){
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),2200);
    try{
      const r=await fetch(current,{redirect:"manual",signal:ac.signal,headers:{"User-Agent":"Mozilla/5.0 (compatible; PetGrowNews/1.0)","Accept":"text/html,application/xhtml+xml"}});
      if(r.status>=300&&r.status<400){const loc=r.headers.get("location");if(!loc)break;const next=safeRemoteUrl(new URL(loc,current).toString());if(!next)break;current=next;continue;}
      const type=r.headers.get("content-type")||"";if(!r.ok||!type.includes("text/html"))break;
      const html=(await r.text()).slice(0,450000);
      const pick=(prop)=>html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,`i`))?.[1]||html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,`i`))?.[1]||"";
      const img=decodeEntities(pick("og:image")||pick("twitter:image")).trim();
      const canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]||current.toString();
      return {image:/^https?:\/\//i.test(img)?img:"",url:safeRemoteUrl(canonical)?.toString()||current.toString()};
    }catch{}finally{clearTimeout(timer)}
    break;
  }
  return {image:"",url:current?.toString()||startUrl};
}
async function enrichArticleImages(items){
  const candidates=items.slice(0,32),out=[];
  for(let i=0;i<candidates.length;i+=4){
    const batch=candidates.slice(i,i+4);
    const enriched=await Promise.all(batch.map(async item=>{if(item.image)return item;const meta=await fetchOgMeta(item.link);return {...item,link:meta.url||item.link,image:meta.image||"",source:meta.url?sourceFromUrl(meta.url):item.source};}));
    out.push(...enriched);
    if(out.filter(x=>x.image).length>=24)break;
  }
  return out;
}
'''
n=rep(n,'function dedupe(items){',insert+'\nfunction dedupe(items){','news og helpers')
n=n.replace('function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).filter(item=>/^https?:\\/\\//i.test(item.image||"")).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=20?recent:normalized).slice(0,60);}','async function prepare(raw){let normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));normalized=await enrichArticleImages(normalized);normalized=normalized.filter(item=>/^https?:\\/\\//i.test(item.image||""));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=12?recent:normalized).slice(0,40);}')
n=n.replace('const items=prepare(raw);if(!items.length)throw new Error("No pet news items after filtering");','const items=await prepare(raw);')
n=n.replace('return res.status(200).json({configured:true,provider,updatedAt:new Date().toISOString(),refreshSeconds:1800,total:items.length,items});','return res.status(200).json({configured:true,provider,updatedAt:new Date().toISOString(),refreshSeconds:1800,total:items.length,items,message:items.length?"":"대표이미지가 확인된 새 기사를 찾고 있어요. 잠시 후 다시 확인해 주세요."});')

# 8) Tarot animation: topic shuffle -> spread -> selected card lift -> flip reveal -> polished result.
w=w.replace('const [topic,setTopic]=useState("daily"),[phase,setPhase]=useState("topics"),','const [topic,setTopic]=useState("daily"),[phase,setPhase]=useState("topics"),')
w=rep(w,'const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("choose");}};','const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("shuffle");window.setTimeout(()=>setPhase("choose"),820);}};','tarot shuffle phase')
old_draw='const draw=async(i)=>{if(phase==="drawing")return;setPicked(i);setPhase("drawing");setError("");try{onAnalytics?.("feature_use","tarot_"+topic);const j=await jsonFetch("/api/tarot?action=draw",{method:"POST",body:JSON.stringify({petId,petName,topic,cardIndex:i})});window.setTimeout(()=>{setResult(j.result);setRecordId(j.id);setSaved(!!j.saved);setTodayMap(m=>({...m,[topic]:{id:j.id,pet_id:petId,pet_name:petName,content_type:"tarot",result_json:j.result,saved:!!j.saved}}));setPhase("result")},650);}catch(e){setError(e.message);setPhase("choose")}};'
new_draw='const draw=async(i)=>{if(phase==="drawing"||phase==="reveal")return;setPicked(i);setPhase("drawing");setError("");try{onAnalytics?.("feature_use","tarot_"+topic);const j=await jsonFetch("/api/tarot?action=draw",{method:"POST",body:JSON.stringify({petId,petName,topic,cardIndex:i})});window.setTimeout(()=>{setResult(j.result);setRecordId(j.id);setSaved(!!j.saved);setTodayMap(m=>({...m,[topic]:{id:j.id,pet_id:petId,pet_name:petName,content_type:"tarot",result_json:j.result,saved:!!j.saved}}));setPhase("reveal");window.setTimeout(()=>setPhase("result"),900)},650);}catch(e){setError(e.message);setPhase("choose")}};'
w=rep(w,old_draw,new_draw,'tarot draw phases')
anchor='{phase==="topics"&&<><p className="bg-sub pet-tarot-intro">'
w=rep(w,anchor,'{phase==="shuffle"&&<div className="pet-tarot-shuffle-scene"><div className="pet-tarot-shuffle-stack">{[0,1,2,3,4,5,6].map(i=><i key={i} style={{"--i":i}}><span>✦</span><b>PetGrow</b><em>🐾</em></i>)}</div><b>카드를 섞고 있어요</b><small>오늘의 메시지를 담은 22장을 준비하는 중이에요.</small></div>}\n      '+anchor,'tarot shuffle ui')
reveal_anchor='{phase==="result"&&result&&<>'
reveal_ui='{phase==="reveal"&&result&&<div className="pet-tarot-reveal-scene"><div className={"pet-tarot-reveal-card tarot-"+result.key}><div className="pet-tarot-reveal-inner"><div className="pet-tarot-reveal-back"><span>✦</span><b>PetGrow</b><em>🐾</em></div><div className="pet-tarot-reveal-front"><small>{String(result.cardId).padStart(2,"0")}</small><span>{result.symbol}</span><b>{result.name}</b></div></div></div><b>오늘의 카드가 열렸어요</b></div>}\n      '
w=rep(w,reveal_anchor,reveal_ui+reveal_anchor,'tarot reveal ui')

wcss=r'''
/* PET_TAROT_MOTION_V5 */
.pet-tarot-shuffle-scene{min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden}.pet-tarot-shuffle-scene>b{font-size:17px;margin-top:26px}.pet-tarot-shuffle-scene>small{font-size:11px;color:#7c887f;margin-top:6px}.pet-tarot-shuffle-stack{position:relative;width:150px;height:205px}.pet-tarot-shuffle-stack i{position:absolute;inset:0;border-radius:18px;border:2px solid #d8c58b;background:linear-gradient(145deg,#244638,#17352b);box-shadow:0 15px 32px rgba(30,54,43,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f7ebc2;font-style:normal;animation:tarotShuffleV5 1.05s cubic-bezier(.2,.8,.2,1) infinite;animation-delay:calc(var(--i)*-90ms)}.pet-tarot-shuffle-stack i span{font-size:28px}.pet-tarot-shuffle-stack i b{font-size:13px;margin:10px 0}.pet-tarot-shuffle-stack i em{font-style:normal;font-size:24px}@keyframes tarotShuffleV5{0%,100%{transform:translate3d(0,0,0) rotate(0)}25%{transform:translate3d(calc((var(--i) - 3)*8px),-9px,0) rotate(calc((var(--i) - 3)*1.8deg))}55%{transform:translate3d(calc((3 - var(--i))*7px),5px,0) rotate(calc((3 - var(--i))*1.4deg))}80%{transform:translate3d(0,-3px,0)}}.pet-tarot-reveal-scene{min-height:430px;display:flex;flex-direction:column;align-items:center;justify-content:center;perspective:1200px;text-align:center}.pet-tarot-reveal-card{width:min(230px,62vw);aspect-ratio:2/3;perspective:1000px;filter:drop-shadow(0 20px 35px rgba(36,52,42,.18));animation:tarotLiftV5 .55s ease both}.pet-tarot-reveal-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:tarotFlipV5 .9s cubic-bezier(.2,.75,.22,1) .15s both}.pet-tarot-reveal-back,.pet-tarot-reveal-front{position:absolute;inset:0;border-radius:24px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center}.pet-tarot-reveal-back{background:linear-gradient(145deg,#244638,#17352b);border:3px solid #d8c58b;color:#f7ebc2}.pet-tarot-reveal-back span{font-size:34px}.pet-tarot-reveal-back b{margin:14px 0;font-size:16px}.pet-tarot-reveal-back em{font-style:normal;font-size:30px}.pet-tarot-reveal-front{transform:rotateY(180deg);background:linear-gradient(160deg,#fffdf7,#f4ead0);border:2px solid #d9c58b;color:#2c3a31}.pet-tarot-reveal-front small{position:absolute;top:18px;font-weight:900;color:#806e45}.pet-tarot-reveal-front span{font-size:72px;filter:drop-shadow(0 8px 15px rgba(0,0,0,.08))}.pet-tarot-reveal-front b{margin-top:18px;font-size:22px}.pet-tarot-reveal-scene>b{margin-top:24px;font-size:17px}@keyframes tarotLiftV5{from{opacity:.3;transform:translateY(35px) scale(.82)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes tarotFlipV5{0%{transform:rotateY(0)}100%{transform:rotateY(180deg)}}.pet-tarot-result-wrap{display:grid!important;grid-template-columns:minmax(190px,240px) minmax(0,1fr)!important;gap:22px!important;align-items:start!important;max-width:760px!important;margin:18px auto 0!important}.pet-tarot-face{width:100%!important;max-width:240px!important;margin:0 auto!important;aspect-ratio:2/3!important;min-height:0!important}.pet-tarot-reading{min-width:0!important;background:#fafcf9;border:1px solid #e1e9e2;border-radius:20px;padding:20px!important}.pet-tarot-reading h3{font-family:inherit!important;font-weight:850!important;font-size:14px!important;margin:18px 0 7px!important}.pet-tarot-reading p{font-size:13px!important;line-height:1.78!important;margin:0!important;word-break:keep-all!important;overflow-wrap:anywhere}.pet-tarot-luck{margin-top:18px!important;padding:13px 14px!important;border-radius:14px!important;background:#fff8e7!important;font-size:12px!important}.pet-tarot-actions{grid-column:1/-1!important;display:flex!important;justify-content:center!important}.pet-tarot-actions .bg-btn{width:min(100%,420px)!important}.pet-tarot-result-topic{max-width:760px!important;margin-left:auto!important;margin-right:auto!important;display:flex!important;flex-wrap:wrap!important;gap:7px 9px!important;align-items:center!important}.pet-tarot-result-topic span{margin-left:auto!important;font-size:10px!important;color:var(--sub)!important}.pet-tarot-back22{transition:transform .24s ease,filter .24s ease,opacity .24s ease!important}.pet-tarot-back22.picked{z-index:50!important;transform:translateY(-45px) scale(1.16) rotate(0deg)!important;filter:drop-shadow(0 18px 20px rgba(30,55,42,.25))!important}.pet-tarot-back22:not(.picked):disabled{opacity:.52!important;filter:blur(.15px)!important}@media(max-width:680px){.pet-tarot-shuffle-scene{min-height:300px}.pet-tarot-shuffle-stack{width:120px;height:170px}.pet-tarot-reveal-scene{min-height:370px}.pet-tarot-result-wrap{grid-template-columns:1fr!important;gap:14px!important}.pet-tarot-face{max-width:210px!important}.pet-tarot-reading{padding:16px!important}.pet-tarot-result-topic span{width:100%!important;margin-left:0!important}.pet-tarot-actions{grid-column:1!important}.pet-tarot-deck22{min-height:205px!important;padding-left:24px!important;padding-right:24px!important;overflow-x:auto!important;overflow-y:visible!important}.pet-tarot-back22{flex:0 0 72px!important;min-width:72px!important}}@media(prefers-reduced-motion:reduce){.pet-tarot-shuffle-stack i,.pet-tarot-reveal-card,.pet-tarot-reveal-inner{animation:none!important}.pet-tarot-reveal-inner{transform:rotateY(180deg)!important}}
'''
w=w.replace('export const PET_DAILY_CSS=`','export const PET_DAILY_CSS=`\n'+wcss+'\n')

APP.write_text(app,encoding='utf-8');W.write_text(w,encoding='utf-8');N.write_text(n,encoding='utf-8')
print('PetGrow fixes v5 applied')
