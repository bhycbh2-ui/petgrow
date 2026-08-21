import { upload } from "@vercel/blob/client";

/* PetGrow reports + PetNews + admin music runtime patch — 2026-08-18 */
(() => {
  const text = el => (el?.textContent || "").trim();
  const token = () => sessionStorage.getItem("petgrow_admin_token") || "";
  const MENU = {home:"홈",about:"소개",pets:"펫라이프",nearby:"펫플레이스",community:"커뮤니티",saju:"펫운세",tarot:"펫타로",petbti:"펫성향",music:"펫음악",tips:"펫가이드",news:"펫뉴스",guide:"정보가이드",my:"내 정보",support:"고객지원",admin:"관리자센터",points:"PetPoint"};
  const ICON = {"전체":"📰","All":"📰","すべて":"📰","全部":"📰","반려견":"🐶","Dogs":"🐶","犬":"🐶","반려묘":"🐱","Cats":"🐱","猫":"🐱","건강":"🩺","Health":"🩺","健康":"🩺","정책·제도":"🏛️","Policy":"🏛️","制度":"🏛️","政策":"🏛️","입양·보호":"🏠","Adoption":"🏠","保護・譲渡":"🏠","领养保护":"🏠","산업·서비스":"🛍️","Industry":"🛍️","サービス":"🛍️","产业服务":"🛍️","반려동물":"🐾","Pets":"🐾","ペット":"🐾","宠物":"🐾"};
  const MAX_AUDIO = 12 * 1024 * 1024, MAX_COVER = 4 * 1024 * 1024;
  const RELEVANT = ".admin-reporting-page,.petnews-cats,.petnews-image-fallback,.admin-music-form";
  let busy = false;

  function patchReportText(v){
    const s=String(v??"");
    if(!s.includes("[PetGrow]")||!s.includes("운영보고"))return s;
    return s.replace(/(^|\n)(\d+\.\s*)([a-z][a-z0-9_-]*)(\s+\d+회)/gi,(m,a,b,k,c)=>`${a}${b}${MENU[k.toLowerCase()]||k}${c}`);
  }
  function patchClipboard(){
    try{
      if(!navigator.clipboard?.writeText||navigator.clipboard.writeText.__pgMenuLabels)return;
      const native=navigator.clipboard.writeText.bind(navigator.clipboard);
      const wrapped=v=>native(patchReportText(v));wrapped.__pgMenuLabels=true;navigator.clipboard.writeText=wrapped;
    }catch{}
  }
  function polishReports(){
    document.querySelectorAll(".admin-reporting-page .admin-report-rank b").forEach(b=>{const m=/^(\d+\.\s*)([a-z][a-z0-9_-]*)$/i.exec(text(b));if(m&&MENU[m[2].toLowerCase()])b.textContent=`${m[1]}${MENU[m[2].toLowerCase()]}`});
  }
  function cleanCat(v){return String(v||"").replace(/^[📰🐶🐱🩺🏛️🏠🛍️🐾]\s*/u,"").trim()}
  function polishNews(){
    document.querySelectorAll(".petnews-cats button").forEach(btn=>{const label=cleanCat(btn.dataset.pgNewsLabel||text(btn));if(!label)return;btn.dataset.pgNewsLabel=label;const icon=ICON[label]||"🐾";if(btn.dataset.pgNewsIcon===icon&&btn.querySelector(".pg-news-cat-icon"))return;btn.dataset.pgNewsIcon=icon;btn.replaceChildren();const i=document.createElement("span");i.className="pg-news-cat-icon";i.setAttribute("aria-hidden","true");i.textContent=icon;const s=document.createElement("span");s.className="pg-news-cat-label";s.textContent=label;btn.append(i,s)});
    document.querySelectorAll(".petnews-image-fallback").forEach(el=>{const label=cleanCat(text(el.querySelector("small")));const mark=el.querySelector("span");if(mark)mark.textContent=ICON[label]||"🐾"});
  }

  async function json(res){const data=await res.json().catch(()=>({}));if(!res.ok){const e=new Error(data?.error||`요청에 실패했어요. (${res.status})`);e.code=data?.code||"";throw e}return data}
  async function status(){if(!token())throw new Error("관리자 PIN 인증이 필요해요.");return json(await fetch("/api/admin-music-upload",{credentials:"include",headers:{"X-PetGrow-Admin-Token":token()}}))}
  async function save(payload){return json(await fetch("/api/music?action=admin-save",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-PetGrow-Admin-Token":token()},body:JSON.stringify(payload)}))}
  function human(e){const m=String(e?.message||e||"업로드에 실패했어요.");if(/BLOB_READ_WRITE_TOKEN|blob.+token|No token/i.test(m))return"Vercel Blob 저장소가 연결되지 않았어요. Vercel → Storage에서 Public Blob을 PetGrow 프로젝트에 연결한 뒤 다시 배포해 주세요.";if(/private|access.+public|store.+access/i.test(m))return"Pet음악은 Public Blob 저장소가 필요해요. Vercel Blob 접근 방식을 Public으로 확인해 주세요.";if(/maximum|too large|size|413/i.test(m))return"음원은 12MB 이하, 커버 이미지는 4MB 이하로 올려주세요.";if(/^failed$/i.test(m)||m==="Failed")return"음원 업로드에 실패했어요. Vercel Blob 연결 상태를 확인한 뒤 다시 시도해 주세요.";return m}
  function health(box,state,msg){if(!box)return;box.className=`pg-music-upload-health ${state}`;box.innerHTML='<span class="pg-music-upload-dot" aria-hidden="true"></span><span></span>';box.lastElementChild.textContent=msg}
  async function checkForm(form){const box=form.querySelector(".pg-music-upload-health");if(!box||box.dataset.loading==="1")return;box.dataset.loading="1";health(box,"checking","음원 저장소 연결 상태 확인 중…");try{const s=await status();health(box,s.blobConfigured?"ok":"warn",s.blobConfigured?"음원 업로드 준비 완료 · MP3/WAV/M4A 최대 12MB":"Vercel Blob 연결 필요 · Storage에서 Public Blob을 PetGrow에 연결해 주세요.")}catch(e){health(box,"warn",human(e))}finally{box.dataset.loading="0"}}
  function enhanceMusic(){
    document.querySelectorAll(".admin-music-form").forEach(form=>{
      if(!form.querySelector(".pg-music-upload-health")){const box=document.createElement("div");box.className="pg-music-upload-health checking";box.innerHTML='<span class="pg-music-upload-dot" aria-hidden="true"></span><span>음원 저장소 연결 상태 확인 중…</span>';const row=[...form.querySelectorAll(".full")].find(x=>x.querySelector("button"));row?form.insertBefore(box,row):form.appendChild(box)}
      const input=form.querySelector('input[type="file"][accept*="audio"]');const label=input?.closest("label");if(label&&!label.querySelector(".pg-music-direct-note")){const n=document.createElement("small");n.className="bg-sub pg-music-direct-note";n.textContent="Suno MP3도 가능 · 브라우저에서 Vercel Blob으로 직접 업로드해 대용량 실패를 줄여요.";label.appendChild(n)}
      if(form.dataset.pgMusicChecked!=="1"){form.dataset.pgMusicChecked="1";checkForm(form)}
    });
  }
  function ext(file,fallback){const e=String(file?.name||"").split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"");return e&&e.length<=5?e:fallback}
  async function uploadFile(file,kind){const e=ext(file,kind==="cover"?"jpg":"mp3");const base=String(file.name||"petgrow").replace(/\.[^.]+$/,"").replace(/[^0-9A-Za-z가-힣_-]+/g,"-").slice(0,60)||"petgrow";const folder=kind==="cover"?"petmusic/covers/admin":"petmusic/admin";return upload(`${folder}/${Date.now()}-${base}.${e}`,file,{access:"public",handleUploadUrl:"/api/admin-music-upload",clientPayload:JSON.stringify({adminToken:token(),kind}),contentType:file.type||undefined})}
  function data(form){const selects=[...form.querySelectorAll("select.bg-input")];const audio=form.querySelector('input[type="file"][accept*="audio"]')?.files?.[0]||null;const cover=form.querySelector('input[type="file"][accept*="image"]')?.files?.[0]||null;return{title:form.querySelector('input.bg-input:not([type="file"])')?.value?.trim()||"",description:form.querySelector("textarea")?.value?.trim()||"",species:selects[0]?.value||"all",vocalType:selects[1]?.value||"instrumental",mood:selects[2]?.value||"relax",active:form.querySelector('input[type="checkbox"]')?.checked!==false,audio,cover}}
  function validate(d){if(!d.title)throw new Error("노래 제목을 입력해 주세요.");if(!d.audio)throw new Error("음원 파일을 선택해 주세요.");if(d.audio.size>MAX_AUDIO)throw new Error("음원 파일은 12MB 이하로 올려주세요.");if(d.cover&&d.cover.size>MAX_COVER)throw new Error("커버 이미지는 4MB 이하로 올려주세요.");if(d.audio.type&&!/^audio\//i.test(d.audio.type))throw new Error("MP3/WAV/M4A 형식의 음원을 선택해 주세요.");if(d.cover?.type&&!/^image\/(jpeg|png|webp)$/i.test(d.cover.type))throw new Error("커버는 JPG/PNG/WebP 이미지를 선택해 주세요.")}
  function addRow(d,coverUrl){const list=document.querySelector(".admin-music-list");if(!list)return;list.querySelectorAll(":scope > p").forEach(p=>p.remove());const r=document.createElement("div");r.className="admin-music-row pg-runtime-music-row";r.innerHTML=`${coverUrl&&!coverUrl.includes("blank-white")?`<img class="admin-music-thumb" src="${coverUrl}" alt=""/>`:'<div class="admin-music-thumb">🎵</div>'}<div><b></b><small></small></div><div class="admin-music-actions"><span class="pg-music-new-badge">등록 완료</span></div>`;r.querySelector("b").textContent=d.title;const sp=d.species==="dog"?"강아지":d.species==="cat"?"고양이":"공용",vc=d.vocalType==="vocal"?"보컬":"인스트루멘탈",mo=({relax:"휴식",sleep:"수면",play:"놀이",nature:"자연"})[d.mood]||"휴식";r.querySelector("small").textContent=`${sp} · ${vc} · ${mo} · 방금 등록 · ▶ 0 · ♥ 0 · 💬 0`;list.prepend(r)}
  async function createMusic(form,button){if(busy)return;const d=data(form);validate(d);busy=true;button.disabled=true;const original=text(button)||"음악 등록",box=form.querySelector(".pg-music-upload-health");try{button.textContent="저장소 확인 중…";const s=await status();if(!s.blobConfigured)throw new Error("Vercel Blob 저장소가 연결되지 않았어요. Vercel → Storage에서 Public Blob을 PetGrow 프로젝트에 연결해 주세요.");button.textContent="음원 업로드 중…";const a=await uploadFile(d.audio,"audio");let coverUrl="/petmusic/covers/blank-white.svg";if(d.cover){button.textContent="커버 업로드 중…";coverUrl=(await uploadFile(d.cover,"cover")).url}button.textContent="등록 정보 저장 중…";await save({title:d.title,description:d.description,species:d.species,vocalType:d.vocalType,mood:d.mood,active:d.active,audioUrl:a.url,coverUrl});health(box,"ok","등록 완료 · 펫음악 메뉴에 바로 반영됐어요.");addRow(d,coverUrl);window.alert("펫음악을 등록했어요.")}catch(e){const m=human(e);health(box,"error",m);window.alert(m)}finally{busy=false;button.disabled=false;button.textContent=original}}
  function bindCreate(){if(document.documentElement.dataset.pgMusicCreateCapture==="1")return;document.documentElement.dataset.pgMusicCreateCapture="1";document.addEventListener("click",e=>{const b=e.target?.closest?.(".admin-music-form button");if(!b||!/^음악\s*등록$/.test(text(b)))return;const f=b.closest(".admin-music-form");if(!f)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();createMusic(f,b).catch(err=>window.alert(human(err)))},true)}
  function run(){
    if(document.querySelector(".admin-reporting-page"))polishReports();
    if(document.querySelector(".petnews-cats,.petnews-image-fallback"))polishNews();
    if(document.querySelector(".admin-music-form"))enhanceMusic();
  }
  function relevantNode(node){
    const el=node?.nodeType===1?node:node?.parentElement;
    if(!el)return false;
    return Boolean(el.matches?.(RELEVANT)||el.closest?.(RELEVANT)||el.querySelector?.(RELEVANT));
  }
  let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;run()})};
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>relevantNode(m.target)||[...m.addedNodes].some(relevantNode)))schedule()});
  function boot(){
    patchClipboard();bindCreate();run();
    const root=document.getElementById("root")||document.body;
    if(root)observer.observe(root,{subtree:true,childList:true,characterData:true});
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
