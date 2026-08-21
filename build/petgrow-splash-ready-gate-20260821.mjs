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
            var installed=false,finished=false,requested=false,observer=null,poll=null,requestedAt=0;
            function waitingNode(){return document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell");}
            function hasRealScreen(){
              var root=document.getElementById("root");
              if(!root)return false;
              if(waitingNode())return false;
              return !!root.firstElementChild || String(root.textContent||"").trim().length>0;
            }
            function cleanup(){
              if(observer){observer.disconnect();observer=null;}
              if(poll){window.clearInterval(poll);poll=null;}
            }
            function install(){
              if(installed)return;
              if(typeof window.__hidePetGrowSplash!=="function"){
                window.setTimeout(install,12);return;
              }
              var finish=window.__hidePetGrowSplash;
              if(finish&&finish.__petgrowReadyGate){installed=true;return;}

              function complete(){
                if(finished||!requested||!hasRealScreen())return;
                finished=true;cleanup();finish();
              }
              function watchReady(){
                if(observer||poll)return;
                observer=new MutationObserver(complete);
                observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
                poll=window.setInterval(function(){
                  if(finished)return;
                  if(hasRealScreen()){complete();return;}
                  /* Safety fallback: never leave a healthy rendered app behind the splash forever. */
                  if(requestedAt&&performance.now()-requestedAt>9000){
                    var root=document.getElementById("root");
                    if(root&&(root.firstElementChild||String(root.textContent||"").trim())){
                      finished=true;cleanup();finish();
                    }
                  }
                },120);
              }
              function gatedFinish(){
                if(finished)return;
                requested=true;requestedAt=requestedAt||performance.now();
                if(hasRealScreen()){complete();return;}
                watchReady();
              }
              gatedFinish.__petgrowReadyGate=true;
              window.__hidePetGrowSplash=gatedFinish;
              installed=true;
            }
            install();
            if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
          })();
        `
      }];
    }
  };
}
