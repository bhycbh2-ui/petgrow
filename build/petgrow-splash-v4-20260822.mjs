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
              background:linear-gradient(180deg,#fbfcfa 0%,#f6f8f5 62%,#eef3ee 100%)!important;
              color:#18382d!important;
              isolation:isolate!important;
              overflow:hidden!important;
            }
            #petgrow-initial-splash.pg4-emerald:before,
            #petgrow-initial-splash.pg4-emerald:after{
              content:""!important;
              position:absolute!important;
              border-radius:48% 52% 58% 42% / 44% 40% 60% 56%!important;
              pointer-events:none!important;
              z-index:0!important;
              filter:blur(2px)!important;
            }
            #petgrow-initial-splash.pg4-emerald:before{
              width:52vw!important;height:52vw!important;max-width:430px!important;max-height:430px!important;
              left:-18vw!important;top:8vh!important;
              background:linear-gradient(145deg,rgba(197,220,202,.46),rgba(233,240,232,.16))!important;
              animation:pg-soft-shape-a 7s ease-in-out infinite alternate!important;
            }
            #petgrow-initial-splash.pg4-emerald:after{
              width:46vw!important;height:46vw!important;max-width:390px!important;max-height:390px!important;
              right:-18vw!important;bottom:5vh!important;
              background:linear-gradient(145deg,rgba(223,235,221,.40),rgba(179,210,189,.16))!important;
              animation:pg-soft-shape-b 8s ease-in-out infinite alternate!important;
            }
            .pg4-emerald .petgrow-runners,.pg-signature-orbit,.pg-paw-trail,.pg-sprout{display:none!important}
            .pg4-emerald .petgrow-splash__content{
              position:relative!important;z-index:3!important;width:min(86vw,340px)!important;max-width:340px!important;
              align-items:center!important;text-align:center!important;transform:translateY(-1vh)!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap{
              width:132px!important;height:132px!important;margin:0 0 22px!important;border-radius:34px!important;
              position:relative!important;overflow:visible!important;isolation:isolate!important;
              animation:pg-logo-reveal .72s cubic-bezier(.16,.82,.24,1) both!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:before{
              content:""!important;position:absolute!important;inset:-26px!important;border-radius:50%!important;z-index:-2!important;
              background:radial-gradient(circle,rgba(39,111,73,.15) 0%,rgba(39,111,73,.06) 38%,transparent 72%)!important;
              filter:blur(12px)!important;
              animation:pg-soft-pulse 3.2s ease-in-out infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:after{
              content:""!important;position:absolute!important;left:50%!important;bottom:-12px!important;width:72px!important;height:14px!important;
              transform:translateX(-50%)!important;border-radius:50%!important;z-index:-1!important;
              background:rgba(29,77,51,.13)!important;filter:blur(10px)!important;
              animation:pg-shadow-breathe 3.2s ease-in-out infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo{
              width:100%!important;height:100%!important;border-radius:34px!important;object-fit:cover!important;
              filter:drop-shadow(0 16px 28px rgba(24,65,43,.16))!important;
              animation:pg-logo-float 3.2s ease-in-out .75s infinite!important;
            }
            .pg4-kicker{display:none!important}
            .pg4-wordmark{
              margin:0!important;color:#19392e!important;font-family:Inter,"Pretendard","Noto Sans KR",sans-serif!important;
              font-size:clamp(38px,9.4vw,46px)!important;font-weight:820!important;line-height:1!important;letter-spacing:-.055em!important;
              animation:pg-copy-in .5s ease-out .18s both!important;
            }
            .pg4-wordmark span{color:#2a704c!important}
            .pg4-emerald .petgrow-splash__tagline{
              margin:12px 0 0!important;color:#6e7f76!important;font-size:13px!important;font-weight:600!important;
              line-height:1.55!important;letter-spacing:-.025em!important;animation:pg-copy-in .5s ease-out .26s both!important;
            }
            .pg4-emerald .petgrow-splash__progress{
              width:min(62vw,210px)!important;height:3px!important;margin:30px auto 0!important;border:0!important;border-radius:999px!important;
              background:rgba(55,91,69,.09)!important;box-shadow:none!important;overflow:hidden!important;
            }
            .pg4-emerald .petgrow-splash__progress-bar{
              border-radius:999px!important;background:linear-gradient(90deg,#b5cbb9 0%,#6a9b79 55%,#326b4c 100%)!important;
              box-shadow:none!important;position:relative!important;
            }
            .pg4-emerald .petgrow-splash__progress-bar:after{
              content:"";position:absolute;inset:0;width:32%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.82),transparent);
              transform:translateX(-150%);animation:pg-bar-glint 1.1s ease-out .2s 1 both;
            }
            .pg4-emerald .petgrow-splash__status{
              margin-top:10px!important;color:#94a099!important;font-size:10.5px!important;font-weight:560!important;
            }
            .pg4-emerald .petgrow-splash__dots{display:none!important}
            @keyframes pg-logo-reveal{0%{opacity:0;transform:translateY(14px) scale(.88)}65%{opacity:1;transform:translateY(-2px) scale(1.018)}100%{opacity:1;transform:none}}
            @keyframes pg-logo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
            @keyframes pg-soft-pulse{0%,100%{opacity:.65;transform:scale(.96)}50%{opacity:1;transform:scale(1.05)}}
            @keyframes pg-shadow-breathe{0%,100%{opacity:.55;transform:translateX(-50%) scaleX(.9)}50%{opacity:.8;transform:translateX(-50%) scaleX(1.08)}}
            @keyframes pg-copy-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
            @keyframes pg-bar-glint{0%{transform:translateX(-150%);opacity:0}30%{opacity:.8}100%{transform:translateX(360%);opacity:0}}
            @keyframes pg-soft-shape-a{from{transform:translate3d(0,0,0) rotate(-8deg)}to{transform:translate3d(24px,14px,0) rotate(5deg)}}
            @keyframes pg-soft-shape-b{from{transform:translate3d(0,0,0) rotate(8deg)}to{transform:translate3d(-22px,-14px,0) rotate(-5deg)}}
            @media(max-width:430px){.pg4-emerald .petgrow-splash__logo-wrap{width:116px!important;height:116px!important}.pg4-wordmark{font-size:40px!important}}
            @media(max-height:700px){.pg4-emerald .petgrow-splash__logo-wrap{width:94px!important;height:94px!important;margin-bottom:15px!important}.pg4-wordmark{font-size:35px!important}.pg4-emerald .petgrow-splash__progress{margin-top:20px!important}}
            @media(prefers-reduced-motion:reduce){#petgrow-initial-splash.pg4-emerald:before,#petgrow-initial-splash.pg4-emerald:after,.pg4-emerald .petgrow-splash__logo-wrap,.pg4-emerald .petgrow-splash__logo-wrap:before,.pg4-emerald .petgrow-splash__logo-wrap:after,.pg4-emerald .petgrow-splash__logo,.pg4-wordmark,.pg4-emerald .petgrow-splash__tagline,.pg4-emerald .petgrow-splash__progress-bar:after{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-calm-premium-splash-script"},
          injectTo:"head",
          children:`
            (function(){
              var tries=0;
              function apply(){
                var splash=document.getElementById("petgrow-initial-splash");
                var content=splash&&splash.querySelector(".petgrow-splash__content");
                var logo=content&&content.querySelector(".petgrow-splash__logo-wrap");
                var tagline=content&&content.querySelector(".petgrow-splash__tagline");
                if(!splash||!content||!logo||!tagline){if(tries++<240)setTimeout(apply,12);return;}
                splash.classList.add("pg4-emerald");
                tagline.textContent="우리 아이의 건강한 성장을 함께";
                var kicker=content.querySelector(".pg4-kicker");if(kicker)kicker.remove();
                if(!content.querySelector(".pg4-wordmark")){
                  var word=document.createElement("div");word.className="pg4-wordmark";word.innerHTML="Pet<span>Grow</span>";
                  logo.insertAdjacentElement("afterend",word);
                }
                var orbit=logo.querySelector(".pg-signature-orbit");if(orbit)orbit.remove();
                var trail=splash.querySelector(".pg-paw-trail");if(trail)trail.remove();
                var sprout=splash.querySelector(".pg-sprout");if(sprout)sprout.remove();
                var status=content.querySelector(".petgrow-splash__status");if(status)status.textContent="잠시만 기다려주세요";
              }
              if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
              setTimeout(apply,0);
            })();
          `
        }
      ];
    }
  };
}
