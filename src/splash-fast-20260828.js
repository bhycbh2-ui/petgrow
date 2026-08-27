const shownAt=Number(window.__petgrowSplashShownAt)||performance.now();
const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const app=/(?:^|[?&])app_version=/i.test(location.search);
const minimumVisibleMs=(mobile||app)?460:650;
const fallbackRevealMs=(mobile||app)?820:980;
let queued=false;

function hasRenderedApp(){
  const root=document.getElementById("root");
  if(!root)return false;
  return Boolean(root.firstElementChild||String(root.textContent||"").trim());
}

function removeSplash(){
  const splash=document.getElementById("petgrow-initial-splash");
  if(!splash||splash.classList.contains("petgrow-splash--hide"))return;
  const bar=splash.querySelector(".petgrow-splash__progress-bar");
  if(bar){
    bar.style.animation="none";
    bar.style.transition="width 90ms ease-out";
    bar.style.width="100%";
  }
  splash.style.transition="opacity 170ms ease, visibility 170ms ease";
  setTimeout(()=>{
    splash.classList.add("petgrow-splash--hide");
    setTimeout(()=>splash.remove(),190);
  },45);
}

window.__hidePetGrowSplash=function(){
  if(queued)return;
  queued=true;
  const reveal=()=>{
    const elapsed=performance.now()-shownAt;
    if(elapsed<minimumVisibleMs){
      setTimeout(reveal,minimumVisibleMs-elapsed);
      return;
    }
    if(!hasRenderedApp()&&elapsed<fallbackRevealMs){
      setTimeout(reveal,70);
      return;
    }
    removeSplash();
  };
  reveal();
};

// 앱이 이미 빠르게 렌더링된 경우 React의 기존 520ms 타이머를 기다리지 않고 바로 넘깁니다.
const probe=()=>{
  const elapsed=performance.now()-shownAt;
  if(hasRenderedApp()&&elapsed>=minimumVisibleMs){
    window.__hidePetGrowSplash();
    return;
  }
  if(elapsed<fallbackRevealMs)requestAnimationFrame(probe);
  else window.__hidePetGrowSplash();
};
requestAnimationFrame(probe);
