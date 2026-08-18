/* PetGrow runtime behavior + locale safety fixes — 2026-08-18
 * Kept intentionally small and DOM-scoped so the latest App.jsx remains the source of truth.
 */

const PG_COPY = {
  ko: {
    petLife: "반려생활", content: "커뮤니티 · 콘텐츠", info: "정보 · 지원",
    home: "Home", about: "소개", pets: "우리 아이", nearby: "내 주변 Pet", music: "Pet음악",
    talk: "Pet톡", bti: "PetBTI", saju: "Pet사주", tarot: "Pet타로", tips: "Pet정보", news: "Pet뉴스",
    tagline: "우리 아이의 건강한 성장을 함께", day: "우리 아이와 더 행복한 하루",
    homeDesc: "우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요.",
    todayPet: "오늘의 우리 아이", weight: "현재 체중", gender: "성별", type: "구분",
    quick: "자주 사용하는 메뉴", waitTitle: "결과를 준비하고 있어요",
    waitDesc: "우리 아이에게 맞는 내용을 불러오는 중이에요. 잠시만 기다려주세요.",
    sajuChoose: n => `${n}와 어떤 Pet사주를 볼까요?`,
    sajuChooseDesc: "원하는 콘텐츠를 골라 재미로 즐겨보세요.",
    tarotEyebrow: "PETGROW 타로 · 메이저 아르카나 22장", tarotTitle: n => `${n}의 Pet타로`
  },
  en: {
    petLife: "PET LIFE", content: "COMMUNITY · CONTENT", info: "INFO · SUPPORT",
    home: "Home", about: "About PetGrow", pets: "My Pets", nearby: "Nearby Pet", music: "Pet Music",
    talk: "Pet Talk", bti: "PetBTI", saju: "Pet Saju", tarot: "Pet Tarot", tips: "Pet Info", news: "Pet News",
    tagline: "Healthy growth, together", day: "A happier day with your pet",
    homeDesc: "Everything your pet needs, in one simple dashboard.",
    todayPet: "TODAY WITH MY PET", weight: "Weight", gender: "Gender", type: "Type",
    quick: "Quick access", waitTitle: "Preparing your result",
    waitDesc: "We are loading your pet's personalized result. Please wait a moment.",
    sajuChoose: n => `Choose ${n}'s Pet Saju`, sajuChooseDesc: "Choose one of three fun contents.",
    tarotEyebrow: "PETGROW TAROT · 22 MAJOR ARCANA", tarotTitle: n => `${n}'s Pet Tarot`
  },
  ja: {
    petLife: "ペットライフ", content: "コミュニティ・コンテンツ", info: "情報・サポート",
    home: "ホーム", about: "PetGrowについて", pets: "うちの子", nearby: "近くのPet", music: "Pet音楽",
    talk: "Petトーク", bti: "PetBTI", saju: "Pet占い", tarot: "Petタロット", tips: "Pet情報", news: "Petニュース",
    tagline: "うちの子の健やかな成長を一緒に", day: "うちの子ともっと幸せな一日",
    homeDesc: "成長・音楽・周辺施設・コミュニティをひとつの画面で確認できます。",
    todayPet: "今日のうちの子", weight: "現在の体重", gender: "性別", type: "種類",
    quick: "よく使うメニュー", waitTitle: "結果を準備しています",
    waitDesc: "うちの子に合った内容を読み込んでいます。少しお待ちください。",
    sajuChoose: n => `${n}のPet占いを選んでください`, sajuChooseDesc: "3つのコンテンツから選んで気軽に楽しめます。",
    tarotEyebrow: "PETGROW タロット · 大アルカナ22枚", tarotTitle: n => `${n}のPetタロット`
  },
  zh: {
    petLife: "宠物生活", content: "社区 · 内容", info: "信息 · 支持",
    home: "首页", about: "关于 PetGrow", pets: "我的宠物", nearby: "附近Pet", music: "Pet音乐",
    talk: "Pet社区", bti: "PetBTI", saju: "Pet命理", tarot: "Pet塔罗", tips: "Pet信息", news: "Pet新闻",
    tagline: "陪伴宠物健康成长", day: "和宠物一起度过更幸福的一天",
    homeDesc: "在一个页面查看成长、音乐、周边设施和社区内容。",
    todayPet: "今天的宠物", weight: "当前体重", gender: "性别", type: "类型",
    quick: "常用菜单", waitTitle: "正在准备结果",
    waitDesc: "正在加载适合你宠物的内容，请稍等片刻。",
    sajuChoose: n => `请选择${n}的Pet命理内容`, sajuChooseDesc: "从三种趣味内容中选择一项即可。",
    tarotEyebrow: "PETGROW 塔罗 · 22张大阿尔卡那", tarotTitle: n => `${n}的Pet塔罗`
  }
};

const HERO_COPY = {
  ja: {
    pets:["うちの子","基本情報、成長記録、写真、健康情報をひとつの場所で管理できます。"],
    community:["Petトーク","日常の出来事や質問、ペット暮らしの情報を気軽に共有しましょう。"],
    tips:["Pet情報","健康・食事・暮らし・しつけに役立つ情報をまとめています。"],
    saju:["Pet占い","うちの子の生年月日をもとに、気軽に楽しめる特別なコンテンツです。"],
    tarot:["Petタロット","今日のテーマに合わせてカードを選び、うちの子へのメッセージを確認しましょう。"],
    petbti:["PetBTI","行動に関する質問から、うちの子の個性を楽しくチェックできます。"],
    guide:["情報ガイド","PetGrowの主な機能と使い方をわかりやすく確認できます。"],
    my:["マイページ","会員情報、アクティビティ、お気に入りをまとめて管理できます。"],
    more:["その他","PetGrowの追加機能とサポートメニューを確認できます。"],
    nearby:["近くのPet","住所や現在地をもとに近くのペット関連施設を探せます。"],
    music:["Pet音楽","犬と猫のための音楽を聴き、お気に入りやコメントを楽しめます。"],
    news:["Petニュース","犬・猫・健康・制度など最新のペットニュースを読みやすくまとめています。"],
    support:["サポート","サービス利用中の質問やサポート依頼を送れます。"],
    "ad-inquiry":["広告・提携のお問い合わせ","PetGrowとの広告や提携についてお問い合わせください。"]
  },
  zh: {
    pets:["我的宠物","在一个页面管理基本信息、成长记录、照片和健康信息。"],
    community:["Pet社区","轻松分享宠物日常、问题和养宠经验。"],
    tips:["Pet信息","查看健康、饮食、生活和训练等实用养宠信息。"],
    saju:["Pet命理","根据宠物生日体验轻松有趣的专属内容。"],
    tarot:["Pet塔罗","按今日主题选择卡牌，查看送给宠物的趣味信息。"],
    petbti:["PetBTI","通过行为问题了解宠物的个性特点。"],
    guide:["信息指南","快速了解 PetGrow 的主要功能和使用方法。"],
    my:["我的页面","统一管理账号信息、活动记录和收藏内容。"],
    more:["更多","查看 PetGrow 的更多功能和支持菜单。"],
    nearby:["附近Pet","根据地址或当前位置查找附近的宠物相关设施。"],
    music:["Pet音乐","收听犬猫音乐，并通过点赞和评论记录宠物反应。"],
    news:["Pet新闻","浏览犬猫、健康、政策等最新宠物资讯。"],
    support:["客户支持","提交使用 PetGrow 时遇到的问题或需要的帮助。"],
    "ad-inquiry":["广告合作","联系 PetGrow 咨询广告与合作事项。"]
  }
};

const HERO_KEY_BY_TITLE = new Map([
  ["우리 아이","pets"],["My Pet","pets"],["My Pets","pets"],["うちの子","pets"],["我的宠物","pets"],
  ["Pet톡","community"],["Pet Talk","community"],["Petトーク","community"],["Pet社区","community"],
  ["Pet정보","tips"],["Pet Info","tips"],["Pet情報","tips"],["Pet信息","tips"],
  ["Pet사주","saju"],["Pet Saju","saju"],["Pet占い","saju"],["Pet命理","saju"],
  ["Pet타로","tarot"],["Pet Tarot","tarot"],["Petタロット","tarot"],["Pet塔罗","tarot"],
  ["PetBTI","petbti"],
  ["정보가이드","guide"],["Guide","guide"],["情報ガイド","guide"],["信息指南","guide"],
  ["마이페이지","my"],["My Page","my"],["マイページ","my"],["我的页面","my"],
  ["더보기","more"],["More","more"],["その他","more"],["更多","more"],
  ["내 주변 Pet","nearby"],["Nearby Pet","nearby"],["近くのPet","nearby"],["附近Pet","nearby"],
  ["Pet음악","music"],["Pet Music","music"],["Pet音楽","music"],["Pet音乐","music"],
  ["Pet뉴스","news"],["Pet News","news"],["Petニュース","news"],["Pet新闻","news"],
  ["고객지원","support"],["Support","support"],["サポート","support"],["客户支持","support"],
  ["광고 문의","ad-inquiry"],["Advertising","ad-inquiry"],["広告・提携のお問い合わせ","ad-inquiry"],["广告合作","ad-inquiry"]
]);

function currentLang(){
  const active=[...document.querySelectorAll('.lang-toggle button.active')][0];
  const raw=(active?.textContent||'KO').trim().toUpperCase();
  if(raw==='EN') return 'en';
  if(raw==='JA') return 'ja';
  if(raw.includes('中文')) return 'zh';
  return 'ko';
}
function copy(){ return PG_COPY[currentLang()] || PG_COPY.ko; }
function setText(el,value){ if(el && typeof value==='string' && el.textContent!==value) el.textContent=value; }
function buttonSpan(button){ return button?.querySelector('span:last-child') || null; }

function applySidebar(){
  const nav=document.querySelector('.petgrow-sidebar-nav.petgrow-sidebar-nav-grouped');
  if(!nav) return;
  const c=copy();
  const section=[...nav.querySelectorAll(':scope > .sidebar-section-label')];
  setText(section[0],c.petLife); setText(section[1],c.content); setText(section[2],c.info);
  const buttons=[...nav.querySelectorAll(':scope > button')];
  // Current React order: home / pets / nearby / music / community / bti / saju / tarot / tips / news / about.
  const labels=[c.home,c.pets,c.nearby,c.music,c.talk,c.bti,c.saju,c.tarot,c.tips,c.news,c.about];
  buttons.forEach((b,i)=>{ if(labels[i]) setText(buttonSpan(b),labels[i]); });
}

function applyHamburger(){
  const panel=document.querySelector('.ham-panel'); if(!panel) return;
  const c=copy();
  const groups=[...panel.querySelectorAll('.ham-nav-group')];
  const sectionLabels=[c.petLife,c.content,c.info];
  const groupLabels=[[c.pets,c.nearby,c.music],[c.talk,c.bti,c.saju,c.tarot],[c.tips,c.news,c.about]];
  groups.forEach((g,gi)=>{
    setText(g.querySelector('.ham-section-label'),sectionLabels[gi]);
    [...g.querySelectorAll('.ham-nav-item')].forEach((b,bi)=>{ if(groupLabels[gi]?.[bi]) setText(buttonSpan(b),groupLabels[gi][bi]); });
  });
  const home=panel.querySelector('.ham-nav > .ham-nav-item'); if(home) setText(buttonSpan(home),c.home);
}

function inferHeroKey(hero){
  if(document.querySelector('.pets-page-top') && hero.closest('.pets-page-top')) return 'pets';
  if(document.querySelector('.feature-page-saju')) return 'saju';
  if(document.querySelector('.feature-page-tarot')) return 'tarot';
  if(document.querySelector('.feature-page-petbti')) return 'petbti';
  const title=(hero.querySelector('h1')?.textContent||'').trim();
  return HERO_KEY_BY_TITLE.get(title) || '';
}
function applyHero(){
  const lang=currentLang();
  if(lang!=='ja' && lang!=='zh') return;
  document.querySelectorAll('.petgrow-unified-hero').forEach(hero=>{
    const key=inferHeroKey(hero); const v=HERO_COPY[lang]?.[key]; if(!v) return;
    setText(hero.querySelector('h1'),v[0]); setText(hero.querySelector('p'),v[1]);
    if(key==='pets'){
      const help=hero.querySelector('.nearby-search-help');
      setText(help,lang==='ja'?'🐾 犬と猫をそれぞれ登録して、うちの子の変化を少しずつ記録しましょう。':'🐾 分别登记犬猫信息，持续记录宠物的成长变化。');
    }
  });
}

function applyHome(){
  const root=document.querySelector('.petgrow-dashboard-home'); if(!root) return;
  const c=copy();
  setText(root.querySelector('.dash-welcome p'),c.homeDesc);
  setText(root.querySelector('.dash-pet-copy > small'),c.todayPet);
  const metricLabels=[...root.querySelectorAll('.dash-pet-metrics small')];
  setText(metricLabels[0],c.weight); setText(metricLabels[1],c.gender); setText(metricLabels[2],c.type);
  const heads=[...root.querySelectorAll('.dash-section-head h2')];
  const quickHead=heads.find(x=>/자주 사용하는 메뉴|Quick access|よく使うメニュー|常用菜单/.test(x.textContent||''));
  setText(quickHead,c.quick);
  // Quick-access cards: this also prevents the English Nearby label from becoming visually blank.
  const quickButtons=[...root.querySelectorAll('.dash-quick-grid button')];
  const labels=[c.pets,c.music,c.news,c.nearby,c.talk,c.bti];
  quickButtons.forEach((b,i)=>{ if(labels[i]) setText(b.querySelector('span'),labels[i]); });
}

function selectedFeaturePetName(page){
  const explicit=page.querySelector('.feature-pet-name')?.textContent?.trim();
  if(explicit) return explicit;
  const buttons=[...page.querySelectorAll('.feature-pet-picker button')];
  const chosen=buttons.find(b=>Number.parseFloat(getComputedStyle(b).opacity)>=0.95) || buttons[0];
  return chosen?.querySelector(':scope > span:last-child')?.textContent?.trim() || chosen?.textContent?.trim() || '';
}

function applyFeatureCopy(){
  const lang=currentLang(); const c=copy();
  const saju=document.querySelector('.feature-page-saju');
  if(saju){
    const name=selectedFeaturePetName(saju) || (lang==='ja'?'うちの子':lang==='zh'?'宠物':lang==='en'?'My Pet':'우리 아이');
    const h2=saju.querySelector('.feature-module-shell h2.pet-user-name');
    if(h2) setText(h2,c.sajuChoose(name));
    if(h2){ const p=h2.nextElementSibling; if(p?.matches('.bg-sub')) setText(p,c.sajuChooseDesc); }
  }
  const tarot=document.querySelector('.feature-page-tarot');
  if(tarot){
    const stage=tarot.querySelector('.pet-tarot-stage');
    if(stage){
      const name=selectedFeaturePetName(tarot) || (lang==='ja'?'うちの子':lang==='zh'?'宠物':lang==='en'?'My Pet':'우리 아이');
      setText(stage.querySelector('.pet-daily-eyebrow'),c.tarotEyebrow);
      setText(stage.querySelector(':scope > h2'),c.tarotTitle(name));
    }
  }
}

function syncTarotPetHeader(){
  const page=document.querySelector('.feature-page-tarot'); if(!page) return;
  const stage=page.querySelector('.pet-tarot-stage'); if(!stage) return;
  const buttons=[...page.querySelectorAll('.feature-pet-picker button')];
  const chosen=buttons.find(b=>Number.parseFloat(getComputedStyle(b).opacity)>=0.95) || buttons[0];
  let name=(chosen?.querySelector(':scope > span:last-child')?.textContent||'').trim();
  if(!name) name=(page.querySelector('.pet-user-name')?.textContent||'').trim();
  if(!name) return;
  let head=stage.querySelector('.pg-tarot-pet-head');
  if(!head){
    head=document.createElement('div'); head.className='pg-tarot-pet-head';
    const avatar=document.createElement('span'); avatar.className='pg-tarot-avatar';
    const strong=document.createElement('strong');
    head.append(avatar,strong);
    stage.insertBefore(head,stage.firstElementChild);
  }
  const avatar=head.querySelector('.pg-tarot-avatar'); avatar.replaceChildren();
  const src=chosen?.querySelector('img')?.getAttribute('src');
  if(src){ const img=document.createElement('img'); img.src=src; img.alt=''; avatar.append(img); }
  else { const sp=document.createElement('span'); const text=chosen?.querySelector('span span')?.textContent?.trim(); sp.textContent=text || '🐾'; avatar.append(sp); }
  setText(head.querySelector('strong'),name);
}

let waitTimer=0;
function showWait(duration=1100){
  let overlay=document.querySelector('.pg-wait-overlay');
  if(!overlay){
    overlay=document.createElement('div'); overlay.className='pg-wait-overlay'; overlay.setAttribute('role','status'); overlay.setAttribute('aria-live','polite');
    overlay.innerHTML='<div class="pg-wait-card"><span class="pg-wait-spinner"></span><b></b><small></small></div>';
    document.body.append(overlay);
  }
  const c=copy(); setText(overlay.querySelector('b'),c.waitTitle); setText(overlay.querySelector('small'),c.waitDesc);
  clearTimeout(waitTimer); waitTimer=window.setTimeout(()=>overlay?.remove(),duration);
}
function hideWait(){ clearTimeout(waitTimer); document.querySelector('.pg-wait-overlay')?.remove(); }

function resetSajuAfterPetSwitch(){
  const page=document.querySelector('.feature-page-saju'); if(!page) return;
  // If a previous result is still mounted, return to the Saju menu after the selected pet changes.
  const candidates=[...page.querySelectorAll('button')];
  const back=candidates.find(b=>/다른\s*Pet사주\s*보기|Back to Pet Saju|Back|別の.*Pet|戻る|其他.*Pet|返回/.test((b.textContent||'').trim()));
  if(back) back.click();
}

function isLastBtiQuestion(page){
  const progress=[...page.querySelectorAll('.bg-sub')].map(x=>(x.textContent||'').trim()).find(x=>/^\d+\s*\/\s*\d+$/.test(x));
  if(!progress) return false;
  const m=progress.match(/^(\d+)\s*\/\s*(\d+)$/); return !!m && Number(m[1])===Number(m[2]);
}

document.addEventListener('click',e=>{
  const target=e.target instanceof Element ? e.target : null; if(!target) return;
  if(target.closest('.lang-toggle button')) window.setTimeout(applyAll,40);

  if(target.closest('.feature-page-saju .feature-pet-picker button')){
    hideWait(); window.setTimeout(()=>{resetSajuAfterPetSwitch(); applyAll();},70);
  }
  if(target.closest('.feature-page-tarot .feature-pet-picker button')) window.setTimeout(()=>{syncTarotPetHeader();applyFeatureCopy();},70);

  const sajuBtn=target.closest('.feature-page-saju button');
  if(sajuBtn && !sajuBtn.closest('.feature-pet-picker')){
    const txt=(sajuBtn.textContent||'').trim();
    if(/기본\s*Pet사주|오늘의\s*펫운세|궁합\s*결과\s*보기|Basic Pet Saju|Today'?s Pet Fortune|See compatibility|Pet占い|今日.*運勢|相性|Pet命理|今日.*运势|缘分/.test(txt)) showWait(1250);
  }

  const btiBtn=target.closest('.feature-page-petbti button');
  if(btiBtn && !btiBtn.closest('.feature-pet-picker')){
    const page=btiBtn.closest('.feature-page-petbti');
    if(page && isLastBtiQuestion(page)) showWait(1000);
  }
},true);

let raf=0;
function applyAll(){
  applySidebar(); applyHamburger(); applyHero(); applyHome(); syncTarotPetHeader(); applyFeatureCopy();
}
function scheduleApply(){ if(raf) return; raf=requestAnimationFrame(()=>{raf=0;applyAll();}); }
const observer=new MutationObserver(scheduleApply);
function boot(){
  applyAll(); observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',scheduleApply);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
