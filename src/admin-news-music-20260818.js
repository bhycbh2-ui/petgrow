import { upload } from "@vercel/blob/client";

/* PetGrow admin/report/news/music stabilization — 2026-08-18 */
(() => {
  const MENU_LABELS = {
    home: "홈", about: "소개", pets: "우리 아이", nearby: "내 주변 Pet", community: "Pet톡",
    saju: "Pet사주", tarot: "Pet타로", petbti: "PetBTI", music: "Pet음악", tips: "Pet정보",
    news: "Pet뉴스", guide: "정보가이드", my: "회원정보", support: "고객지원", admin: "관리자센터", points: "PetPoint"
  };
  const CATEGORY_ICONS = {
    "전체":"📰","All":"📰","すべて":"📰","全部":"📰","반려견":"🐶","Dogs":"🐶","犬":"🐶",
    "반려묘":"🐱","Cats":"🐱","猫":"🐱","건강":"🩺","Health":"🩺","健康":"🩺",
    "정책·제도":"🏛️","Policy":"🏛️","制度":"🏛️","政策":"🏛️","입양·보호":"🏠","Adoption":"🏠","保護・譲渡":"🏠","领养保护":"🏠",
    "산업·서비스":"🛍️","Industry":"🛍️","サービス":"🛍️","产业服务":"🛍️","반려동물":"🐾","Pets":"🐾","ペット":"🐾","宠物":"🐾"
  };
  const MAX_AUDIO = 12 * 1024 * 1024;
  const MAX_COVER = 4 * 1024 * 1024;
  let musicBusy = false;
  const text = el => (el?.textContent || "").trim();
  const adminToken = () => sessionStorage.getItem("petgrow_admin_token") || "";

  function reportTextWithLabels(value) {
    const raw = String(value ?? "");
    if (!raw.includes("[PetGrow]") || !raw.includes("운영보고")) return raw;
    return raw.replace(/(^|\n)(\d+\.\s*)([a-z][a-z0-9_-]*)(\s+\d+회)/gi,(m,lead,rank,key,tail)=>`${lead}${rank}${MENU_LABELS[String(key).toLowerCase()]||key}${tail}`);
  }
  function patchClipboard() {
    try {
      if (!navigator.clipboard?.writeText || navigator.clipboard.writeText.__pgReportLabels) return;
      const nativeWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
      const wrapped = value => nativeWrite(reportTextWithLabels(value));
      wrapped.__pgReportLabels = true;
      navigator.clipboard.writeText = wrapped;
    } catch {}
  }
  function polishReports() {
    document.querySelectorAll(".admin-reporting-page .admin-report-rank b").forEach(b=>{
      const m=/^(\d+\.\s*)([a-z][a-z0-9_-]*)$/i.exec(text(b));
      if(!m)return; const label=MENU_LABELS[m[2].toLowerCase()]; if(label)b.textContent=`${m[1]}${label}`;
    });
  }
  function cleanCategoryLabel(v){return String(v||"").replace(/^[📰🐶🐱🩺🏛️🏠🛍️🐾]\s*/u,"").trim()}
  function polishNews(){
    document.querySelectorAll(".petnews-cats button").forEach(btn=>{
      const label=cleanCategoryLabel(btn.dataset.pgNewsLabel||text(btn)); if(!label)return; btn.dataset.pgNewsLabel=label;
      const icon=CATEGORY_ICONS[label]||"🐾"; if(btn.dataset.pgNewsIcon===icon&&btn.querySelector(".pg-news-cat-icon"))return;
      btn.dataset.pgNewsIcon=icon; btn.textContent="";
      const mark=document.createElement("span"); mark.className="pg-news-cat-icon"; mark.setAttribute("aria-hidden","true"); mark.textContent=icon;
      const labelSpan=document.createElement("span"); labelSpan.className="pg-news-cat-label"; labelSpan.textContent=label; btn.append(mark,labelSpan);
    });
    document.querySelectorAll(".petnews-image-fallback").forEach(fallback=>{
      const label=cleanCategoryLabel(text(fallback.querySelector("small"))); const mark=fallback.querySelector("span");
      if(mark)mark.textContent=CATEGORY_ICONS[label]||(/고양이|Cat|猫/.test(label)?"🐱":/강아지|Dog|犬/.test(label)?"🐶":"🐾");
    });
  }
  function parseJsonResponse(res){return res.json().catch(()=>({})).then(data=>{if(!res.ok){const err=new Error(data?.error||`요청에 실패했어요. (${res.status})`);err.status=res.status;err.code=data?.code||"";throw err}return data})}
  async function getUploadStatus(){const token=adminToken();if(!token)throw new Error("관리자 PIN 인증이 필요해요.");return parseJsonResponse(await fetch("/api/admin-music-upload",{method:"GET",credentials:"include",headers:{"X-PetGrow-Admin-Token":token}}))}
  async function saveMusicMetadata(payload){return parseJsonResponse(await fetch("/api/music?action=admin-save",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-PetGrow-Admin-Token":adminToken()},body:JSON.stringify(payload)}))}
  function safeExt(file,fallback){const n=String(file?.name||"").split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"");if(n&&n.length<=5)return n;const m=String(file?.type||"");if(m.includes("wav"))return"wav";if(m.includes("mp4")||m.includes("m4a"))return"m4a";if(m.includes("png"))return"png";if(m.includes("webp"))return"webp";if(m.includes("jpeg"))return"jpg";return fallback}
  function humanizeUploadError(error){const raw=String(error?.message||error||"업로드에 실패했어요.");if(/BLOB_READ_WRITE_TOKEN|blob.+token|No token/i.test(raw))return"Vercel Blob 저장소가 PetGrow 프로젝트에 연결되지 않았어요. Vercel → Storage에서 Public Blob을 연결한 뒤 다시 배포해 주세요.";if(/private|access.+public|store.+access/i.test(raw))return"Pet음악은 사용자에게 재생되어야 해서 Public Blob 저장소가 필요해요. Vercel Blob의 접근 방식을 Public으로 확인해 주세요.";if(/maximum|too large|size|413/i.test(raw))return"음원은 12MB 이하, 커버 이미지는 4MB 이하로 올려주세요.";if(/401|403|PIN|admin|관리자/i.test(raw))return raw;if(/Failed to fetch|NetworkError|network/i.test(raw))return"음원 업로드 서버에 연결하지 못했어요. 인터넷 연결과 Vercel 배포 상태를 확인한 뒤 다시 시도해 주세요.";return raw==="Failed"||/^failed$/i.test(raw)?"음원 업로드에 실패했어요. Vercel Blob 연결 상태를 확인한 뒤 다시 시도해 주세요.":raw}
  function setHealth(box,state,message){if(!box)return;box.className=`pg-music-upload-health ${state}`;box.innerHTML=`<span class="pg-music-upload-dot" aria-hidden="true"></span><span></span>`;box.lastElementChild.textContent=message}
  async function refreshMusicHealth(form){const box=form.querySelector(".pg-music-upload-health");if(!box||box.dataset.loading==="1")return;box.dataset.loading="1";setHealth(box,"checking","음원 저장소 연결 상태 확인 중…");try{const s=await getUploadStatus();s.blobConfigured?setHealth(box,"ok","음원 업로드 준비 완료 · MP3/WAV/M4A 최대 12MB"):setHealth(box,"warn","Vercel Blob 연결 필요 · Storage에서 Public Blob을 PetGrow에 연결해 주세요.")}catch(e){setHealth(box,"warn",humanizeUploadError(e))}finally{box.dataset.loading="0"}}
  function enhanceMusicForm(){document.querySelectorAll(".admin-music-form").forEach(form=>{if(!form.querySelector(".pg-music-upload-health")){const box=document.createElement("div");box.className="pg-music-upload-health checking";box.innerHTML=`<span class="pg-music-upload-dot" aria-hidden="true"></span><span>음원 저장소 연결 상태 확인 중…</span>`;const actionRow=[...form.querySelectorAll(".full")].find(el=>el.querySelector("button"));actionRow?form.insertBefore(box,actionRow):form.appendChild(box)}const audioInput=form.querySelector('input[type="file"][accept*="audio"]');const label=audioInput?.closest("label");if(label&&!label.querySelector(".pg-music-direct-note")){const note=document.createElement("small");note.className="bg-sub pg-music-direct-note";note.textContent="Suno MP3도 가능 · 브라우저에서 Vercel Blob으로 직접 업로드해 대용량 실패를 줄여요.";label.appendChild(note)}if(form.dataset.pgMusicHealthChecked!=="1"){form.dataset.pgMusicHealthChecked="1";refreshMusicHealth(form)}})}
  async function uploadMusicFile(file,kind,onProgress){const ext=safeExt(file,kind==="cover"?"jpg":"mp3");const base=String(file.name||`petgrow.${ext}`).replace(/\.[^.]+$/,"").replace(/[^0-9A-Za-z가-힣_-]+/g,"-").slice(0,60)||"petgrow";const folder=kind==="cover"?"petmusic/covers/admin":"petmusic/admin";return upload(`${folder}/${Date.now()}-${base}.${ext}`,file,{access:"public",handleUploadUrl:"/api/admin-music-upload",clientPayload:JSON.stringify({adminToken:adminToken(),kind}),contentType:file.type||undefined,multipart:kind==="audio",onUploadProgress:p=>{const n=Number(p?.percentage);if(Number.isFinite(n))onProgress(Math.max(0,Math.min(100,Math.round(n))))}})}
  function collectMusicForm(form){const title=form.querySelector('input.bg-input:not([type="file"])')?.value?.trim()||"";const selects=[...form.querySelectorAll("select.bg-input")];const textarea=form.querySelector("textarea.bg-input, textarea");const audioInput=form.querySelector('input[type="file"][accept*="audio"]');const imageInput=form.querySelector('input[type="file"][accept*="image"]');return{title,description:textarea?.value?.trim()||"",species:selects[0]?.value||"all",vocalType:selects[1]?.value||"instrumental",mood:selects[2]?.value||"relax",active:form.querySelector('input[type="checkbox"]')?.checked!==false,audioFile:audioInput?.files?.[0]||null,coverFile:imageInput?.files?.[0]||null}}
  function validateMusicFiles(d){if(!d.title)throw new Error("노래 제목을 입력해 주세요.");if(!d.audioFile)throw new Error("음원 파일을 선택해 주세요.");if(d.audioFile.size>MAX_AUDIO)throw new Error("음원 파일은 12MB 이하로 올려주세요.");if(d.coverFile&&d.coverFile.size>MAX_COVER)throw new Error("커버 이미지는 4MB 이하로 올려주세요.");if(d.audioFile.type&&!/^audio\//i.test(d.audioFile.type))throw new Error("MP3/WAV/M4A 형식의 음원을 선택해 주세요.");if(d.coverFile?.type&&!/^image\/(jpeg|png|webp)$/i.test(d.coverFile.type))throw new Error("커버는 JPG/PNG/WebP 이미지를 선택해 주세요.")}
  function addRuntimeMusicRow(data,result,coverUrl){const list=document.querySelector(".admin-music-list");if(!list)return;list.querySelectorAll(":scope > p").forEach(p=>p.remove());const row=document.createElement("div");row.className="admin-music-row pg-runtime-music-row";if(result?.id)row.dataset.pgRuntimeTrack=String(result.id);const thumb=coverUrl&&!coverUrl.includes("blank-white")?`<img class="admin-music-thumb" src="${String(coverUrl).replace(/"/g,"&quot;")}" alt=""/>`:`<div class="admin-music-thumb">🎵</div>`;row.innerHTML=`${thumb}<div><b></b><small></small></div><div class="admin-music-actions"><span class="pg-music-new-badge">등록 완료</span></div>`;row.querySelector("b").textContent=data.title;const species=data.species==="dog"?"강아지":data.species==="cat"?"고양이":"공용";const vocal=data.vocalType==="vocal"?"보컬":"인스트루멘탈";const mood=({relax:"휴식",sleep:"수면",play:"놀이",nature:"자연"})[data.mood]||"휴식";row.querySelector("small").textContent=`${species} · ${vocal} · ${mood} · 방금 등록 · ▶ 0 · ♥ 0 · 💬 0`;list.prepend(row);const head=list.closest(".bg-card")?.querySelector("h3");const m=/등록된 음악\s+(\d+)곡/.exec(text(head));if(head&&m)head.textContent=`등록된 음악 ${Number(m[1])+1}곡`}
  async function handleMusicCreate(form,button){if(musicBusy)return;const data=collectMusicForm(form);validateMusicFiles(data);musicBusy=true;button.disabled=true;const original=text(button)||"음악 등록";const health=form.querySelector(".pg-music-upload-health");try{button.textContent="저장소 확인 중…";const status=await getUploadStatus();if(!status.blobConfigured)throw new Error("Vercel Blob 저장소가 연결되지 않았어요. Vercel → Storage에서 Public Blob을 PetGrow 프로젝트에 연결해 주세요.");button.textContent="음원 업로드 0%";const audioBlob=await uploadMusicFile(data.audioFile,"audio",pct=>{button.textContent=`음원 업로드 ${pct}%`});let coverUrl="/petmusic/covers/blank-white.svg";if(data.coverFile){button.textContent="커버 업로드 0%";const coverBlob=await uploadMusicFile(data.coverFile,"cover",pct=>{button.textContent=`커버 업로드 ${pct}%`});coverUrl=coverBlob.url}button.textContent="등록 정보 저장 중…";const saved=await saveMusicMetadata({title:data.title,description:data.description,species:data.species,vocalType:data.vocalType,mood:data.mood,active:data.active,audioUrl:audioBlob.url,coverUrl});setHealth(health,"ok","등록 완료 · Pet음악 메뉴에 바로 반영됐어요.");addRuntimeMusicRow(data,saved,coverUrl);window.alert("Pet음악을 등록했어요.")}catch(e){const message=humanizeUploadError(e);setHealth(health,"error",message);window.alert(message)}finally{musicBusy=false;button.disabled=false;button.textContent=original}}
  function bindMusicCreateCapture(){if(document.documentElement.dataset.pgMusicCreateCapture==="1")return;document.documentElement.dataset.pgMusicCreateCapture="1";document.addEventListener("click",event=>{const button=event.target?.closest?.(".admin-music-form button");if(!button||!/^음악\s*등록$/.test(text(button)))return;const form=button.closest(".admin-music-form");if(!form)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();handleMusicCreate(form,button).catch(e=>window.alert(humanizeUploadError(e)))},true)}
  function run(){patchClipboard();polishReports();polishNews();enhanceMusicForm();bindMusicCreateCapture()}
  let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;run()})};const observer=new MutationObserver(schedule);
  function boot(){run();observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true})}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
