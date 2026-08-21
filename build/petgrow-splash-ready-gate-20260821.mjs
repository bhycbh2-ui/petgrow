export default function petgrowSplashReadyGate(){
  return {
    name:"petgrow-splash-ready-gate",
    transformIndexHtml(){
      return [{
        tag:"script",
        attrs:{id:"petgrow-splash-ready-gate"},
        children:`
          (function(){
            var installed=false,finished=false,observer=null,poll=null,requestedAt=0,maxProgress=1;
            function waitingNode(){return document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell");}
            function setMessage(text){var msg=document.querySelector(".pg-premium-message");if(msg)msg.textContent=text;}
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
              if(typeof window.__petgrowSetSplashProgress!=="function"||typeof window.__hidePetGrowSplash!=="function"){
                window.setTimeout(install,12);
                return;
              }
              var rawProgress=window.__petgrowSetSplashProgress;
              function advance(value){
                var next=Math.max(1,Math.min(100,Math.round(Number(value)||1)));
                if(next<maxProgress)return false;
                maxProgress=next;
                rawProgress(next);
                return true;
              }
              window.__petgrowSetSplashProgress=advance;

              var finish=window.__hidePetGrowSplash;
              if(finish&&finish.__petgrowReadyGate){installed=true;return;}

              function complete(){
                if(finished)return;
                if(!hasRealScreen())return;
                finished=true;
                cleanup();
                advance(100);
                setMessage("준비가 완료됐어요");
                finish();
              }

              function watchReady(){
                if(observer||poll)return;
                observer=new MutationObserver(function(){complete();});
                observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
                poll=window.setInterval(function(){
                  if(finished)return;
                  if(hasRealScreen()){complete();return;}
                  var elapsed=performance.now()-requestedAt;
                  if(elapsed>1500)advance(97);
                  if(elapsed>3200)advance(99);
                },100);
              }

              function gatedFinish(){
                if(finished)return;
                requestedAt=requestedAt||performance.now();
                if(hasRealScreen()){complete();return;}
                advance(94);
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
        `,
        injectTo:"head"
      }];
    }
  };
}
