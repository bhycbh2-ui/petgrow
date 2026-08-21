export default function petgrowPremiumSplashV2(){
  return {
    name:"petgrow-premium-splash-v2",
    transformIndexHtml(){
      return [
        {
          tag:"style",
          attrs:{id:"petgrow-premium-splash-v2-style"},
          injectTo:"head",
          children:`
            #petgrow-initial-splash{
              background:
                radial-gradient(circle at 14% 16%,rgba(255,255,255,.95) 0 8%,transparent 32%),
                radial-gradient(circle at 86% 18%,rgba(139,177,153,.22),transparent 30%),
                radial-gradient(circle at 72% 84%,rgba(96,145,116,.18),transparent 34%),
                linear-gradient(150deg,#f8fbf7 0%,#eef5ef 48%,#dfece3 100%)!important;
              padding:max(24px,env(safe-area-inset-top)) 22px max(24px,env(safe-area-inset-bottom))!important;
              transition:opacity 220ms ease,visibility 220ms ease!important;
              isolation:isolate;
            }
            #petgrow-initial-splash:before{
              content:""!important;position:absolute!important;inset:-22%!important;width:auto!important;height:auto!important;
              border-radius:42%!important;background:conic-gradient(from 210deg,transparent,rgba(35,82,59,.055),transparent 34%,rgba(77,126,96,.045),transparent 72%)!important;
              animation:pg2-orbit 22s linear infinite!important;transform:none!important;left:auto!important;bottom:auto!important;z-index:0!important;
            }
            #petgrow-initial-splash:after{
              content:""!important;position:absolute!important;right:-15vw!important;top:-10vh!important;left:auto!important;bottom:auto!important;
              width:min(520px,72vw)!important;height:min(520px,72vw)!important;border-radius:38%!important;
              background:linear-gradient(145deg,rgba(255,255,255,.6),rgba(255,255,255,.05))!important;border:1px solid rgba(255,255,255,.62)!important;
              transform:rotate(18deg)!important;pointer-events:none;z-index:0!important;
            }
            .petgrow-runners,.petgrow-splash__dots,.petgrow-splash__logo-wrap{display:none!important}
            .pg2-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;color:#446b56}
            .pg2-scene svg{position:absolute;right:-38px;bottom:max(1vh,4px);width:min(650px,112vw);height:auto;opacity:.15;filter:drop-shadow(0 18px 34px rgba(29,68,48,.08))}
            .pg2-orb{position:absolute;border-radius:999px;border:1px solid rgba(63,111,82,.1);background:rgba(255,255,255,.34);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
            .pg2-orb.one{width:74px;height:74px;left:8%;top:18%;animation:pg2-float 5.8s ease-in-out infinite}
            .pg2-orb.two{width:28px;height:28px;right:13%;top:35%;animation:pg2-float 4.8s ease-in-out .7s infinite}
            .pg2-orb.three{width:44px;height:44px;left:18%;bottom:15%;animation:pg2-float 6.6s ease-in-out 1.2s infinite}
            .petgrow-splash__content{position:relative!important;z-index:3!important;width:min(88vw,430px)!important;box-sizing:border-box!important;transform:translateY(-2vh)!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;align-items:flex-start!important;text-align:left!important}
            .pg2-brand{width:100%;display:flex;flex-direction:column;align-items:flex-start;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;animation:pg2-brand-in .62s cubic-bezier(.2,.78,.2,1) both}
            .pg2-mark{width:74px;height:74px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(145deg,#173f2f,#2f6a4d 58%,#6b9a7d);box-shadow:0 18px 38px rgba(28,73,50,.19),inset 0 1px 0 rgba(255,255,255,.22);margin-bottom:24px;position:relative;overflow:hidden}
            .pg2-mark:before{content:"";position:absolute;width:60px;height:60px;left:-26px;top:-26px;border-radius:50%;background:rgba(255,255,255,.14)}
            .pg2-mark svg{width:43px;height:43px;position:relative;z-index:1;filter:drop-shadow(0 4px 8px rgba(12,39,26,.12))}
            .pg2-kicker{display:flex;align-items:center;gap:8px;margin:0 0 9px;color:#587565;font-size:10px;font-weight:850;letter-spacing:.19em}
            .pg2-kicker:before{content:"";width:19px;height:2px;border-radius:999px;background:#5f8c72}
            .pg2-wordmark{margin:0;color:#173528;font-size:clamp(38px,10vw,48px);font-weight:900;letter-spacing:-.065em;line-height:.98}
            .pg2-wordmark span{color:#4e8567}
            .petgrow-splash__tagline{margin:17px 0 0!important;color:#30493b!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif!important;font-size:18px!important;font-weight:780!important;line-height:1.42!important;letter-spacing:-.045em!important;text-align:left!important}
            .pg2-desc{margin:8px 0 0;color:#718379;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:12px;font-weight:620;line-height:1.55;letter-spacing:-.025em}
            .pg2-pillrow{display:flex;flex-wrap:wrap;gap:7px;margin-top:20px}
            .pg2-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.58);border:1px solid rgba(58,103,77,.1);color:#547060;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:9px;font-weight:800;letter-spacing:.06em;box-shadow:0 8px 24px rgba(43,82,60,.045)}
            .pg2-pill i{width:5px;height:5px;border-radius:50%;background:#6a9a7c;box-shadow:0 0 0 3px rgba(106,154,124,.11)}
            .petgrow-splash__progress{width:100%!important;height:6px!important;margin-top:34px!important;background:rgba(26,61,42,.09)!important;border:0!important;box-shadow:inset 0 1px 2px rgba(20,54,36,.05)!important;border-radius:999px!important;overflow:hidden!important}
            .petgrow-splash__progress-bar{width:1%!important;animation:none!important;background:linear-gradient(90deg,#1b4935 0%,#4c8466 58%,#91b69e 100%)!important;box-shadow:0 0 14px rgba(75,132,102,.3);transition:none!important}
            .pg2-meta{width:100%;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif}
            .pg2-meta>div{min-width:0;text-align:left}.pg2-meta small{display:block;color:#7e9187;font-size:9px;font-weight:780;line-height:1.4;margin-bottom:3px;letter-spacing:.11em}.pg2-meta b{display:block;color:#40594b;font-size:12px;font-weight:720;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .pg2-percent{flex:0 0 auto;color:#1f5139;font-size:28px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.06em}
            .petgrow-splash__status{display:none!important}
            @keyframes pg2-brand-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
            @keyframes pg2-orbit{to{transform:rotate(360deg)}}
            @keyframes pg2-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}}
            @media(max-width:430px){.petgrow-splash__content{width:min(88vw,370px)!important;transform:translateY(-1vh)!important}.pg2-mark{width:68px;height:68px;border-radius:22px;margin-bottom:22px}.pg2-wordmark{font-size:42px}.petgrow-splash__tagline{font-size:17px!important}.pg2-desc{font-size:11px}.petgrow-splash__progress{margin-top:30px!important}.pg2-percent{font-size:26px}.pg2-scene svg{width:128vw;right:-31vw;bottom:1vh}}
            @media(max-width:350px){.pg2-pillrow{display:none}.petgrow-splash__progress{margin-top:25px!important}}
            @media(prefers-reduced-motion:reduce){#petgrow-initial-splash:before,.pg2-orb{animation:none!important}}
          `
        },
        {
          tag:"script",
          attrs:{id:"petgrow-premium-splash-v2-script"},
          injectTo:"head",
          children:`
            (function(){
              var state={mounted:false,current:1,externalTarget:1,ready:false,readyAt:0,hidden:false,last:0,started:performance.now()};
              function label(p){
                if(p<24)return "PetGrow를 준비하고 있어요";
                if(p<52)return "로그인 정보를 확인하고 있어요";
                if(p<78)return "우리 아이 정보를 연결하고 있어요";
                if(p<94)return "화면을 자연스럽게 준비하고 있어요";
                if(p<100)return "거의 다 준비됐어요";
                return "준비가 완료됐어요";
              }
              function render(){
                var splash=document.getElementById("petgrow-initial-splash");if(!splash)return;
                var shown=Math.max(1,Math.min(100,Math.round(state.current)));
                var bar=splash.querySelector(".petgrow-splash__progress-bar");
                var pct=splash.querySelector(".pg2-percent");
                var msg=splash.querySelector(".pg2-message");
                if(bar){bar.style.setProperty("width",shown+"%","important");bar.setAttribute("aria-valuenow",String(shown));}
                if(pct)pct.textContent=shown+"%";
                if(msg)msg.textContent=label(shown);
              }
              function autoTarget(elapsed){
                if(elapsed<350)return 1+(elapsed/350)*7;
                if(elapsed<900)return 8+((elapsed-350)/550)*20;
                if(elapsed<1500)return 28+((elapsed-900)/600)*24;
                if(elapsed<2300)return 52+((elapsed-1500)/800)*23;
                if(elapsed<3200)return 75+((elapsed-2300)/900)*15;
                if(elapsed<4500)return 90+((elapsed-3200)/1300)*7;
                return Math.min(99,97+((elapsed-4500)/2600)*2);
              }
              function tick(now){
                if(state.hidden)return;
                if(!state.last)state.last=now;
                var dt=Math.min(64,Math.max(8,now-state.last));state.last=now;
                var elapsed=now-state.started;
                var target=Math.max(state.externalTarget,autoTarget(elapsed));
                if(state.ready){
                  var sinceReady=now-state.readyAt;
                  if(elapsed<1250)target=Math.max(target,86);
                  else target=100;
                  if(sinceReady>220)target=100;
                }else target=Math.min(99,target);
                target=Math.max(state.current,target);
                var speed=state.current<30?32:state.current<70?38:state.current<90?22:state.ready?24:6;
                var step=speed*(dt/1000);
                state.current=Math.min(target,state.current+step);
                render();
                if(state.ready&&state.current>=99.5){
                  state.current=100;render();state.hidden=true;
                  window.setTimeout(function(){
                    var splash=document.getElementById("petgrow-initial-splash");if(!splash)return;
                    splash.classList.add("petgrow-splash--hide");
                    window.setTimeout(function(){if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);},240);
                  },150);
                  return;
                }
                requestAnimationFrame(tick);
              }
              function mount(){
                if(state.mounted)return;
                var splash=document.getElementById("petgrow-initial-splash");if(!splash)return;
                var content=splash.querySelector(".petgrow-splash__content");var tagline=splash.querySelector(".petgrow-splash__tagline");var progress=splash.querySelector(".petgrow-splash__progress");
                if(!content||!progress)return;state.mounted=true;
                var scene=document.createElement("div");scene.className="pg2-scene";scene.innerHTML='<span class="pg2-orb one"></span><span class="pg2-orb two"></span><span class="pg2-orb three"></span><svg viewBox="0 0 620 370" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M100 261c20-67 70-107 132-107 56 0 104 31 129 81 16 32 16 67 4 102"/><path d="M151 168c-25-5-47-25-54-52 28-7 58 1 76 22"/><path d="M202 157c-4-31 9-61 36-80 22 25 28 57 16 87"/><circle cx="202" cy="202" r="5" fill="currentColor" stroke="none"/><path d="M168 225c16 14 38 14 54 1M109 270c-12 35-5 68 18 94M323 278c18 24 26 50 24 78"/><path d="M389 309c5-64 45-112 104-125 40-9 81 4 109 34"/><path d="M446 194l7-61 44 47M512 179l42-47 12 61"/><circle cx="488" cy="220" r="4.8" fill="currentColor" stroke="none"/><circle cx="530" cy="220" r="4.8" fill="currentColor" stroke="none"/><path d="M505 235l6 6 7-6M472 246l-48 2M474 257l-45 15M546 246l47 2M544 257l45 15"/></g></svg>';
                splash.insertBefore(scene,splash.firstChild);
                var brand=document.createElement("div");brand.className="pg2-brand";brand.innerHTML='<div class="pg2-mark"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="#fff"><ellipse cx="18" cy="20" rx="6.5" ry="8" transform="rotate(-28 18 20)"/><ellipse cx="32" cy="14.5" rx="6.3" ry="8"/><ellipse cx="46" cy="20" rx="6.5" ry="8" transform="rotate(28 46 20)"/><path d="M18 41c0-10 6.2-17 14-17s14 7 14 17c0 8.5-6.5 13.5-14 13.5S18 49.5 18 41Z"/></g><path d="M32 31.5c-5.7-6.5-13.5 1.7 0 12 13.5-10.3 5.7-18.5 0-12Z" fill="#b8d7c2"/></svg></div><p class="pg2-kicker">PET LIFETIME PLATFORM</p><h1 class="pg2-wordmark">Pet<span>Grow</span></h1>';
                content.insertBefore(brand,content.firstChild);
                if(tagline)tagline.textContent="반려동물의 오늘을 기록하고, 평생을 함께";
                var desc=document.createElement("p");desc.className="pg2-desc";desc.textContent="성장 · 건강 · 일상 · 추억을 하나의 라이프 기록으로";if(tagline)tagline.insertAdjacentElement("afterend",desc);
                var pills=document.createElement("div");pills.className="pg2-pillrow";pills.innerHTML='<span class="pg2-pill"><i></i>PET LIFE</span><span class="pg2-pill"><i></i>CARE</span><span class="pg2-pill"><i></i>MEMORY</span>';desc.insertAdjacentElement("afterend",pills);
                progress.setAttribute("role","progressbar");progress.setAttribute("aria-valuemin","1");progress.setAttribute("aria-valuemax","100");
                var meta=document.createElement("div");meta.className="pg2-meta";meta.innerHTML='<div><small>LOADING PETGROW</small><b class="pg2-message">PetGrow를 준비하고 있어요</b></div><strong class="pg2-percent">1%</strong>';progress.insertAdjacentElement("afterend",meta);
                render();requestAnimationFrame(tick);
              }
              window.__petgrowSetSplashProgress=function(value){var v=Math.max(1,Math.min(100,Number(value)||1));state.externalTarget=Math.max(state.externalTarget,v);};
              window.__hidePetGrowSplash=function(){if(state.ready)return;state.ready=true;state.readyAt=performance.now();};
              window.__petgrowSplashV2State=state;
              if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
              window.setTimeout(mount,0);
            })();
          `
        }
      ];
    }
  };
}
