export default function petgrowSplashV4(){
  return {
    name:"petgrow-calm-premium-splash-20260822",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-calm-premium-splash-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash.pg4-emerald{
              background:#f8faf7!important;
              color:#18382d!important;
              overflow:hidden!important;
            }
            #petgrow-initial-splash.pg4-emerald:before,
            #petgrow-initial-splash.pg4-emerald:after{
              display:none!important;
              content:none!important;
            }
            .pg4-emerald .petgrow-runners,
            .pg-signature-orbit,
            .pg-paw-trail,
            .pg-sprout{display:none!important}
            .pg4-emerald .petgrow-splash__content{
              position:relative!important;
              z-index:2!important;
              width:min(82vw,300px)!important;
              max-width:300px!important;
              align-items:center!important;
              justify-content:center!important;
              text-align:center!important;
              transform:none!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap{
              width:104px!important;
              height:104px!important;
              margin:0 0 16px!important;
              border-radius:24px!important;
              overflow:visible!important;
              isolation:auto!important;
              animation:pg-simple-logo-in .28s ease-out both!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:before,
            .pg4-emerald .petgrow-splash__logo-wrap:after{
              display:none!important;
              content:none!important;
            }
            .pg4-emerald .petgrow-splash__logo{
              display:block!important;
              width:100%!important;
              height:100%!important;
              border-radius:24px!important;
              object-fit:contain!important;
              filter:drop-shadow(0 7px 16px rgba(24,65,43,.10))!important;
              animation:none!important;
              transform:none!important;
            }
            .pg4-kicker{display:none!important}
            .pg4-wordmark{
              margin:0!important;
              color:#244c38!important;
              font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif!important;
              font-size:29px!important;
              font-weight:800!important;
              line-height:1.08!important;
              letter-spacing:-.045em!important;
              animation:pg-simple-copy-in .22s ease-out .05s both!important;
            }
            .pg4-wordmark span{color:inherit!important}
            .pg4-emerald .petgrow-splash__tagline{
              margin:8px 0 0!important;
              color:#718078!important;
              font-size:12px!important;
              font-weight:600!important;
              line-height:1.5!important;
              letter-spacing:-.025em!important;
              animation:pg-simple-copy-in .22s ease-out .08s both!important;
            }
            .pg4-emerald .petgrow-splash__progress{
              width:150px!important;
              height:3px!important;
              margin:24px auto 0!important;
              border:0!important;
              border-radius:999px!important;
              background:#e3ebe5!important;
              box-shadow:none!important;
              overflow:hidden!important;
            }
            .pg4-emerald .petgrow-splash__progress-bar{
              border-radius:999px!important;
              background:#4f8a5b!important;
              box-shadow:none!important;
            }
            .pg4-emerald .petgrow-splash__progress-bar:after{display:none!important;content:none!important}
            .pg4-emerald .petgrow-splash__status{
              margin-top:9px!important;
              color:#8a978f!important;
              font-size:10.5px!important;
              font-weight:560!important;
            }
            .pg4-emerald .petgrow-splash__dots{display:none!important}
            @keyframes pg-simple-logo-in{
              from{opacity:0;transform:translateY(4px) scale(.985)}
              to{opacity:1;transform:none}
            }
            @keyframes pg-simple-copy-in{
              from{opacity:0;transform:translateY(2px)}
              to{opacity:1;transform:none}
            }
            @media(max-width:430px){
              .pg4-emerald .petgrow-splash__logo-wrap{width:96px!important;height:96px!important}
              .pg4-wordmark{font-size:27px!important}
            }
            @media(max-height:650px){
              .pg4-emerald .petgrow-splash__logo-wrap{width:86px!important;height:86px!important;margin-bottom:12px!important}
              .pg4-wordmark{font-size:25px!important}
              .pg4-emerald .petgrow-splash__progress{margin-top:18px!important}
            }
            @media(prefers-reduced-motion:reduce){
              .pg4-emerald .petgrow-splash__logo-wrap,
              .pg4-wordmark,
              .pg4-emerald .petgrow-splash__tagline{animation:none!important}
            }
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-calm-premium-splash-script"},
          injectTo:"head",
          children:`
            (function(){
              function apply(){
                var splash=document.getElementById("petgrow-initial-splash");
                var content=splash&&splash.querySelector(".petgrow-splash__content");
                var logo=content&&content.querySelector(".petgrow-splash__logo-wrap");
                var tagline=content&&content.querySelector(".petgrow-splash__tagline");
                if(!splash||!content||!logo||!tagline)return;
                splash.classList.add("pg4-emerald");
                tagline.textContent="우리 아이의 건강한 성장을 함께";
                content.querySelector(".pg4-kicker")?.remove();
                if(!content.querySelector(".pg4-wordmark")){
                  var word=document.createElement("div");
                  word.className="pg4-wordmark";
                  word.textContent="PetGrow";
                  logo.insertAdjacentElement("afterend",word);
                }
                logo.querySelector(".pg-signature-orbit")?.remove();
                splash.querySelector(".pg-paw-trail")?.remove();
                splash.querySelector(".pg-sprout")?.remove();
                var status=content.querySelector(".petgrow-splash__status");
                if(status)status.textContent="잠시만 기다려주세요";
              }
              if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});
              else apply();
            })();
          `
        }
      ];
    }
  };
}
