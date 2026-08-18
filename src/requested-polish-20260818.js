/* PetGrow requested runtime polish — 2026-08-18 */
(() => {
  const TERMS_NEWS = {
    title: "제26조 (Pet뉴스 서비스 이용조건)",
    body: "Pet뉴스는 외부 검색 API 기반의 뉴스 탐색 기능입니다. 기사 내용과 저작권은 각 기사 제공자에게 있으며, 건강·의료·정책 관련 뉴스는 전문적인 진단이나 법률·행정 자문을 대체하지 않습니다."
  };
  const TERMS_POINT = {
    title: "제27조 (PetPoint 운영)",
    body: "① PetPoint는 PetGrow 서비스 안에서만 사용하는 무료 활동 포인트이며 현금으로 구매·환전·출금하거나 다른 사람에게 양도할 수 없습니다.\n② 첫 이용 시 기본 포인트가 지급되고 Pet톡 글·댓글·좋아요 받기·하루 첫 접속 등 정상적인 활동에 따라 포인트가 적립될 수 있습니다.\n③ Pet사주·오늘의 펫운세·보호자 궁합·Pet타로 등 일부 재미 콘텐츠 이용 시 화면에 안내된 포인트가 차감됩니다.\n④ 반복 도배, 좋아요 취소 후 재좋아요 등 비정상 활동으로는 중복 적립되지 않으며 부정 적립은 지급 취소 또는 회수될 수 있습니다. 같은 게시글의 댓글 적립과 같은 글·같은 이용자의 좋아요 보상은 최초 인정 범위에 따라 제한될 수 있습니다."
  };
  const PRIVACY_NEWS = {
    title: "22. Pet뉴스 관련 개인정보 안내",
    body: "Pet뉴스는 공개 뉴스 검색 API를 이용합니다. 뉴스 조회를 위해 이용자의 이름, 계정정보, 반려동물 정보 등 개인정보를 뉴스 검색 제공자에게 전송하지 않습니다. 원문 보기를 선택하면 외부 언론사 페이지로 이동하며 이후 개인정보 처리는 해당 서비스의 정책이 적용됩니다."
  };
  const PRIVACY_POINT = {
    title: "23. PetPoint 운영 관련 개인정보",
    body: "PetPoint 운영을 위해 회원 내부 식별자, 적립·사용 사유, 증감 포인트, 처리 시각과 활동 참조값을 계정에 연결해 저장할 수 있습니다. 해당 정보는 포인트 중복 지급 방지, 정상 적립·차감 확인, 부정 이용 방지 및 이용 내역 제공을 위해 처리하며, 회원탈퇴 시 관계 법령상 보관 의무가 있는 경우를 제외하고 삭제합니다."
  };

  const text = (el) => (el?.textContent || "").trim();

  function makeLegalCard(item, key){
    const section=document.createElement("section");
    section.className="legal-section-card pg-legal-integrated-note";
    section.dataset.pgLegalKey=key;
    section.innerHTML=`<div class="legal-section-number"></div><div class="legal-section-content"><h2 class="legal-section-title"></h2><div class="legal-section-body"></div></div>`;
    section.querySelector(".legal-section-title").textContent=item.title;
    section.querySelector(".legal-section-body").textContent=item.body;
    return section;
  }

  function hideDetachedLegalAddenda(type){
    document.querySelectorAll(".petpoint-policy").forEach(el=>el.classList.add("pg-hidden-legal-addendum"));
    document.querySelectorAll("section.bg-card").forEach(el=>{
      const h=text(el.querySelector("h2"));
      if(type==="terms" && h==="Pet뉴스 서비스 이용조건") el.classList.add("pg-hidden-legal-addendum");
      if(type==="privacy" && h==="Pet뉴스 관련 개인정보 안내") el.classList.add("pg-hidden-legal-addendum");
    });
  }

  function renumberLegal(list){
    [...list.querySelectorAll(":scope > .legal-section-card")].forEach((card,index)=>{
      const n=card.querySelector(".legal-section-number");
      if(n) n.textContent=String(index+1).padStart(2,"0");
    });
  }

  function polishLegal(){
    document.querySelectorAll(".legal-page-shell").forEach(shell=>{
      const title=text(shell.querySelector(".legal-page-title"));
      const type=/이용약관|Terms/i.test(title)?"terms":/개인정보처리방침|Privacy/i.test(title)?"privacy":"";
      if(!type)return;
      shell.classList.add("pg-legal-polished");
      hideDetachedLegalAddenda(type);
      const list=shell.querySelector(".legal-section-list");
      if(!list)return;
      const existingKeys=new Set([...list.querySelectorAll("[data-pg-legal-key]")].map(x=>x.dataset.pgLegalKey));
      if(type==="terms"){
        const addendum=[...list.querySelectorAll(":scope > .legal-section-card")].find(card=>/부칙|Addendum/i.test(text(card.querySelector(".legal-section-title"))));
        if(!existingKeys.has("terms-news")) list.insertBefore(makeLegalCard(TERMS_NEWS,"terms-news"),addendum||null);
        if(!existingKeys.has("terms-point")) list.insertBefore(makeLegalCard(TERMS_POINT,"terms-point"),addendum||null);
      }else{
        if(!existingKeys.has("privacy-news")) list.appendChild(makeLegalCard(PRIVACY_NEWS,"privacy-news"));
        if(!existingKeys.has("privacy-point")) list.appendChild(makeLegalCard(PRIVACY_POINT,"privacy-point"));
      }
      renumberLegal(list);
    });
  }

  let totalMembers=null;
  let totalMembersLoading=false;
  function insertTotalMembers(sec){
    if(totalMembers==null)return;
    const wrap=sec.querySelector(":scope > div");
    if(!wrap)return;
    let card=wrap.querySelector(".pg-total-member-stat");
    if(!card){
      card=document.createElement("span");
      card.className="pg-total-member-stat";
      card.innerHTML="<small>전체 회원</small><b></b>";
      const first=wrap.querySelector(":scope > span");
      if(first?.nextSibling) wrap.insertBefore(card,first.nextSibling); else wrap.appendChild(card);
    }
    const b=card.querySelector("b");
    if(b)b.textContent=Number(totalMembers).toLocaleString();
  }

  function loadTotalMembers(sec){
    if(totalMembers!=null){insertTotalMembers(sec);return;}
    if(totalMembersLoading)return;
    totalMembersLoading=true;
    fetch("/api/admin-overview-lite",{credentials:"same-origin"})
      .then(r=>r.ok?r.json():Promise.reject(new Error("admin overview")))
      .then(j=>{totalMembers=Number(j.totalMembers)||0;document.querySelectorAll(".petpoint-admin").forEach(insertTotalMembers);})
      .catch(()=>{})
      .finally(()=>{totalMembersLoading=false;});
  }

  function polishAdmin(){
    document.querySelectorAll(".petpoint-admin").forEach(sec=>{
      sec.classList.add("pg-admin-point-polished");
      sec.querySelectorAll("small").forEach(s=>{
        const v=text(s);
        if(v==="포인트 회원") s.textContent="PetPoint 활성 회원";
        else if(v==="현재 잔액 합계") s.textContent="전체 활성 회원 보유 포인트";
      });
      loadTotalMembers(sec);
    });
    document.querySelectorAll(".admin-stat-grid .admin-stat-card small").forEach(s=>{
      if(text(s)==="현재 접속 추정") s.textContent="최근 5분 활성 세션";
    });
  }

  function run(){
    polishLegal();
    polishAdmin();
  }

  let raf=0;
  const schedule=()=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;run();});
  };
  const observer=new MutationObserver(schedule);
  function boot(){
    run();
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
