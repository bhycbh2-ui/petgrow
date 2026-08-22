export default function petgrowSplashV4(){
  return {
    name:"petgrow-splash-v4-20260822",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-splash-v4-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash.pg4-emerald{
              background:
                radial-gradient(circle at 14% 4%,rgba(198,222,178,.48),transparent 29%),
                radial-gradient(circle at 88% 18%,rgba(219,231,198,.55),transparent 30%),
                linear-gradient(180deg,#fffdf6 0%,#f6f4e8 45%,#e9f1df 100%)!important;
              color:#153b29!important;
              isolation:isolate;
            }
            #petgrow-initial-splash.pg4-emerald:before{
              content:""!important;position:absolute!important;inset:auto!important;left:-22vw!important;bottom:-18vw!important;
              width:74vw!important;height:74vw!important;border-radius:50%!important;
              background:radial-gradient(circle at 55% 45%,rgba(10,111,61,.18),rgba(10,111,61,0) 68%)!important;
              filter:blur(2px)!important;animation:none!important;transform:none!important;z-index:0!important;
            }
            #petgrow-initial-splash.pg4-emerald:after{
              content:""!important;position:absolute!important;inset:auto!important;right:-24vw!important;top:8vh!important;
              width:68vw!important;height:68vw!important;border-radius:50%!important;
              background:radial-gradient(circle at 50% 50%,rgba(132,175,111,.14),rgba(132,175,111,0) 70%)!important;
              border:0!important;box-shadow:none!important;filter:blur(1px)!important;animation:none!important;transform:none!important;z-index:0!important;
            }
            .pg4-emerald .petgrow-runners{display:none!important}
            .pg4-emerald .petgrow-splash__content{
              position:relative!important;z-index:2!important;width:min(88vw,390px)!important;max-width:390px!important;
              align-items:center!important;text-align:center!important;transform:translateY(-1.5vh)!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap{
              width:118px!important;height:118px!important;aspect-ratio:1!important;margin:0 0 20px!important;border-radius:29px!important;
              position:relative!important;overflow:visible!important;isolation:isolate!important;
              animation:pg4-mark-in .72s cubic-bezier(.16,.8,.22,1) both,pg4-mark-breathe 4.2s ease-in-out .8s infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:before{
              content:""!important;position:absolute!important;inset:-22%!important;z-index:-2!important;border-radius:38px!important;
              background:radial-gradient(circle,rgba(28,150,79,.22),rgba(28,150,79,0) 70%)!important;
              filter:blur(12px)!important;animation:pg4-halo 3.2s ease-in-out infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo-wrap:after{
              content:""!important;position:absolute!important;inset:-8%!important;z-index:2!important;pointer-events:none!important;border-radius:34px!important;
              background:conic-gradient(from 210deg,transparent 0 27%,rgba(255,255,255,.32) 34%,transparent 43% 69%,rgba(152,223,170,.23) 77%,transparent 86%)!important;
              mix-blend-mode:screen!important;mask:radial-gradient(circle at center,transparent 0 48%,#000 64%);-webkit-mask:radial-gradient(circle at center,transparent 0 48%,#000 64%);
              animation:pg4-logo-mix 3.7s linear infinite!important;
            }
            .pg4-emerald .petgrow-splash__logo{
              width:100%!important;height:100%!important;border-radius:29px!important;object-fit:cover!important;
              filter:drop-shadow(0 22px 35px rgba(4,76,44,.22))!important;
            }
            .pg4-wordmark{
              margin:0!important;color:#0a5d36!important;font-family:Georgia,"Times New Roman",serif!important;
              font-size:clamp(43px,11vw,54px)!important;font-weight:500!important;line-height:.95!important;letter-spacing:-.055em!important;
            }
            .pg4-wordmark span{color:#0d7a45!important}
            .pg4-kicker{margin:0 0 10px!important;color:#718579!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:9px!important;font-weight:800!important;letter-spacing:.22em!important}
            .pg4-emerald .petgrow-splash__tagline{
              margin:14px 0 0!important;color:#315945!important;font-size:15px!important;font-weight:700!important;line-height:1.55!important;letter-spacing:-.035em!important;text-align:center!important;
            }
            .pg4-emerald .petgrow-splash__progress{
              width:min(76vw,290px)!important;height:5px!important;margin:34px auto 0!important;border:1px solid rgba(43,95,65,.11)!important;
              background:rgba(255,255,255,.56)!important;box-shadow:inset 0 1px 2px rgba(29,64,44,.05)!important;
            }
            .pg4-emerald .petgrow-splash__progress-bar{
              background:linear-gradient(90deg,#1a934f 0%,#08713f 60%,#b8d29e 100%)!important;
              box-shadow:0 0 18px rgba(21,144,76,.23)!important;
            }
            .pg4-emerald .petgrow-splash__status{margin-top:11px!important;color:#7a897e!important;font-size:11px!important;font-weight:650!important}
            .pg4-emerald .petgrow-splash__dots{display:none!important}
            .pg4-brand-leaves{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
            .pg4-brand-leaves:before,.pg4-brand-leaves:after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;opacity:.42;filter:blur(.2px)}
            .pg4-brand-leaves:before{left:-72px;top:8%;background:radial-gradient(ellipse at 65% 50%,rgba(117,165,93,.20),transparent 58%);transform:rotate(-18deg)}
            .pg4-brand-leaves:after{right:-74px;bottom:7%;background:radial-gradient(ellipse at 35% 50%,rgba(18,118,64,.18),transparent 58%);transform:rotate(17deg)}
            @keyframes pg4-mark-in{0%{opacity:0;transform:translateY(12px) scale(.90)}64%{opacity:1;transform:translateY(-2px) scale(1.018)}100%{opacity:1;transform:none}}
            @keyframes pg4-mark-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.012)}}
            @keyframes pg4-logo-mix{to{transform:rotate(360deg)}}
            @keyframes pg4-halo{0%,100%{opacity:.62;transform:scale(.94)}50%{opacity:1;transform:scale(1.08)}}
            @media(max-width:430px){
              .pg4-emerald .petgrow-splash__content{width:min(90vw,350px)!important;transform:translateY(-.5vh)!important}
              .pg4-emerald .petgrow-splash__logo-wrap{width:108px!important;height:108px!important;margin-bottom:18px!important}
              .pg4-wordmark{font-size:46px!important}.pg4-emerald .petgrow-splash__tagline{font-size:14px!important}
              .pg4-emerald .petgrow-splash__progress{margin-top:30px!important}
            }
            @media(max-height:700px){
              .pg4-emerald .petgrow-splash__logo-wrap{width:86px!important;height:86px!important;margin-bottom:12px!important}
              .pg4-wordmark{font-size:40px!important}.pg4-emerald .petgrow-splash__tagline{font-size:13px!important;margin-top:10px!important}
              .pg4-emerald .petgrow-splash__progress{margin-top:18px!important}
            }
            @media(prefers-reduced-motion:reduce){.pg4-emerald .petgrow-splash__logo-wrap,.pg4-emerald .petgrow-splash__logo-wrap:before,.pg4-emerald .petgrow-splash__logo-wrap:after{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-splash-v4-script"},
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
                if(splash.classList.contains("pg4-emerald"))return;
                splash.classList.add("pg4-emerald");
                tagline.textContent="우리 아이의 건강한 성장을 함께";
                if(!content.querySelector(".pg4-wordmark")){
                  var kicker=document.createElement("div");kicker.className="pg4-kicker";kicker.textContent="PET LIFETIME CARE";
                  var word=document.createElement("div");word.className="pg4-wordmark";word.innerHTML="Pet<span>Grow</span>";
                  logo.insertAdjacentElement("afterend",word);word.insertAdjacentElement("beforebegin",kicker);
                }
                var status=content.querySelector(".petgrow-splash__status");if(status)status.textContent="우리 아이의 하루를 준비하고 있어요";
                if(!splash.querySelector(".pg4-brand-leaves")){
                  var leaves=document.createElement("div");leaves.className="pg4-brand-leaves";leaves.setAttribute("aria-hidden","true");splash.insertBefore(leaves,splash.firstChild);
                }
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
