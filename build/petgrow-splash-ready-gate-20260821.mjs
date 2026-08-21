export default function petgrowSplashReadyGate(){
  return {
    name:"petgrow-splash-ready-gate",
    transformIndexHtml(){
      return [{
        tag:"script",
        attrs:{id:"petgrow-splash-ready-gate"},
        children:`
          (function(){
            var installed=false;
            function install(){
              if(installed)return;
              if(typeof window.__petgrowSetSplashProgress!=="function"||typeof window.__hidePetGrowSplash!=="function"){
                window.setTimeout(install,12);
                return;
              }
              var finish=window.__hidePetGrowSplash;
              if(finish&&finish.__petgrowReadyGate){installed=true;return;}
              function gatedFinish(){
                var waiting=document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell");
                if(waiting){
                  window.__petgrowSetSplashProgress(94);
                  var msg=document.querySelector(".pg-premium-message");
                  if(msg)msg.textContent="로그인 정보를 확인하고 있어요";
                  return;
                }
                return finish.apply(this,arguments);
              }
              gatedFinish.__petgrowReadyGate=true;
              window.__hidePetGrowSplash=gatedFinish;
              installed=true;
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
