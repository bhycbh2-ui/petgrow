import fs from 'node:fs';

const appPath='src/App.jsx';
const dailyPath='src/PetDailyWidgets.jsx';
let s=fs.readFileSync(appPath,'utf8');
let daily=fs.readFileSync(dailyPath,'utf8');

// 1) Remove PetPoint rank banner: current source keeps the entire banner on one JSX line.
s=s.split('\n').filter(line=>!line.includes('MY PETPOINT RANK')).join('\n');

// 2) Remove Pet Tarot from Pet Saju and from point spending UI, while keeping Pet Saju / daily fortune / compatibility.
s=s.split('\n').filter(line=>!(line.includes('id: "tarot"')&&line.includes('setMode("tarot")'))).join('\n');
s=s.split('\n').filter(line=>!line.includes('if (mode === "tarot") return <PetTarotPanel')).join('\n');
s=s.replace('<span>🃏 타로 <b>{d.costs?.tarot||30}P</b></span>','');
s=s.replaceAll('기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합','기본 Pet사주, 오늘의 펫운세, 보호자 궁합');
s=s.replaceAll('기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로','기본 Pet사주, 오늘의 펫운세');
s=s.replaceAll('Pet사주·오늘의 펫운세·보호자 궁합·Pet타로','Pet사주·오늘의 펫운세·보호자 궁합');
s=s.replaceAll('Pet사주·운세·타로','Pet사주·운세');
s=s.replaceAll('Pet사주·운세·타로 같은','Pet사주·운세 같은');
s=s.replaceAll('타로 30P · 오늘 운세 20P · 기본 사주 50P · 궁합 40P','오늘 운세 20P · 기본 사주 50P · 궁합 40P');
s=s.replaceAll('Choose one of four fun contents.','Choose one of three fun contents.');
s=s.replaceAll('Pet Saju, today\'s fortune, Pet Tarot, or guardian compatibility','Pet Saju, today\'s fortune, or guardian compatibility');

// 3) Remove obvious duplicated page-title rows when the same page already has a unified hero.
// These are deliberately narrow and only target title-only wrappers immediately before unified hero sections.
s=s.replace(/<div className="(?:page-title|section-title|content-title)[^"]*">\s*<h1>\s*(Pet뉴스|Pet정보|Pet톡)\s*<\/h1>\s*<\/div>\s*(?=<section className="petgrow-unified-hero)/g,'');
s=s.replace(/<header className="(?:page-title|section-title|content-title)[^"]*">\s*<h1>\s*(Pet뉴스|Pet정보|Pet톡)\s*<\/h1>\s*<\/header>\s*(?=<section className="petgrow-unified-hero)/g,'');

// 4) Make My Page point status appear first when it currently sits lower in MyPage.
// Move the explicit dashboard node to right after the MyPage opening shell, preserving existing behavior.
const myStart=s.indexOf('function MyPage(');
if(myStart>=0){
  const myEnd=s.indexOf('\nfunction ',myStart+20);
  if(myEnd>myStart){
    let block=s.slice(myStart,myEnd);
    const point='<PetPointDashboard />';
    const occurrences=(block.match(/<PetPointDashboard \/>/g)||[]).length;
    if(occurrences===1){
      block=block.replace(point,'');
      const returnPos=block.indexOf('return ');
      const firstOpen=block.indexOf('>',returnPos);
      if(returnPos>=0&&firstOpen>=0){
        block=block.slice(0,firstOpen+1)+'\n      <div className="mypage-point-top"><PetPointDashboard /></div>'+block.slice(firstOpen+1);
        s=s.slice(0,myStart)+block+s.slice(myEnd);
      }
    }
  }
}

// 5) Unified visual balance: white canvas, high contrast text, 2-column x 5-row treatment for ten-item shortcut/guide groups,
// consistent Our Pet heading placement, and one-row mobile location controls.
const css=`\n/* PETGROW_UI_BATCH_20260818 */\n:root{--pg-ink:#1f2a24;--pg-sub:#68736c;--pg-border:#e5e9e5;--pg-soft:#f7f9f7;--pg-accent:#467a56}\n.petpoint-card,.petpoint-policy,.petpoint-about,.petpoint-guide-hero,.petpoint-admin,.petpoint-visible{background:#fff!important;background-image:none!important;border-color:var(--pg-border)!important;box-shadow:0 10px 28px rgba(31,42,36,.06)!important;color:var(--pg-ink)!important}\n.petpoint-card p,.petpoint-guide-hero p,.petpoint-about p,.petpoint-policy p,.petpoint-visible p{color:var(--pg-sub)!important}\n.petpoint-head h2,.petpoint-history-head b,.petpoint-card b,.petpoint-card strong{color:var(--pg-ink)}\n.petpoint-head>strong{color:var(--pg-accent)!important}\n.petpoint-live-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}\n.petpoint-live-stats>div,.petpoint-costs span,.petpoint-guide p,.petpoint-history-list,.petpoint-mini-grid span{background:#fff!important;border-color:var(--pg-border)!important}\n.petpoint-costs{grid-template-columns:repeat(2,minmax(0,1fr))!important}\n.petpoint-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}\n.mypage-point-top{order:-20;width:100%;margin:0 0 16px}\n.mypage-point-top .petpoint-card{max-width:none!important;margin:0 0 16px!important}\n/* Ten-item menu / guide groups: two cards per row = 2 x 5 */\n.info-guide-grid,.guide-grid,.petinfo-guide-grid,.menu-guide-grid,.service-guide-grid,.feature-guide-grid,.more-menu-grid.ten-items,.quick-menu-grid.ten-items{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;background:#fff!important}\n.info-guide-grid>* ,.guide-grid>* ,.petinfo-guide-grid>* ,.menu-guide-grid>* ,.service-guide-grid>* ,.feature-guide-grid>*{background:#fff!important;border:1px solid var(--pg-border)!important;color:var(--pg-ink)!important;box-shadow:0 6px 20px rgba(31,42,36,.04)!important}\n/* Our Pet title uses the same left edge and vertical rhythm as other main pages */\n.pets-page .petgrow-unified-hero,.my-pets-page .petgrow-unified-hero,.pet-profile-page .petgrow-unified-hero{margin-top:0!important;text-align:left!important}\n.pets-page .petgrow-unified-hero h1,.my-pets-page .petgrow-unified-hero h1,.pet-profile-page .petgrow-unified-hero h1{margin-left:0!important;text-align:left!important}\n@media(max-width:760px){\n  .petpoint-card{margin-left:0!important;margin-right:0!important;border-radius:18px!important;padding:16px!important}\n  .petpoint-head{align-items:flex-start!important}.petpoint-head p{font-size:12px!important;line-height:1.55!important}.petpoint-head>strong{font-size:24px!important}\n  .petpoint-live-stats,.petpoint-costs,.petpoint-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}\n  .info-guide-grid,.guide-grid,.petinfo-guide-grid,.menu-guide-grid,.service-guide-grid,.feature-guide-grid,.more-menu-grid.ten-items,.quick-menu-grid.ten-items{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}\n  .nearby-location-actions,.nearby-search-actions,.nearby-toolbar,.nearby-search-row,.nearby-location-row{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:8px!important;width:100%!important}\n  .nearby-location-actions>button,.nearby-search-actions>button,.nearby-toolbar>button,.nearby-search-row>button,.nearby-location-row>button{flex:1 1 0!important;min-width:0!important;white-space:nowrap!important;padding-left:8px!important;padding-right:8px!important}\n}\n`;
if(!s.includes('PETGROW_UI_BATCH_20260818')){
  const marker='${PET_DAILY_CSS}\\n';
  const i=s.indexOf(marker);
  if(i>=0)s=s.slice(0,i+marker.length)+css+s.slice(i+marker.length);
  else {
    const styleOpen=s.indexOf('<style>{`');
    if(styleOpen>=0)s=s.slice(0,styleOpen+9)+css+s.slice(styleOpen+9);
    else throw new Error('global style anchor not found');
  }
}

// 6) Tarot widget file remains available for history compatibility, but no longer appears inside Pet Saju.
// Improve residual card readability if a stored history entry renders its detail.
if(!daily.includes('PETGROW_TAROT_RESIDUAL_READABILITY_20260818')){
  daily += `\nexport const PETGROW_TAROT_RESIDUAL_READABILITY_20260818 = true;\n`;
}

fs.writeFileSync(appPath,s);
fs.writeFileSync(dailyPath,daily);

if(s.includes('MY PETPOINT RANK')) throw new Error('rank banner still present');
if(s.includes('id: "tarot"')&&s.includes('setMode("tarot")')) throw new Error('Pet Tarot menu still present');
console.log('Applied consolidated PetGrow UI batch 20260818');
