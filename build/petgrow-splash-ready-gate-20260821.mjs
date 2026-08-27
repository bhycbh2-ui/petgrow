export default function petgrowSplashReadyGate(){
  return {
    name:"petgrow-splash-ready-gate",
    transformIndexHtml(){
      return [{
        tag:"script",
        attrs:{id:"petgrow-splash-ready-gate"},
        injectTo:"head",
        children:`
          (function(){
            var started=performance.now();
            var MAX_SPLASH_MS=1400;

            function rendered(){
              var root=document.getElementById("root");
              return !!(root&&(root.firstElementChild||String(root.textContent||"").trim().length>0));
            }

            function forceRemove(){
              var splash=document.getElementById("petgrow-initial-splash");
              if(!splash)return;
              var bar=splash.querySelector(".petgrow-splash__progress-bar");
              if(bar){bar.style.animation="none";bar.style.width="100%";}
              splash.style.pointerEvents="none";
              splash.style.opacity="0";
              splash.style.visibility="hidden";
              setTimeout(function(){if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);},140);
            }

            function finish(){
              try{
                if(typeof window.__hidePetGrowSplash==="function")window.__hidePetGrowSplash();
                else forceRemove();
              }catch(e){forceRemove();}
            }

            function probe(){
              if(!document.getElementById("petgrow-initial-splash"))return;
              var elapsed=performance.now()-started;
              if(rendered()&&elapsed>=360){finish();return;}
              if(elapsed>=MAX_SPLASH_MS){forceRemove();return;}
              requestAnimationFrame(probe);
            }

            if(document.readyState==="loading"){
              document.addEventListener("DOMContentLoaded",function(){requestAnimationFrame(probe);},{once:true});
            }else requestAnimationFrame(probe);

            setTimeout(forceRemove,MAX_SPLASH_MS+250);
          })();
        `
      }];
    }
  };
}
