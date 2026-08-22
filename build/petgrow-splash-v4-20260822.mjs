export default function petgrowSplashV4(){
  return {
    name:"petgrow-premium-signature-splash-20260822",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-premium-signature-splash-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash.pg4-emerald{
              background:
                radial-gradient(circle at 50% 38%,rgba(220,236,222,.72),transparent 30%),
                radial-gradient(circle at 18% 14%,rgba(236,243,231,.8),transparent 24%),
                linear-gradient(180deg,#fcfdf9 0%,#f7faf5 52%,#eff5ee 100%)!important;
              color:#19372c!important;isolation:isolate!important;overflow:hidden!important;
            }
            #petgrow-initial-splash.pg4-emerald:before{
              content:""!important;position:absolute!important;left:50%!important;top:50%!important;
              width:min(92vw,620px)!important;height:min(92vw,620px)!important;border-radius:50%!important;
              transform:translate(-50%,-48%)!important;
              background:radial-gradient(circle,rgba(46,118,74,.10),rgba(46,118,74,0) 66%)!important;
              filter:blur(6px)!important;z-index:0!important;animation:pg-premium-ambient 5.2s ease-in-out infinite!important;
            }
            #petgrow-initial-splash.pg4-emerald:after{display:none!important}
            .pg4-emerald .petgrow-runners,.pg-paw-trail,.pg-sprout{display:none!important}
            .pg4-emerald .petgrow-splash__content{
              position:relative!important;z-index:3!important;width:min(86vw,350px)!important;max-width:350px!important;
              align-items:center!important;text-align:center!important;transform:translateY(-1vh)!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap{
              width:124px!important;height:124px!important;margin:0 0 22px!important;border-radius:31px!important;
              position:relative!important;overflow:visible!important;isolation:isolate!important;
              animation:pg-premium-logo-in .72s cubic-bezier(.16,.84,.23,1) both,pg-premium-float 4.6s ease-in-out .9s infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:before{
              content:""!important;position:absolute!important;inset:-24px!important;border-radius:48px!important;z-index:-3!important;
              background:radial-gradient(circle,rgba(30,116,68,.18),rgba(30,116,68,.07) 38%,transparent 70%)!important;
              filter:blur(12px)!important;animation:pg-premium-halo 3.8s ease-in-out infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:after{
              content:""!important;position:absolute!important;inset:0!important;border-radius:31px!important;z-index:4!important;pointer-events:none!important;
              background:linear-gradient(118deg,transparent 20%,rgba(255,255,255,.12) 37%,rgba(255,255,255,.62) 49%,rgba(255,255,255,.10) 61%,transparent 78%)!important;
              transform:translateX(-165%)!important;mix-blend-mode:screen!important;animation:pg-premium-glint 4.8s ease-in-out 1.15s infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo{
              width:100%!important;height:100%!important;border-radius:31px!important;object-fit:cover!important;
              filter:drop-shadow(0 18px 34px rgba(17,59,38,.19))!important;
            }
            .pg-signature-orbit{position:absolute;left:50%;top:50%;width:198px;height:198px;transform:translate(-50%,-50%);z-index:-1;pointer-events:none}
            .pg-signature-orbit:before,.pg-signature-orbit:after{content:"";position:absolute;border-radius:50%;border:1px solid transparent}
            .pg-signature-orbit:before{inset:0;border-top-color:rgba(24,103,60,.30);border-right-color:rgba(24,103,60,.08);animation:pg-premium-orbit-a 7.2s linear infinite}
            .pg-signature-orbit:after{inset:17px;border-bottom-color:rgba(117,158,103,.34);border-left-color:rgba(117,158,103,.08);animation:pg-premium-orbit-b 6s linear infinite reverse}
            .pg-signature-dot{position:absolute;width:8px!important;height:8px!important;border-radius:50%;opacity:.78;filter:blur(.1px)}
            .pg-signature-dot.dog{left:13px!important;top:91px!important;background:#286f4b!important;box-shadow:0 0 18px rgba(40,111,75,.36)!important}
            .pg-signature-dot.cat{right:25px!important;bottom:42px!important;background:#8faf7f!important;box-shadow:0 0 18px rgba(143,175,127,.38)!important}
            .pg-signature-merge{position:absolute;left:50%;top:50%;width:6px!important;height:6px!important;border-radius:50%;transform:translate(-50%,-50%);background:#fff!important;opacity:.9;box-shadow:0 0 0 0 rgba(255,255,255,.7);animation:pg-premium-merge 2.7s ease-out infinite}
            .pg4-kicker{margin:0 0 8px!important;color:#8a978f!important;font-family:Inter,"Pretendard","Noto Sans KR",sans-serif!important;font-size:9px!important;font-weight:800!important;letter-spacing:.21em!important}
            .pg4-wordmark{margin:0!important;color:#18392d!important;font-family:Inter,"Pretendard","Noto Sans KR",sans-serif!important;font-size:clamp(37px,9.2vw,45px)!important;font-weight:820!important;line-height:1!important;letter-spacing:-.055em!important}
            .pg4-wordmark span{color:#276f4a!important}
            .pg4-emerald .petgrow-splash__tagline{margin:12px 0 0!important;color:#64766c!important;font-size:13.5px!important;font-weight:620!important;line-height:1.55!important;letter-spacing:-.025em!important}
            .pg4-emerald .petgrow-splash__progress{width:min(68vw,230px)!important;height:3px!important;margin:30px auto 0!important;border:0!important;border-radius:999px!important;background:rgba(65,99,77,.10)!important;box-shadow:none!important;overflow:hidden!important}
            .pg4-emerald .petgrow-splash__progress-bar{border-radius:999px!important;background:linear-gradient(90deg,#9fbba5 0%,#4f8764 54%,#245f42 100%)!important;box-shadow:0 0 12px rgba(52,112,75,.12)!important}
            .pg4-emerald .petgrow-splash__status{margin-top:10px!important;color:#8a9790!important;font-size:11px!important;font-weight:580!important}
            .pg4-emerald .petgrow-splash__dots{display:none!important}
            @keyframes pg-premium-logo-in{0%{opacity:0;transform:translateY(12px) scale(.90)}62%{opacity:1;transform:translateY(-2px) scale(1.018)}100%{opacity:1;transform:none}}
            @keyframes pg-premium-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
            @keyframes pg-premium-halo{0%,100%{opacity:.58;transform:scale(.96)}50%{opacity:.95;transform:scale(1.055)}}
            @keyframes pg-premium-glint{0%,65%{transform:translateX(-165%);opacity:0}73%{opacity:.78}88%,100%{transform:translateX(165%);opacity:0}}
            @keyframes pg-premium-orbit-a{to{transform:rotate(360deg)}}
            @keyframes pg-premium-orbit-b{to{transform:rotate(360deg)}}
            @keyframes pg-premium-merge{0%{box-shadow:0 0 0 0 rgba(255,255,255,.72)}68%{box-shadow:0 0 0 11px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
            @keyframes pg-premium-ambient{0%,100%{opacity:.68;transform:translate(-50%,-48%) scale(.98)}50%{opacity:1;transform:translate(-50%,-48%) scale(1.04)}}
            @media(max-width:430px){.pg4-emerald .petgrow-splash__logo-wrap{width:110px!important;height:110px!important}.pg-signature-orbit{width:176px;height:176px}.pg4-wordmark{font-size:40px!important}}
            @media(max-height:700px){.pg4-emerald .petgrow-splash__logo-wrap{width:92px!important;height:92px!important;margin-bottom:15px!important}.pg-signature-orbit{width:150px;height:150px}.pg4-wordmark{font-size:35px!important}.pg4-emerald .petgrow-splash__progress{margin-top:20px!important}}
            @media(prefers-reduced-motion:reduce){.pg4-emerald .petgrow-splash__logo-wrap,.pg4-emerald .petgrow-splash__logo-wrap:before,.pg4-emerald .petgrow-splash__logo-wrap:after,.pg-signature-orbit:before,.pg-signature-orbit:after,.pg-signature-merge,#petgrow-initial-splash.pg4-emerald:before{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-premium-signature-splash-script"},
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
                if(!content.querySelector(".pg4-wordmark")){
                  var kicker=document.createElement("div");kicker.className="pg4-kicker";kicker.textContent="PET LIFETIME CARE";
                  var word=document.createElement("div");word.className="pg4-wordmark";word.innerHTML="Pet<span>Grow</span>";
                  logo.insertAdjacentElement("afterend",word);word.insertAdjacentElement("beforebegin",kicker);
                }
                if(!logo.querySelector(".pg-signature-orbit")){
                  var orbit=document.createElement("div");orbit.className="pg-signature-orbit";orbit.setAttribute("aria-hidden","true");
                  orbit.innerHTML='<span class="pg-signature-dot dog"></span><span class="pg-signature-dot cat"></span><span class="pg-signature-merge"></span>';
                  logo.appendChild(orbit);
                }
                var trail=splash.querySelector(".pg-paw-trail");if(trail)trail.remove();
                var sprout=splash.querySelector(".pg-sprout");if(sprout)sprout.remove();
                var status=content.querySelector(".petgrow-splash__status");if(status)status.textContent="PetGrow를 준비하고 있어요";
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
