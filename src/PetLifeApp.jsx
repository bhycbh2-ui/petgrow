import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {upload} from "@vercel/blob/client";
import "./petlife.css";

const TYPES=[
  ["weight","⚖️","몸무게"],["vaccine","💉","예방접종"],["hospital","🏥","병원방문"],["medicine","💊","약"],
  ["food","🥣","사료"],["walk","🐕","산책"],["bath","🛁","목욕"],["grooming","✂️","미용"],["photo","📷","사진"],["health","🩺","건강기록"]
];
const TYPE_MAP=Object.fromEntries(TYPES.map(x=>[x[0],{icon:x[1],label:x[2]}]));
const TYPE_DESC={weight:"몸무게 변화",vaccine:"접종일과 다음 일정",hospital:"병원 방문 내역",medicine:"약·복용 기록",food:"사료·급여 기록",walk:"산책 시간",bath:"목욕 기록",grooming:"미용 기록",photo:"오늘의 사진",health:"컨디션·건강 메모"};
const today=()=>new Date().toISOString().slice(0,10);

async function api(action,{method="GET",body,params}={}){
  const q=new URLSearchParams({action,...(params||{})});
  const r=await fetch(`/api/petlife?${q}`,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"요청을 처리하지 못했어요.");
  return j;
}
function fmtDate(v){if(!v)return "";try{return new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(`${String(v).slice(0,10)}T00:00:00`));}catch{return String(v)}}
function daysUntil(v){if(!v)return null;const a=new Date(`${today()}T00:00:00`),b=new Date(`${String(v).slice(0,10)}T00:00:00`);return Math.ceil((b-a)/86400000)}

function PetLife(){
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(""),[pets,setPets]=useState([]),[petId,setPetId]=useState(""),[entries,setEntries]=useState([]),[upcoming,setUpcoming]=useState([]),[tab,setTab]=useState("timeline"),[report,setReport]=useState(null),[album,setAlbum]=useState(null),[entryModal,setEntryModal]=useState(null),[petModal,setPetModal]=useState(null),[toast,setToast]=useState("");
  const pet=useMemo(()=>pets.find(p=>p.id===petId)||pets[0]||null,[pets,petId]);
  const flash=(m)=>{setToast(m);window.setTimeout(()=>setToast(""),2200)};

  const loadPets=async(importIfEmpty=true)=>{
    setLoading(true);setError("");
    try{
      let j=await api("pets");
      if(!j.pets?.length&&importIfEmpty){
        const migrated=await api("import-legacy",{method:"POST",body:{}});j={pets:migrated.pets||[]};
        if(migrated.imported)flash(`기존 우리 아이 ${migrated.imported}마리를 PetLife로 가져왔어요.`);
      }
      setPets(j.pets||[]);setPetId(x=>(j.pets||[]).some(p=>p.id===x)?x:(j.pets?.[0]?.id||""));
    }catch(e){setError(e.message)}finally{setLoading(false)}
  };
  const loadEntries=async(id=pet?.id)=>{if(!id){setEntries([]);setUpcoming([]);return;}try{const j=await api("entries",{params:{petId:id,limit:"200"}});setEntries(j.entries||[]);setUpcoming(j.upcoming||[]);}catch(e){setError(e.message)}};
  const loadReport=async()=>{if(!pet)return;try{setReport(await api("report",{params:{petId:pet.id,days:"30"}}));}catch(e){setError(e.message)}};
  const loadAlbum=async()=>{if(!pet)return;try{setAlbum(await api("album",{params:{petId:pet.id}}));}catch(e){setError(e.message)}};

  useEffect(()=>{if(open)loadPets();},[open]);
  useEffect(()=>{if(open&&pet?.id){loadEntries(pet.id);setReport(null);setAlbum(null)}},[open,pet?.id]);
  useEffect(()=>{if(!open||!pet)return;if(tab==="report"&&!report)loadReport();if(tab==="album"&&!album)loadAlbum();},[tab,open,pet?.id]);
  useEffect(()=>{if(!open||!upcoming.length||typeof Notification==="undefined"||Notification.permission!=="granted")return;const soon=upcoming.filter(x=>{const d=daysUntil(x.nextDueOn);return d!=null&&d>=0&&d<=3});if(soon.length){const key=`petgrow-petlife-notified-${today()}-${pet?.id}`;if(!sessionStorage.getItem(key)){new Notification(`${pet?.name||"우리 아이"} PetLife 일정`,{body:`${soon[0].title} · ${fmtDate(soon[0].nextDueOn)}`});sessionStorage.setItem(key,"1")}}},[open,upcoming,pet?.id]);

  const savePet=async(form)=>{
    try{const action=form.petId?"pet-update":"pet-create";const j=await api(action,{method:"POST",body:form});setPetModal(null);await loadPets(false);if(j.pet?.id)setPetId(j.pet.id);flash("우리 아이 정보를 저장했어요.");}catch(e){setError(e.message)}
  };
  const deletePet=async()=>{if(!pet||!confirm(`${pet.name}의 PetLife 기록을 모두 삭제할까요?`))return;try{await api("pet-delete",{method:"POST",body:{petId:pet.id}});setPetId("");await loadPets(false);flash("삭제했어요.");}catch(e){setError(e.message)}};
  const saveEntry=async(form)=>{
    try{const action=form.entryId?"entry-update":"entry-create";await api(action,{method:"POST",body:{...form,petId:pet.id}});setEntryModal(null);await Promise.all([loadEntries(),loadPets(false)]);setReport(null);setAlbum(null);flash("PetLife에 기록했어요.");}catch(e){setError(e.message)}
  };
  const deleteEntry=async(entry)=>{if(!confirm("이 기록을 삭제할까요?"))return;try{await api("entry-delete",{method:"POST",body:{entryId:entry.id}});await loadEntries();setReport(null);setAlbum(null);flash("기록을 삭제했어요.");}catch(e){setError(e.message)}};
  const askNotify=async()=>{if(typeof Notification==="undefined")return flash("이 기기에서는 브라우저 알림을 지원하지 않아요.");const p=await Notification.requestPermission();flash(p==="granted"?"PetLife 일정 알림을 허용했어요.":"알림 권한이 허용되지 않았어요.")};
  const shareAlbum=async()=>{const text=`${pet?.name||"우리 아이"}의 PetGrow 성장앨범 🐾`;try{if(navigator.share)await navigator.share({title:`${pet?.name} 성장앨범`,text,url:location.origin});else{await navigator.clipboard.writeText(`${text} ${location.origin}`);flash("공유 문구를 복사했어요.")}}catch{}}

  return <>
    <button className="pl-launcher" onClick={()=>setOpen(true)} aria-label="PetLife 열기"><span>🐾</span><b>PetLife</b><small>평생기록</small></button>
    {open&&<div className="pl-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
      <section className="pl-shell" role="dialog" aria-modal="true" aria-label="PetLife">
        <header className="pl-head">
          <div className="pl-brand"><div className="pl-brandmark">🐾</div><div><small>PETGROW</small><h2>PetLife</h2><p>우리 아이의 오늘부터 평생까지</p></div></div>
          <button className="pl-close" onClick={()=>setOpen(false)} aria-label="PetLife 닫기">×</button>
        </header>
        {error&&<div className="pl-error">{error}<button onClick={()=>setError("")}>×</button></div>}
        {loading?<div className="pl-loading"><span className="pl-loadingpaw">🐾</span><b>PetLife를 준비하고 있어요</b><small>우리 아이 기록을 불러오는 중입니다.</small></div>:pets.length===0?<EmptyPet onAdd={()=>setPetModal({})}/>:<>
          <div className="pl-petbar">
            <div className="pl-petselect" aria-label="우리 아이 선택">{pets.map(p=><button key={p.id} className={p.id===pet?.id?"active":""} onClick={()=>setPetId(p.id)}>{p.photoUrl?<img src={p.photoUrl} alt=""/>:<span>{p.species==="cat"?"🐱":"🐶"}</span>}<b>{p.name}</b></button>)}<button className="pl-addpet" onClick={()=>setPetModal({})} aria-label="우리 아이 추가">＋</button></div>
            <div className="pl-petmeta"><div className="pl-petidentity"><div className="pl-petavatar">{pet.photoUrl?<img src={pet.photoUrl} alt=""/>:<span>{pet.species==="cat"?"🐱":"🐶"}</span>}</div><div><small>MY PET</small><b>{pet.name}</b><span>{pet.breed|| (pet.species==="cat"?"고양이":"강아지")}{pet.weightKg?` · ${pet.weightKg}kg`:""}</span></div></div><div className="pl-petactions"><button onClick={()=>setPetModal({...pet,petId:pet.id})}>정보 수정</button><button className="danger" onClick={deletePet}>삭제</button></div></div>
          </div>
          <nav className="pl-tabs">{[["timeline","기록"],["schedule","일정"],["report","리포트"],["album","성장앨범"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</nav>
          <main className="pl-body">
            {tab==="timeline"&&<Timeline pet={pet} entries={entries} onAdd={type=>setEntryModal({category:type||"",occurredOn:today()})} onEdit={setEntryModal} onDelete={deleteEntry}/>} 
            {tab==="schedule"&&<Schedule upcoming={upcoming} onNotify={askNotify} onAdd={()=>setEntryModal({category:"vaccine",occurredOn:today(),nextDueOn:today()})}/>} 
            {tab==="report"&&<Report report={report} pet={pet} onReload={loadReport}/>} 
            {tab==="album"&&<Album album={album} pet={pet} onAdd={()=>setEntryModal({category:"photo",occurredOn:today()})} onShare={shareAlbum}/>} 
          </main>
        </>}
      </section>
    </div>}
    {entryModal&&pet&&<EntryModal initial={entryModal} pet={pet} onClose={()=>setEntryModal(null)} onSave={saveEntry}/>} 
    {petModal&&<PetModal initial={petModal} onClose={()=>setPetModal(null)} onSave={savePet}/>} 
    {toast&&<div className="pl-toast">{toast}</div>}
  </>;
}

function EmptyPet({onAdd}){return <div className="pl-empty"><span>🐾</span><h3>PetLife를 시작해 보세요</h3><p>몸무게, 예방접종, 병원, 산책, 사진까지 우리 아이의 평생 기록을 한곳에 모아보세요.</p><button className="pl-primary" onClick={onAdd}>우리 아이 등록</button></div>}

function Timeline({pet,entries,onAdd,onEdit,onDelete}){return <div className="pl-panel"><div className="pl-sectionhead"><div><small>{pet.name} LIFE</small><h3>평생 타임라인</h3><p>자주 쓰는 기록은 아래에서 한 번에 추가할 수 있어요.</p></div><button className="pl-primary pl-addrecord" onClick={()=>onAdd("")}>＋ 기록 추가</button></div><div className="pl-quicktypes">{TYPES.map(([k,i,l])=><button key={k} onClick={()=>onAdd(k)}><span>{i}</span><b>{l}</b><small>{TYPE_DESC[k]}</small></button>)}</div>{entries.length===0?<div className="pl-empty small"><span>🌱</span><h4>첫 기록을 남겨보세요</h4><p>오늘의 몸무게나 산책부터 시작하면 월간 리포트와 성장 기록이 더 풍성해집니다.</p></div>:<div className="pl-timeline">{entries.map(e=><article key={e.id} className="pl-entry"><div className="pl-entryicon">{TYPE_MAP[e.category]?.icon||"🐾"}</div><div className="pl-entrybody"><time>{fmtDate(e.occurredOn)}</time><h4>{e.title}</h4><div className="pl-entryfacts">{e.weightKg!=null&&<b>{e.weightKg}kg</b>}{e.durationMinutes&&<span>{e.durationMinutes}분</span>}{e.amountText&&<span>{e.amountText}</span>}{e.clinicName&&<span>{e.clinicName}</span>}</div>{e.note&&<p>{e.note}</p>}{e.photoUrl&&<img className="pl-entryphoto" src={e.photoUrl} alt={e.title}/>} {e.nextDueOn&&<div className="pl-duechip">다음 일정 {fmtDate(e.nextDueOn)}</div>}</div><div className="pl-entryactions"><button onClick={()=>onEdit({...e,entryId:e.id})}>수정</button><button onClick={()=>onDelete(e)}>삭제</button></div></article>)}</div>}</div>}

function Schedule({upcoming,onNotify,onAdd}){return <div className="pl-panel"><div className="pl-sectionhead"><div><small>HEALTH SCHEDULE</small><h3>다가오는 건강일정</h3><p>예방접종·병원·약·미용의 다음 일정을 모아봅니다.</p></div><button onClick={onNotify}>🔔 알림 허용</button></div>{upcoming.length===0?<div className="pl-empty small"><span>📅</span><h4>예정된 일정이 없어요</h4><p>예방접종이나 병원 기록에 다음 일정을 추가하면 여기에 자동으로 표시됩니다.</p><button className="pl-primary" onClick={onAdd}>일정 추가</button></div>:<div className="pl-schedule">{upcoming.map(e=>{const d=daysUntil(e.nextDueOn);return <article key={e.id}><div><b>{TYPE_MAP[e.category]?.icon||"📅"} {e.title}</b><span>{fmtDate(e.nextDueOn)}</span></div><strong className={d<=3?"urgent":""}>{d===0?"오늘":d>0?`D-${d}`:"지남"}</strong></article>})}</div>}<p className="pl-note">알림 권한을 허용하면 PetGrow를 사용할 때 가까운 일정을 알려드려요. 앱이 완전히 종료된 상태의 푸시는 추후 확장할 수 있습니다.</p></div>}

function Report({report,pet,onReload}){if(!report)return <div className="pl-loading"><span className="pl-loadingpaw">📊</span><b>이번 달 {pet.name} 리포트를 만들고 있어요</b><small>최근 30일 기록을 정리하는 중입니다.</small></div>;const c=report.counts||{};return <div className="pl-panel"><div className="pl-sectionhead"><div><small>30-DAY CARE REPORT</small><h3>이번 달 {pet.name} 리포트</h3><p>최근 30일 기록을 한눈에 확인하세요.</p></div><button onClick={onReload}>새로고침</button></div><div className="pl-reportgrid"><div><small>현재 체중</small><b>{pet.weightKg?`${pet.weightKg}kg`:'기록 필요'}</b></div><div><small>산책 기록</small><b>{c.walk||0}회</b></div><div><small>건강·병원</small><b>{(c.health||0)+(c.hospital||0)}건</b></div><div><small>예정 일정</small><b>{report.upcoming?.length||0}건</b></div></div>{report.weights?.length>1&&<WeightChart items={report.weights}/>}<div className="pl-insights"><h4>기록 기반 관리 포인트</h4>{report.insights.map((x,i)=><p key={i}><span>✓</span>{x}</p>)}</div><div className="pl-disclaimer">⚕️ {report.disclaimer}</div></div>}

function WeightChart({items}){const values=items.map(x=>x.kg);const min=Math.min(...values),max=Math.max(...values),range=Math.max(.1,max-min);const points=items.map((x,i)=>`${(i/(items.length-1))*100},${90-((x.kg-min)/range)*70}`).join(" ");return <div className="pl-chart"><div><b>최근 체중 변화</b><span>{values[0]}kg → {values[values.length-1]}kg</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg></div>}

function Album({album,pet,onAdd,onShare}){if(!album)return <div className="pl-loading"><span className="pl-loadingpaw">📷</span><b>성장앨범을 정리하고 있어요</b><small>사진을 월령 순서로 모으는 중입니다.</small></div>;return <div className="pl-panel"><div className="pl-sectionhead"><div><small>GROWTH ALBUM</small><h3>{pet.name} 성장앨범</h3><p>기록한 사진이 시간순으로 자동 정리됩니다.</p></div><div><button onClick={onShare}>공유</button><button className="pl-primary" onClick={onAdd}>＋ 사진</button></div></div>{album.photos.length===0?<div className="pl-empty small"><span>📸</span><h4>아직 사진 기록이 없어요</h4><p>오늘 사진부터 남겨두면 성장 과정이 자연스럽게 앨범으로 쌓입니다.</p></div>:<><div className="pl-milestones">{album.milestones.filter(m=>m.photo).map(m=><article key={m.month}><img src={m.photo.photoUrl}/><b>{m.month}개월</b><span>{fmtDate(m.photo.occurredOn)}</span></article>)}</div><div className="pl-photogrid">{album.photos.map(p=><figure key={p.id}><img src={p.photoUrl}/><figcaption>{p.ageMonths!=null?`${p.ageMonths}개월 · `:""}{fmtDate(p.occurredOn)}</figcaption></figure>)}</div></>}</div>}

function PetModal({initial,onClose,onSave}){
  const [f,setF]=useState({petId:initial.petId||"",name:initial.name||"",species:initial.species||"dog",breed:initial.breed||"",birthDate:String(initial.birthDate||"").slice(0,10),sex:initial.sex||"unknown",weightKg:initial.weightKg??"",photoUrl:initial.photoUrl||"",notes:initial.notes||""});
  return <Modal title={f.petId?"우리 아이 정보 수정":"우리 아이 등록"} subtitle="프로필 정보는 PetLife 전체에서 함께 사용돼요." onClose={onClose}><div className="pl-form"><div className="pl-formsection"><span className="pl-formstep">기본 정보</span><label>이름<input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="예: 꼬미"/></label><div className="pl-formrow"><label>종류<select value={f.species} onChange={e=>setF({...f,species:e.target.value})}><option value="dog">강아지</option><option value="cat">고양이</option><option value="other">기타</option></select></label><label>성별<select value={f.sex} onChange={e=>setF({...f,sex:e.target.value})}><option value="unknown">미입력</option><option value="male">수컷</option><option value="female">암컷</option></select></label></div><label>품종<input value={f.breed} onChange={e=>setF({...f,breed:e.target.value})} placeholder="예: 말티푸"/></label><div className="pl-formrow"><label>생년월일<input type="date" value={f.birthDate} onChange={e=>setF({...f,birthDate:e.target.value})}/></label><label>현재 몸무게 (kg)<input inputMode="decimal" value={f.weightKg} onChange={e=>setF({...f,weightKg:e.target.value})} placeholder="1.8"/></label></div></div><div className="pl-formsection compact"><span className="pl-formstep">선택 정보</span><label>메모<textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="알레르기, 특이사항 등"/></label></div><button className="pl-primary wide" onClick={()=>onSave(f)}>정보 저장</button></div></Modal>
}

function EntryModal({initial,pet,onClose,onSave}){
  const [f,setF]=useState({entryId:initial.entryId||"",category:initial.category||"",occurredOn:String(initial.occurredOn||today()).slice(0,10),title:initial.title||"",note:initial.note||"",weightKg:initial.weightKg??"",amountText:initial.amountText||"",durationMinutes:initial.durationMinutes??"",photoUrl:initial.photoUrl||"",clinicName:initial.clinicName||"",nextDueOn:String(initial.nextDueOn||"").slice(0,10)});
  const [uploading,setUploading]=useState(false),[saving,setSaving]=useState(false),[uploadError,setUploadError]=useState("");
  const hasExistingDetail=Boolean(initial.entryId&&(initial.title||initial.note||initial.photoUrl));
  const [more,setMore]=useState(hasExistingDetail||initial.category==="photo"||initial.category==="health");
  const type=f.category?TYPE_MAP[f.category]:null;

  const selectType=(category)=>{setF(x=>({...x,category,title:x.entryId?x.title:""}));setMore(category==="photo"||category==="health")};
  const pickPhoto=async(file)=>{if(!file)return;setUploading(true);setUploadError("");try{const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const blob=await upload(`petlife/${pet.id}/${Date.now()}-${safe}`,file,{access:"public",handleUploadUrl:"/api/petlife-upload",clientPayload:JSON.stringify({petId:pet.id})});setF(x=>({...x,photoUrl:blob.url,title:x.title||`${TYPE_MAP[x.category]?.label||"사진"} 기록`}))}catch(e){setUploadError(e.message||"사진 업로드에 실패했어요.")}finally{setUploading(false)}};
  const submit=async()=>{if(!f.category||uploading||saving)return;setSaving(true);try{await onSave({...f,title:f.title.trim()||`${type.label} 기록`})}finally{setSaving(false)}};

  if(!f.category)return <Modal title="기록 추가" subtitle={`${pet.name}의 오늘을 무엇으로 남길까요?`} onClose={onClose}><div className="pl-form pl-typepicker"><div className="pl-pickerintro"><span>🐾</span><div><b>기록 종류를 선택하세요</b><p>선택한 항목에 필요한 입력만 보여드릴게요.</p></div></div><div className="pl-pickergrid">{TYPES.map(([k,i,l])=><button key={k} onClick={()=>selectType(k)}><span>{i}</span><div><b>{l}</b><small>{TYPE_DESC[k]}</small></div><em>›</em></button>)}</div></div></Modal>;

  const directNote=f.category==="health";
  const directPhoto=f.category==="photo";
  return <Modal title={f.entryId?"기록 수정":"기록 추가"} subtitle={`${pet.name} · ${type.label}`} onClose={onClose}><div className="pl-form">
    <div className="pl-selectedtype"><span>{type.icon}</span><div><small>선택한 기록</small><b>{type.label}</b><p>{TYPE_DESC[f.category]}</p></div>{!f.entryId&&<button onClick={()=>setF(x=>({...x,category:""}))}>변경</button>}</div>
    <div className="pl-formsection"><span className="pl-formstep">필수 정보</span><label>날짜<input type="date" value={f.occurredOn} onChange={e=>setF({...f,occurredOn:e.target.value})}/></label>
      {f.category==="weight"&&<label>몸무게 (kg)<input autoFocus inputMode="decimal" value={f.weightKg} onChange={e=>setF({...f,weightKg:e.target.value})} placeholder="예: 1.8"/></label>}
      {f.category==="walk"&&<label>산책 시간 (분)<input autoFocus inputMode="numeric" value={f.durationMinutes} onChange={e=>setF({...f,durationMinutes:e.target.value})} placeholder="예: 30"/></label>}
      {["medicine","food"].includes(f.category)&&<label>{f.category==="medicine"?"약 이름 · 복용량":"사료 이름 · 급여량"}<input autoFocus value={f.amountText} onChange={e=>setF({...f,amountText:e.target.value})} placeholder={f.category==="medicine"?"예: 영양제 1정":"예: 사료 45g"}/></label>}
      {f.category==="hospital"&&<label>병원명<input autoFocus value={f.clinicName} onChange={e=>setF({...f,clinicName:e.target.value})} placeholder="예: PetGrow 동물병원"/></label>}
      {["vaccine","hospital","medicine","grooming"].includes(f.category)&&<label>다음 일정 <small className="pl-optional">선택</small><input type="date" value={f.nextDueOn} onChange={e=>setF({...f,nextDueOn:e.target.value})}/></label>}
      {directNote&&<label>건강 메모<textarea autoFocus value={f.note} onChange={e=>setF({...f,note:e.target.value})} placeholder="오늘 컨디션이나 특이사항을 간단히 적어주세요."/></label>}
      {directPhoto&&<PhotoField f={f} uploading={uploading} uploadError={uploadError} pickPhoto={pickPhoto}/>} 
    </div>
    {!directNote&&!directPhoto&&<button className={`pl-more-toggle ${more?"open":""}`} onClick={()=>setMore(x=>!x)}><span>＋ 메모 · 사진 · 제목</span><b>{more?"접기":"선택 사항"}</b></button>}
    {(more||directNote||directPhoto)&&<div className="pl-formsection compact pl-extra">
      <span className="pl-formstep">추가 정보</span>
      <label>기록 제목 <small className="pl-optional">선택</small><input value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder={`${type.label} 기록`}/></label>
      {!directNote&&<label>메모 <small className="pl-optional">선택</small><textarea value={f.note} onChange={e=>setF({...f,note:e.target.value})} placeholder="기억해둘 내용을 간단히 적어주세요."/></label>}
      {!directPhoto&&<PhotoField f={f} uploading={uploading} uploadError={uploadError} pickPhoto={pickPhoto}/>} 
    </div>}
    <button className="pl-primary wide pl-save" disabled={uploading||saving} onClick={submit}>{uploading?"사진 업로드 중…":saving?"저장 중…":f.entryId?"수정 내용 저장":"PetLife에 저장"}</button>
  </div></Modal>
}

function PhotoField({f,uploading,uploadError,pickPhoto}){return <><label className="pl-photochoose">사진 <small className="pl-optional">선택</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>pickPhoto(e.target.files?.[0])}/><span><b>{uploading?"업로드 중…":f.photoUrl?"사진 변경":"사진 선택"}</b><small>JPG · PNG · WEBP, 최대 8MB</small></span></label>{uploadError&&<p className="pl-uploaderror">{uploadError}</p>}{f.photoUrl&&<img className="pl-preview" src={f.photoUrl} alt="선택한 사진 미리보기"/>}</>}

function Modal({title,subtitle,onClose,children}){return <div className="pl-modalback" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="pl-modal" role="dialog" aria-modal="true" aria-label={title}><header><div><small>PETLIFE</small><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div><button onClick={onClose} aria-label="닫기">×</button></header>{children}</section></div>}

export function bootPetLife(){
  if(typeof document==="undefined"||document.getElementById("petlife-react-root"))return;
  const el=document.createElement("div");el.id="petlife-react-root";document.body.appendChild(el);createRoot(el).render(<PetLife/>);
}
