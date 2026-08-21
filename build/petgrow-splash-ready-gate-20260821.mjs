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
            var installed=false,finished=false,requested=false,observer=null,poll=null,requestedAt=0,criticalListener=false,criticalHandler=null;
            var gateStarted=performance.now(),renderedAt=0;
            function waitingNode(){return document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell,.petgrow-dashboard-home .pgh-loading");}
            function criticalReady(){return window.__petgrowCriticalAppReady===true;}
            function hasRenderedApp(){
              var root=document.getElementById("root");
              return !!(root&&(root.firstElementChild||String(root.textContent||"").trim().length>0));
            }
            function hasRealScreen(){
              if(!hasRenderedApp())return false;
              if(waitingNode())return false;
              return true;
            }
            function cleanup(){
              if(observer){observer.disconnect();observer=null;}
              if(poll){window.clearInterval(poll);poll=null;}
              if(criticalListener&&criticalHandler){window.removeEventListener("petgrow:critical-ready",criticalHandler);}
              criticalListener=false;criticalHandler=null;
            }
            function install(){
              if(installed)return;
              if(typeof window.__hidePetGrowSplash!=="function"){
                window.setTimeout(install,12);return;
              }
              var finish=window.__hidePetGrowSplash;
              if(finish&&finish.__petgrowReadyGate){installed=true;return;}

              function complete(force){
                if(finished)return;
                if(!hasRealScreen())return;
                if(!(force||requested||criticalReady()))return;
                finished=true;cleanup();finish();
              }
              criticalHandler=function(){complete(true);};
              function watchReady(){
                if(observer||poll)return;
                observer=new MutationObserver(function(){
                  if(hasRealScreen()&&!renderedAt)renderedAt=performance.now();
                  complete(false);
                });
                observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
                if(!criticalListener&&criticalHandler){window.addEventListener("petgrow:critical-ready",criticalHandler);criticalListener=true;}
                poll=window.setInterval(function(){
                  if(finished)return;
                  var now=performance.now();
                  if(hasRealScreen()){
                    if(!renderedAt)renderedAt=now;
                    if(criticalReady()||requested){complete(false);return;}
                    /* If the real app is already rendered but one legacy ready signal was missed,
                       release shortly instead of leaving the progress UI parked at 99%. */
                    if(now-renderedAt>1200){complete(true);return;}
                  }else if(hasRenderedApp()&&now-gateStarted>6500){
                    /* Last-resort guard for stale hidden loading markers in older WebViews. */
                    finished=true;cleanup();finish();return;
                  }
                  if(now-gateStarted>8500&&hasRenderedApp()){
                    finished=true;cleanup();finish();
                  }
                },90);
              }
              function gatedFinish(){
                if(finished)return;
                requested=true;requestedAt=requestedAt||performance.now();
                if(hasRealScreen()){complete(false);return;}
                watchReady();
              }
              gatedFinish.__petgrowReadyGate=true;
              window.__hidePetGrowSplash=gatedFinish;
              installed=true;
              /* Start watching immediately so a missed hide/critical event cannot strand the splash at 99%. */
              watchReady();
            }
            install();
            if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
          })();
        `
      }];
    }
  };
}
