export default function petgrowPremiumSplashV3(){
  return {
    name:"petgrow-premium-splash-v3",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-premium-splash-v3-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash.pg3-premium{
              background:
                radial-gradient(circle at 50% 31%,rgba(255,255,255,.96) 0 12%,transparent 38%),
                radial-gradient(circle at 90% 18%,rgba(174,194,166,.22),transparent 27%),
                radial-gradient(circle at 8% 77%,rgba(221,205,172,.16),transparent 29%),
                linear-gradient(155deg,#fffdf8 0%,#f8f5ec 54%,#edf3e9 100%)!important;
              color:#163d2d!important;
            }
            #petgrow-initial-splash.pg3-premium:before{
              inset:-30%!important;
              border-radius:50%!important;
              background:conic-gradient(from 215deg,transparent,rgba(53,93,68,.035),transparent 34%,rgba(191,165,109,.035),transparent 70%)!important;
              animation:pg3-orbit 28s linear infinite!important;
            }
            #petgrow-initial-splash.pg3-premium:after{
              right:-17vw!important;top:-8vh!important;width:min(460px,70vw)!important;height:min(460px,70vw)!important;
              border-radius:50%!important;background:radial-gradient(circle at 32% 32%,rgba(255,255,255,.72),rgba(200,216,196,.20) 44%,rgba(255,255,255,.05) 70%)!important;
              border:1px solid rgba(255,255,255,.78)!important;box-shadow:inset 0 0 0 1px rgba(65,101,77,.035)!important;
              transform:none!important;
            }
            .pg3-premium .pg2-scene>svg{display:none!important}
            .pg3-premium .pg2-orb{background:rgba(255,255,255,.48);border-color:rgba(70,103,82,.09);box-shadow:0 10px 30px rgba(44,67,51,.04)}
            .pg3-premium .petgrow-splash__content{
              width:min(88vw,390px)!important;max-width:390px!important;align-items:center!important;text-align:center!important;
              transform:translateY(-1.2vh)!important;
            }
            .pg3-premium .pg2-brand{align-items:center!important;text-align:center!important}
            .pg3-premium .pg2-mark{
              width:68px!important;height:68px!important;margin:0 0 15px!important;border-radius:23px!important;
              background:linear-gradient(150deg,#183f30,#2f654b 64%,#769681)!important;
              box-shadow:0 15px 36px rgba(31,70,50,.17),inset 0 1px 0 rgba(255,255,255,.30)!important;
            }
            .pg3-premium .pg2-mark svg{width:38px!important;height:38px!important}
            .pg3-premium .pg2-kicker{justify-content:center!important;margin:0 0 7px!important;color:#718276!important;font-size:9px!important;letter-spacing:.22em!important}
            .pg3-premium .pg2-kicker:before{display:none!important}
            .pg3-premium .pg2-wordmark{
              color:#173d2d!important;font-family:Georgia,"Times New Roman",serif!important;font-size:clamp(42px,11vw,51px)!important;
              font-weight:500!important;letter-spacing:-.055em!important;line-height:.95!important;
              text-shadow:0 2px 12px rgba(31,67,49,.035);
            }
            .pg3-premium .pg2-wordmark span{color:#376b50!important}
            .pg3-subbrand{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px;color:#83927e;font-family:Georgia,"Times New Roman",serif;font-size:17px;letter-spacing:.22em}
            .pg3-subbrand i{display:block;width:30px;height:1px;background:linear-gradient(90deg,transparent,#c6ae74)}
            .pg3-subbrand i:last-child{background:linear-gradient(90deg,#c6ae74,transparent)}
            .pg3-premium .petgrow-splash__tagline{
              margin:18px 0 0!important;color:#244f3b!important;font-size:16px!important;font-weight:680!important;line-height:1.5!important;
              letter-spacing:-.035em!important;text-align:center!important;white-space:normal!important;
            }
            .pg3-premium .pg2-desc,.pg3-premium .pg2-pillrow{display:none!important}
            .pg3-petstage{position:relative;width:min(86vw,350px);height:205px;margin:16px auto 2px;display:grid;place-items:center;z-index:2}
            .pg3-petstage:before{content:"";position:absolute;left:50%;bottom:16px;width:245px;height:155px;transform:translateX(-50%);border-radius:50% 50% 44% 44%;background:radial-gradient(circle at 50% 42%,rgba(209,222,200,.66),rgba(233,239,226,.38) 58%,rgba(255,255,255,0) 72%);filter:blur(.2px)}
            .pg3-petstage svg{position:relative;z-index:2;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 15px 20px rgba(41,67,51,.10));animation:pg3-pets-float 4.8s ease-in-out infinite}
            .pg3-wave{position:absolute;left:-8vw;right:-8vw;bottom:-10vh;height:24vh;min-height:170px;z-index:1;border-radius:48% 52% 0 0/28% 30% 0 0;background:linear-gradient(165deg,#315b47 0%,#234a39 58%,#193c2e 100%);transform:rotate(-1.5deg);box-shadow:0 -12px 44px rgba(31,69,50,.08);pointer-events:none}
            .pg3-wave:before{content:"";position:absolute;left:7%;right:8%;top:18px;height:1px;background:linear-gradient(90deg,transparent,rgba(205,180,124,.72),transparent)}
            .pg3-wave:after{content:"🐾";position:absolute;left:50%;top:38px;transform:translateX(-50%) rotate(1.5deg);color:#cbb37c;font-size:19px;opacity:.82}
            .pg3-leaf{position:absolute;z-index:1;width:68px;height:120px;opacity:.42;pointer-events:none;filter:blur(.1px)}
            .pg3-leaf.left{left:-9px;top:15%;transform:rotate(-17deg)}
            .pg3-leaf.right{right:-13px;top:7%;transform:scaleX(-1) rotate(-8deg)}
            .pg3-leaf span{position:absolute;width:28px;height:12px;border-radius:100% 0 100% 0;background:linear-gradient(135deg,#7f9a80,#bdc8ad);transform-origin:0 50%}
            .pg3-leaf span:nth-child(1){left:26px;top:12px;transform:rotate(-28deg)}.pg3-leaf span:nth-child(2){left:35px;top:35px;transform:rotate(24deg)}.pg3-leaf span:nth-child(3){left:19px;top:58px;transform:rotate(-22deg)}.pg3-leaf span:nth-child(4){left:32px;top:80px;transform:rotate(28deg)}
            .pg3-leaf:after{content:"";position:absolute;left:30px;top:7px;width:1px;height:102px;background:#708a73;transform:rotate(7deg);transform-origin:top}
            .pg3-premium .petgrow-splash__progress{
              width:min(78vw,300px)!important;height:6px!important;margin:9px auto 0!important;background:rgba(30,71,49,.10)!important;
              border:1px solid rgba(69,101,78,.08)!important;box-shadow:inset 0 1px 2px rgba(28,55,40,.04),0 8px 20px rgba(44,67,51,.03)!important;
            }
            .pg3-premium .petgrow-splash__progress-bar{background:linear-gradient(90deg,#1f513a 0%,#48785c 62%,#9caf94 100%)!important;box-shadow:0 0 13px rgba(65,117,86,.22)!important}
            .pg3-premium .pg2-meta{width:min(78vw,300px)!important;display:grid!important;grid-template-columns:1fr!important;justify-items:center!important;gap:7px!important;margin-top:10px!important;text-align:center!important}
            .pg3-premium .pg2-meta>div{text-align:center!important;order:2!important}.pg3-premium .pg2-meta small{display:none!important}
            .pg3-premium .pg2-meta b{font-size:11px!important;color:#78867b!important;font-weight:650!important;white-space:normal!important}
            .pg3-premium .pg2-percent{order:1!important;color:#214d38!important;font-family:Georgia,"Times New Roman",serif!important;font-size:25px!important;font-weight:600!important;letter-spacing:-.035em!important}
            @keyframes pg3-pets-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
            @keyframes pg3-orbit{to{transform:rotate(360deg)}}
            @media(max-width:430px){
              .pg3-premium .petgrow-splash__content{width:min(90vw,360px)!important;transform:translateY(-.5vh)!important}
              .pg3-premium .pg2-mark{width:62px!important;height:62px!important;border-radius:21px!important;margin-bottom:13px!important}
              .pg3-premium .pg2-wordmark{font-size:43px!important}.pg3-subbrand{font-size:15px!important;margin-top:7px!important}
              .pg3-premium .petgrow-splash__tagline{font-size:15px!important;margin-top:15px!important}
              .pg3-petstage{height:188px!important;margin-top:10px!important;width:min(88vw,330px)!important}
              .pg3-premium .petgrow-splash__progress{margin-top:5px!important}.pg3-wave{height:21vh!important;bottom:-9vh!important}
            }
            @media(max-height:720px){
              .pg3-premium .pg2-mark{width:56px!important;height:56px!important;margin-bottom:10px!important}.pg3-premium .pg2-wordmark{font-size:39px!important}
              .pg3-subbrand{font-size:14px!important}.pg3-premium .petgrow-splash__tagline{font-size:14px!important;margin-top:11px!important}.pg3-petstage{height:145px!important;margin-top:6px!important}
              .pg3-premium .petgrow-splash__progress{margin-top:2px!important}.pg3-wave{opacity:.94}
            }
            @media(prefers-reduced-motion:reduce){.pg3-petstage svg,#petgrow-initial-splash.pg3-premium:before{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-premium-splash-v3-script"},
          injectTo:"head",
          children:`
            (function(){
              var done=false,tries=0;
              function leaf(cls){
                var node=document.createElement("div");node.className="pg3-leaf "+cls;
                node.innerHTML="<span></span><span></span><span></span><span></span>";return node;
              }
              function decorate(){
                if(done)return true;
                var splash=document.getElementById("petgrow-initial-splash");
                var content=splash&&splash.querySelector(".petgrow-splash__content");
                var brand=content&&content.querySelector(".pg2-brand");
                var word=content&&content.querySelector(".pg2-wordmark");
                var tagline=content&&content.querySelector(".petgrow-splash__tagline");
                var progress=content&&content.querySelector(".petgrow-splash__progress");
                if(!splash||!content||!brand||!word||!tagline||!progress)return false;
                done=true;splash.classList.add("pg3-premium");
                var kicker=brand.querySelector(".pg2-kicker");if(kicker)kicker.textContent="PET LIFETIME PLATFORM";
                if(!brand.querySelector(".pg3-subbrand")){
                  var sub=document.createElement("div");sub.className="pg3-subbrand";sub.innerHTML="<i></i><span>PetLife</span><i></i>";word.insertAdjacentElement("afterend",sub);
                }
                tagline.innerHTML="반려동물의 오늘을 기록하고,<br>평생을 함께";
                if(!content.querySelector(".pg3-petstage")){
                  var pets=document.createElement("div");pets.className="pg3-petstage";pets.setAttribute("aria-hidden","true");
                  pets.innerHTML='<svg viewBox="0 0 420 250" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pg3dog" x1="116" y1="64" x2="212" y2="214" gradientUnits="userSpaceOnUse"><stop stop-color="#FFF5DE"/><stop offset=".58" stop-color="#E8CF9E"/><stop offset="1" stop-color="#CDAF7A"/></linearGradient><linearGradient id="pg3cat" x1="230" y1="88" x2="310" y2="218" gradientUnits="userSpaceOnUse"><stop stop-color="#F8F7F1"/><stop offset=".55" stop-color="#C6C8C1"/><stop offset="1" stop-color="#969D96"/></linearGradient><linearGradient id="pg3leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8DA088"/><stop offset="1" stop-color="#C7C9A8"/></linearGradient></defs><ellipse cx="210" cy="217" rx="116" ry="17" fill="#284D3A" fill-opacity=".09"/><path d="M97 214c-11-43-1-87 29-112 21-18 52-22 74-5 26 20 33 63 23 117H97Z" fill="url(#pg3dog)"/><circle cx="159" cy="94" r="49" fill="url(#pg3dog)"/><path d="M123 61c-26 5-38 33-25 60 9 18 27 21 36 5 9-17 5-48-11-65Z" fill="#C59E68"/><path d="M194 60c24 7 34 35 20 60-9 16-25 18-34 3-9-16-3-48 14-63Z" fill="#D4B67F"/><ellipse cx="146" cy="91" rx="4.5" ry="5" fill="#2C322E"/><ellipse cx="176" cy="91" rx="4.5" ry="5" fill="#2C322E"/><ellipse cx="161" cy="107" rx="7.5" ry="5.6" fill="#403931"/><path d="M160 113c0 8-7 12-13 10M162 113c1 8 8 12 14 9" stroke="#745F49" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="146" cy="112" rx="13" ry="9" fill="#FFF7E7" fill-opacity=".82"/><ellipse cx="176" cy="112" rx="13" ry="9" fill="#FFF7E7" fill-opacity=".82"/><path d="M219 216c-8-39 2-77 26-98 18-16 43-18 62-4 24 18 30 57 23 102H219Z" fill="url(#pg3cat)"/><circle cx="272" cy="119" r="40" fill="url(#pg3cat)"/><path d="M239 96l8-36 26 26M277 84l27-26 5 39" fill="#A5AAA4"/><path d="M247 74l4 15 10-8M293 72l-5 16 11-8" fill="#E9D3D0" fill-opacity=".75"/><ellipse cx="259" cy="117" rx="4" ry="5" fill="#34423A"/><ellipse cx="286" cy="117" rx="4" ry="5" fill="#34423A"/><path d="M269 129l5 4 5-4" stroke="#7D6B67" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M273 133c-1 7-7 9-12 8M275 133c1 6 7 9 12 7" stroke="#7D6B67" stroke-width="1.8" stroke-linecap="round"/><path d="M247 132l-31 1M248 139l-28 9M299 132l30 1M298 139l28 9" stroke="#7D847E" stroke-width="1.5" stroke-linecap="round" opacity=".7"/><path d="M326 209c28-4 38-22 28-40-7-12-20-13-28-4" stroke="#89928B" stroke-width="9" stroke-linecap="round"/><path d="M88 177c-25-29-43-54-51-78" stroke="#91A18D" stroke-width="2" stroke-linecap="round"/><path d="M43 116c13-6 23-3 30 7-13 8-24 6-30-7ZM57 142c15-3 25 2 30 13-15 5-25 1-30-13ZM352 154c22-23 35-45 41-66" stroke="#91A18D" stroke-width="2" stroke-linecap="round"/><path d="M381 105c-13-5-23-1-29 10 13 7 24 4 29-10ZM367 131c-14-2-24 4-27 15 14 4 24-1 27-15Z" fill="url(#pg3leaf)"/><circle cx="352" cy="72" r="4" fill="#C9AD70"/><path d="M351 58v7M347.5 61.5h7" stroke="#C9AD70" stroke-width="1.7" stroke-linecap="round"/></svg>';
                  progress.insertAdjacentElement("beforebegin",pets);
                }
                if(!splash.querySelector(".pg3-wave")){var wave=document.createElement("div");wave.className="pg3-wave";wave.setAttribute("aria-hidden","true");splash.append(wave);}
                if(!splash.querySelector(".pg3-leaf.left")){splash.append(leaf("left"),leaf("right"));}
                return true;
              }
              function tryDecorate(){if(decorate())return;if(++tries<160)window.setTimeout(tryDecorate,25);}
              if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tryDecorate,{once:true});else tryDecorate();
              window.setTimeout(tryDecorate,0);
            })();
          `
        }
      ];
    }
  };
}
