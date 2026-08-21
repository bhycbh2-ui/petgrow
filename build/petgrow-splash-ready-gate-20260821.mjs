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
            var installed=false,finished=false,requested=false,observer=null,poll=null,criticalListener=false,criticalHandler=null;
            var gateStarted=performance.now(),renderedAt=0;
            function waitingNode(){return document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell");}
            function criticalReady(){return window.__petgrowCriticalAppReady===true;}
            function hasRenderedApp(){
              var root=document.getElementById("root");
              return !!(root&&(root.firstElementChild||String(root.textContent||"").trim().length>0));
            }
            function hasRealScreen(){
              if(!hasRenderedApp())return false;
              return !waitingNode();
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
                window.setTimeout(install,8);return;
              }
              var finish=window.__hidePetGrowSplash;
              if(finish&&finish.__petgrowReadyGate){installed=true;return;}

              function finishFast(){
                var state=window.__petgrowSplashV2State;
                if(state){state.current=100;state.externalTarget=100;}
                try{window.__petgrowSetSplashProgress&&window.__petgrowSetSplashProgress(100);}catch(e){}
                finish();
              }
              function complete(force){
                if(finished||!hasRealScreen())return;
                if(!(force||requested||criticalReady()))return;
                finished=true;cleanup();finishFast();
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
                    if(now-renderedAt>500){complete(true);return;}
                  }
                  if(hasRenderedApp()&&now-gateStarted>1800){
                    finished=true;cleanup();finishFast();return;
                  }
                  if(now-gateStarted>2800&&hasRenderedApp()){
                    finished=true;cleanup();finishFast();
                  }
                },50);
              }
              function gatedFinish(){
                if(finished)return;
                requested=true;
                if(hasRealScreen()){complete(false);return;}
                watchReady();
              }
              gatedFinish.__petgrowReadyGate=true;
              window.__hidePetGrowSplash=gatedFinish;
              installed=true;
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
