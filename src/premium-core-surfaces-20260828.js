import "./premium-core-surfaces-20260828.css";

const clean=(value)=>String(value||"").replace(/\s+/g," ").trim();
const norm=(value)=>clean(value).replace(/\s+/g,"").toLowerCase();

function tagAbout(){
  const root=document.querySelector(".landing-root");
  if(!root)return;
  root.classList.add("pg-premium-about");

  const tag=(selector,cls)=>root.querySelector(selector)?.closest(".landing-section")?.classList.add(cls);
  tag(".landing-about","pg-about-mission");
  tag(".landing-features","pg-about-capabilities");
  tag(".landing-showcase","pg-about-showcase");
  tag(".landing-highlight-grid","pg-about-play");
  tag(".landing-community-wrap","pg-about-community");
  tag(".landing-steps","pg-about-steps");
  tag(".landing-final-cta","pg-about-final");
  tag(".landing-trust","pg-about-trust");

  root.querySelectorAll(".landing-section").forEach(section=>{
    const text=norm(section.textContent);
    if(section.querySelector(".landing-mini-teaser")){
      if(text.includes("pet음악")||text.includes("petmusic"))section.classList.add("pg-about-music");
      if(text.includes("내주변pet")||text.includes("nearbypet"))section.classList.add("pg-about-nearby");
      if(text.includes("가이드")||text.includes("pet정보")||text.includes("pettips")||text.includes("petguide"))section.classList.add("pg-about-guide");
    }
  });

  // 상세 가이드 URL은 유지하지만 소개 화면에서는 긴 가이드 허브를 노출하지 않습니다.
  root.querySelectorAll(".pg-about-guide").forEach(section=>{
    section.hidden=true;
    section.setAttribute("aria-hidden","true");
  });

  const hero=root.querySelector(".landing-hero-section");
  hero?.classList.add("pg-about-hero");
  const video=hero?.querySelector(".intro-video-wrap");
  video?.closest(".about-fade")?.classList.add("pg-about-video-block");

  root.querySelectorAll(".landing-features > .landing-feature-card").forEach((card,index)=>{
    card.style.setProperty("--pg-feature-index",String(index+1));
  });
}

let raf=0;
function run(){tagAbout();}
function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;run();});
}
function boot(){
  run();
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
  window.addEventListener("petgrow:navigate",()=>setTimeout(schedule,60));
  window.addEventListener("petgrow:critical-ready",schedule);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
