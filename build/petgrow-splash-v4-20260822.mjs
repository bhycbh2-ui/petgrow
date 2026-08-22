export default function petgrowSplashV4(){
  return {
    name:"petgrow-signature-splash-20260822",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-signature-splash-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash.pg4-emerald{
              background:
                radial-gradient(circle at 50% 34%,rgba(209,232,213,.54),transparent 28%),
                linear-gradient(180deg,#fbfcf8 0%,#f3f7f1 56%,#edf4ec 100%)!important;
              color:#17362b!important;
              isolation:isolate!important;
              overflow:hidden!important;
            }
            #petgrow-initial-splash.pg4-emerald:before{
              content:""!important;position:absolute!important;left:50%!important;bottom:-31vw!important;
              width:min(112vw,760px)!important;height:min(78vw,520px)!important;border-radius:50%!important;
              background:radial-gradient(ellipse,rgba(49,126,79,.12),rgba(49,126,79,0) 68%)!important;
              transform:translateX(-50%)!important;z-index:0!important;animation:pg-splash-ground 4s ease-in-out infinite!important;
            }
            #petgrow-initial-splash.pg4-emerald:after{display:none!important}
            .pg4-emerald .petgrow-runners{display:none!important}
            .pg4-emerald .petgrow-splash__content{
              position:relative!important;z-index:3!important;width:min(88vw,360px)!important;max-width:360px!important;
              align-items:center!important;text-align:center!important;transform:none!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap{
              width:116px!important;height:116px!important;margin:0 0 20px!important;border-radius:29px!important;
              position:relative!important;overflow:visible!important;isolation:isolate!important;
              animation:pg-logo-arrive .68s cubic-bezier(.16,.8,.24,1) both,pg-logo-breathe 3.6s ease-in-out .8s infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:before{
              content:""!important;position:absolute!important;inset:-18px!important;border-radius:40px!important;z-index:-2!important;
              background:radial-gradient(circle,rgba(24,125,71,.19),rgba(24,125,71,0) 69%)!important;
              filter:blur(9px)!important;animation:pg-halo 3.2s ease-in-out infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:after{
              content:""!important;position:absolute!important;inset:-10px!important;border-radius:35px!important;z-index:2!important;pointer-events:none!important;
              background:linear-gradient(115deg,transparent 27%,rgba(255,255,255,.44) 43%,transparent 58%)!important;
              transform:translateX(-145%) rotate(8deg)!important;mix-blend-mode:screen!important;
              animation:pg-logo-shine 3.9s ease-in-out 1s infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo{
              width:100%!important;height:100%!important;border-radius:29px!important;object-fit:cover!important;
              filter:drop-shadow(0 16px 30px rgba(14,62,38,.18))!important;
            }
            .pg-signature-orbit{
              position:absolute;left:50%;top:50%;width:188px;height:188px;transform:translate(-50%,-50%);z-index:-1;pointer-events:none;
            }
            .pg-signature-orbit:before,.pg-signature-orbit:after{
              content:"";position:absolute;inset:0;border-radius:50%;border:1.5px solid transparent;
            }
            .pg-signature-orbit:before{
              border-top-color:rgba(31,107,70,.42);border-right-color:rgba(31,107,70,.12);
              animation:pg-orbit-dog 4.8s linear infinite;
            }
            .pg-signature-orbit:after{
              inset:13px;border-bottom-color:rgba(116,164,103,.45);border-left-color:rgba(116,164,103,.13);
              animation:pg-orbit-cat 4.1s linear infinite reverse;
            }
            .pg-signature-dot{position:absolute;width:12px;height:12px;border-radius:50%;box-shadow:0 0 16px rgba(31,107,70,.32)}
            .pg-signature-dot.dog{left:8px;top:86px;background:#1f6b46;animation:pg-dot-dog 4.8s linear infinite}
            .pg-signature-dot.cat{right:18px;bottom:40px;background:#83ad72;animation:pg-dot-cat 4.1s linear infinite reverse}
            .pg-signature-merge{
              position:absolute;left:50%;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);
              background:rgba(255,255,255,.82);box-shadow:0 0 0 0 rgba(255,255,255,.62);z-index:4;pointer-events:none;
              animation:pg-merge-pulse 2.2s ease-out infinite;
            }
            .pg-paw-trail{position:absolute;left:50%;top:calc(50% + 92px);width:220px;height:54px;transform:translateX(-50%);pointer-events:none;z-index:1}
            .pg-paw-step{position:absolute;width:6px;height:6px;border-radius:50%;background:#2d7d56;opacity:0;box-shadow:7px -5px 0 -1px #2d7d56,-7px -5px 0 -1px #2d7d56,0 -10px 0 -1px #2d7d56;animation:pg-paw-rise 3.4s ease-in-out infinite}
            .pg-paw-step.s1{left:32px;bottom:2px;animation-delay:.1s}.pg-paw-step.s2{left:82px;bottom:13px;animation-delay:.55s}.pg-paw-step.s3{left:132px;bottom:22px;animation-delay:1s}.pg-paw-step.s4{left:180px;bottom:30px;animation-delay:1.45s}
            .pg-sprout{position:absolute;left:calc(50% + 74px);top:calc(50% + 109px);width:18px;height:26px;opacity:0;transform-origin:50% 100%;animation:pg-sprout-grow 3.4s ease-in-out 1.55s infinite;pointer-events:none;z-index:2}
            .pg-sprout:before,.pg-sprout:after{content:"";position:absolute;bottom:5px;width:11px;height:7px;background:#6fa160;border-radius:100% 0 100% 0}
            .pg-sprout:before{left:1px;transform:rotate(-28deg)}.pg-sprout:after{right:0;transform:scaleX(-1) rotate(-28deg)}
            .pg-sprout i{position:absolute;left:8px;bottom:0;width:2px;height:15px;background:#4a8a5e;border-radius:2px}
            .pg4-kicker{margin:0 0 8px!important;color:#819087!important;font-family:Inter,"Pretendard","Noto Sans KR",sans-serif!important;font-size:9px!important;font-weight:800!important;letter-spacing:.19em!important}
            .pg4-wordmark{margin:0!important;color:#193a2e!important;font-family:Inter,"Pretendard","Noto Sans KR",sans-serif!important;font-size:clamp(36px,9vw,44px)!important;font-weight:850!important;line-height:1!important;letter-spacing:-.05em!important}
            .pg4-wordmark span{color:#1f6b46!important}
            .pg4-emerald .petgrow-splash__tagline{margin:12px 0 0!important;color:#61776b!important;font-size:14px!important;font-weight:650!important;line-height:1.55!important;letter-spacing:-.025em!important;text-align:center!important}
            .pg4-emerald .petgrow-splash__progress{width:min(72vw,248px)!important;height:5px!important;margin:28px auto 0!important;border:0!important;border-radius:999px!important;background:#dbe8df!important;box-shadow:none!important;overflow:hidden!important}
            .pg4-emerald .petgrow-splash__progress-bar{border-radius:999px!important;background:linear-gradient(90deg,#1f6b46 0%,#38895f 72%,#86ad75 100%)!important;box-shadow:none!important}
            .pg4-emerald .petgrow-splash__status{margin-top:10px!important;color:#87968e!important;font-size:11px!important;font-weight:600!important}
            .pg4-emerald .petgrow-splash__dots{display:none!important}
            @keyframes pg-logo-arrive{0%{opacity:0;transform:translateY(10px) scale(.9)}70%{opacity:1;transform:translateY(-2px) scale(1.02)}100%{transform:none}}
            @keyframes pg-logo-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.012)}}
            @keyframes pg-halo{0%,100%{opacity:.65;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
            @keyframes pg-logo-shine{0%,62%{transform:translateX(-145%) rotate(8deg);opacity:0}72%{opacity:.85}90%,100%{transform:translateX(145%) rotate(8deg);opacity:0}}
            @keyframes pg-orbit-dog{to{transform:rotate(360deg)}}
            @keyframes pg-orbit-cat{to{transform:rotate(360deg)}}
            @keyframes pg-dot-dog{50%{box-shadow:0 0 22px rgba(31,107,70,.52)}}
            @keyframes pg-dot-cat{50%{box-shadow:0 0 22px rgba(116,164,103,.52)}}
            @keyframes pg-merge-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.56);opacity:.95}70%{box-shadow:0 0 0 13px rgba(255,255,255,0);opacity:.52}100%{box-shadow:0 0 0 0 rgba(255,255,255,0);opacity:.95}}
            @keyframes pg-paw-rise{0%,8%{opacity:0;transform:translateY(8px) scale(.7)}20%,48%{opacity:.5;transform:translateY(0) scale(1)}70%,100%{opacity:0;transform:translateY(-5px) scale(.9)}}
            @keyframes pg-sprout-grow{0%,15%{opacity:0;transform:scale(.3) translateY(6px)}32%,62%{opacity:.8;transform:scale(1) translateY(0)}85%,100%{opacity:0;transform:scale(.96) translateY(-2px)}}
            @keyframes pg-splash-ground{0%,100%{opacity:.72;transform:translateX(-50%) scale(1)}50%{opacity:1;transform:translateX(-50%) scale(1.03)}}
            @media(max-width:430px){.pg4-emerald .petgrow-splash__logo-wrap{width:104px!important;height:104px!important}.pg-signature-orbit{width:170px;height:170px}.pg4-wordmark{font-size:39px!important}.pg-paw-trail{transform:translateX(-50%) scale(.9)}}
            @media(max-height:700px){.pg4-emerald .petgrow-splash__logo-wrap{width:88px!important;height:88px!important;margin-bottom:14px!important}.pg-signature-orbit{width:148px;height:148px}.pg4-wordmark{font-size:35px!important}.pg4-emerald .petgrow-splash__progress{margin-top:20px!important}.pg-paw-trail,.pg-sprout{display:none!important}}
            @media(prefers-reduced-motion:reduce){.pg4-emerald .petgrow-splash__logo-wrap,.pg4-emerald .petgrow-splash__logo-wrap:before,.pg4-emerald .petgrow-splash__logo-wrap:after,.pg-signature-orbit:before,.pg-signature-orbit:after,.pg-signature-dot,.pg-signature-merge,.pg-paw-step,.pg-sprout,#petgrow-initial-splash.pg4-emerald:before{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-signature-splash-script"},
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
                if(!splash.querySelector(".pg-paw-trail")){
                  var trail=document.createElement("div");trail.className="pg-paw-trail";trail.setAttribute("aria-hidden","true");
                  trail.innerHTML='<span class="pg-paw-step s1"></span><span class="pg-paw-step s2"></span><span class="pg-paw-step s3"></span><span class="pg-paw-step s4"></span>';
                  splash.appendChild(trail);
                  var sprout=document.createElement("span");sprout.className="pg-sprout";sprout.setAttribute("aria-hidden","true");sprout.innerHTML='<i></i>';splash.appendChild(sprout);
                }
                var status=content.querySelector(".petgrow-splash__status");if(status)status.textContent="우리 아이의 하루를 준비하고 있어요";
                var oldLeaves=splash.querySelector(".pg4-brand-leaves");if(oldLeaves)oldLeaves.remove();
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
