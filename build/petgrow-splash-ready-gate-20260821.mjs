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
            var RETURN_KEY="petgrow_external_return_v1";
            var RETURN_MAX_AGE=3*60*1000;
            var isApp=/(?:^|[?&])app_version=/i.test(location.search);
            var hasAuthParams=/(?:^|[?&#])(code|state|access_token|refresh_token|error|error_description)=/i.test((location.search||"")+"&"+(location.hash||""));

            function recentReturn(){
              try{
                var stamp=Number(sessionStorage.getItem(RETURN_KEY)||0);
                var age=Date.now()-stamp;
                return stamp>0&&age>=0&&age<RETURN_MAX_AGE;
              }catch(e){return false;}
            }

            var authReturn=hasAuthParams||recentReturn();
            var MAX_SPLASH_MS=authReturn?560:(isApp?850:1100);
            var MIN_RENDERED_MS=authReturn?80:(isApp?180:300);

            function rendered(){
              var root=document.getElementById("root");
              return !!(root&&(root.firstElementChild||String(root.textContent||"").trim().length>0));
            }

            function forceRemove(){
              var splash=document.getElementById("petgrow-initial-splash");
              if(!splash)return;
              var bar=splash.querySelector(".petgrow-splash__progress-bar");
              if(bar){bar.style.animation="none";bar.style.transition="width 60ms ease-out";bar.style.width="100%";}
              splash.style.pointerEvents="none";
              splash.style.transition="opacity 90ms ease,visibility 90ms ease";
              splash.style.opacity="0";
              splash.style.visibility="hidden";
              setTimeout(function(){if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);},110);
            }

            function probe(){
              if(!document.getElementById("petgrow-initial-splash"))return;
              var elapsed=performance.now()-started;
              if(rendered()&&elapsed>=MIN_RENDERED_MS){forceRemove();return;}
              if(elapsed>=MAX_SPLASH_MS){forceRemove();return;}
              requestAnimationFrame(probe);
            }

            function releaseOnReturn(){
              if(recentReturn()||hasAuthParams) setTimeout(forceRemove,40);
            }

            if(document.readyState==="loading"){
              document.addEventListener("DOMContentLoaded",function(){requestAnimationFrame(probe);},{once:true});
            }else requestAnimationFrame(probe);

            document.addEventListener("visibilitychange",function(){
              if(document.visibilityState==="visible")releaseOnReturn();
            });
            window.addEventListener("pageshow",releaseOnReturn);
            window.addEventListener("focus",releaseOnReturn);

            setTimeout(forceRemove,MAX_SPLASH_MS+100);
          })();
        `
      }];
    }
  };
}
