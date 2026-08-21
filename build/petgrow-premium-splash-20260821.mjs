export default function petgrowPremiumSplash() {
  return {
    name: "petgrow-premium-splash",
    transformIndexHtml() {
      return [
        {
          tag: "style",
          attrs: { id: "petgrow-premium-splash-style" },
          children: `
            #petgrow-initial-splash{
              background:
                radial-gradient(circle at 18% 15%,rgba(117,157,130,.18),transparent 31%),
                radial-gradient(circle at 86% 84%,rgba(197,218,201,.34),transparent 34%),
                linear-gradient(145deg,#f5f8f4 0%,#fbfcfa 48%,#eef4ef 100%)!important;
              padding:max(22px,env(safe-area-inset-top)) 20px max(22px,env(safe-area-inset-bottom))!important;
              transition:opacity 220ms ease,visibility 220ms ease!important;
            }
            #petgrow-initial-splash:before{
              content:""!important;position:absolute!important;inset:-28%!important;width:auto!important;height:auto!important;
              border-radius:50%!important;background:conic-gradient(from 210deg,transparent,rgba(45,91,69,.055),transparent 38%,rgba(45,91,69,.035),transparent 72%)!important;
              animation:pg-premium-orbit 18s linear infinite!important;transform:none!important;left:auto!important;bottom:auto!important;
            }
            #petgrow-initial-splash:after{
              content:""!important;position:absolute!important;left:50%!important;bottom:-18vh!important;width:min(760px,115vw)!important;height:42vh!important;
              border-radius:50% 50% 0 0!important;transform:translateX(-50%)!important;
              background:linear-gradient(180deg,rgba(214,229,217,.3),rgba(238,245,239,.72))!important;
              filter:blur(1px);pointer-events:none;
            }
            .petgrow-runners,.petgrow-splash__dots{display:none!important}
            .petgrow-splash__content{
              width:min(86vw,382px)!important;box-sizing:border-box!important;transform:translateY(-1.5vh)!important;
              padding:34px 28px 26px!important;border-radius:30px!important;
              border:1px solid rgba(255,255,255,.9)!important;
              background:linear-gradient(155deg,rgba(255,255,255,.88),rgba(248,251,248,.68))!important;
              box-shadow:0 28px 80px rgba(35,64,49,.13),inset 0 1px 0 rgba(255,255,255,.92)!important;
              backdrop-filter:blur(22px) saturate(1.1);-webkit-backdrop-filter:blur(22px) saturate(1.1);
            }
            .pg-premium-kicker{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:10px;font-weight:850;letter-spacing:.24em;color:#6f897b;margin:0 0 17px;text-transform:uppercase}
            .petgrow-splash__logo-wrap{
              position:relative;width:126px!important;aspect-ratio:1/1!important;border-radius:38px!important;
              background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(238,245,239,.82))!important;
              border:1px solid rgba(72,111,88,.12);box-shadow:0 18px 45px rgba(40,76,57,.12),inset 0 1px 0 #fff;
              animation:pg-premium-logo-in .72s cubic-bezier(.2,.78,.2,1) both!important;
            }
            .petgrow-splash__logo-wrap:before{content:"";position:absolute;inset:-11px;border-radius:45px;border:1px solid rgba(69,109,85,.08);animation:pg-premium-pulse 2.3s ease-in-out infinite}
            .petgrow-splash__logo{width:88%!important;height:88%!important;filter:drop-shadow(0 7px 16px rgba(37,68,52,.08))!important}
            .petgrow-splash__tagline{margin:22px 0 0!important;color:#263c31!important;font-size:17px!important;font-weight:780!important;line-height:1.45!important;letter-spacing:-.045em!important}
            .pg-premium-subtag{margin:7px 0 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;color:#86978e;font-size:10px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}
            .petgrow-splash__progress{width:100%!important;height:7px!important;margin-top:30px!important;background:rgba(44,73,57,.08)!important;border:1px solid rgba(44,73,57,.045);box-shadow:inset 0 1px 3px rgba(28,54,40,.05)!important}
            .petgrow-splash__progress-bar{width:1%!important;animation:none!important;background:linear-gradient(90deg,#173d2e 0%,#3f7459 55%,#79a487 100%)!important;box-shadow:0 0 14px rgba(72,125,92,.28);transition:width 90ms linear!important}
            .pg-premium-meta{width:100%;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:13px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif}
            .pg-premium-meta>div{min-width:0;text-align:left}.pg-premium-meta small{display:block;color:#829088;font-size:10px;font-weight:650;line-height:1.4;margin-bottom:2px}.pg-premium-meta b{display:block;color:#42554b;font-size:12px;font-weight:760;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .pg-premium-percent{flex:0 0 auto;color:#214a36;font-size:26px;font-weight:860;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.055em}
            .petgrow-splash__status{display:none!important}
            .pg-premium-foot{margin:25px 0 0;color:#9aa69f;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:9px;font-weight:700;letter-spacing:.11em;text-transform:uppercase}
            @keyframes pg-premium-logo-in{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes pg-premium-pulse{0%,100%{opacity:.45;transform:scale(.98)}50%{opacity:1;transform:scale(1.025)}}
            @keyframes pg-premium-orbit{to{transform:rotate(360deg)}}
            @media(max-width:430px){
              .petgrow-splash__content{width:min(88vw,354px)!important;padding:31px 23px 23px!important;border-radius:27px!important}
              .petgrow-splash__logo-wrap{width:116px!important;border-radius:34px!important}.petgrow-splash__logo-wrap:before{border-radius:41px}
              .petgrow-splash__tagline{font-size:16px!important}.petgrow-splash__progress{margin-top:27px!important}.pg-premium-percent{font-size:24px}
            }
            @media(orientation:landscape) and (max-height:600px){
              .petgrow-splash__content{width:min(520px,76vw)!important;padding:18px 25px!important;display:grid!important;grid-template-columns:auto 1fr!important;grid-template-rows:auto auto auto auto!important;column-gap:24px!important;text-align:left!important}
              .pg-premium-kicker{grid-column:1/-1;margin-bottom:8px}.petgrow-splash__logo-wrap{grid-row:2/5;width:92px!important}.petgrow-splash__tagline{grid-column:2;margin:2px 0 0!important;text-align:left!important}.pg-premium-subtag{grid-column:2}.petgrow-splash__progress{grid-column:2;margin-top:14px!important}.pg-premium-meta{grid-column:2}.pg-premium-foot{display:none}
            }
            @media(prefers-reduced-motion:reduce){#petgrow-initial-splash:before,.petgrow-splash__logo-wrap:before{animation:none!important}}
          `,
          injectTo: "head",
        },
        {
          tag: "script",
          attrs: { id: "petgrow-premium-splash-script" },
          children: `
            (function(){
              var progress=1, timer=null, finished=false, mounted=false;
              function clamp(v){return Math.max(1,Math.min(100,Math.round(v)));}
              function setProgress(v){
                progress=clamp(v);
                var splash=document.getElementById('petgrow-initial-splash');
                if(!splash)return;
                var bar=splash.querySelector('.petgrow-splash__progress-bar');
                var pct=splash.querySelector('.pg-premium-percent');
                var message=splash.querySelector('.pg-premium-message');
                if(bar){bar.style.setProperty('width',progress+'%','important');bar.setAttribute('aria-valuenow',String(progress));}
                if(pct)pct.textContent=progress+'%';
                if(message){
                  message.textContent=progress<28?'PetGrow를 준비하고 있어요':progress<62?'우리 아이 정보를 연결하고 있어요':progress<90?'화면을 빠르게 정리하고 있어요':progress<100?'거의 다 준비됐어요':'준비가 완료됐어요';
                }
              }
              function mount(){
                if(mounted)return;
                var splash=document.getElementById('petgrow-initial-splash');
                if(!splash)return;
                var content=splash.querySelector('.petgrow-splash__content');
                var logo=splash.querySelector('.petgrow-splash__logo-wrap');
                var tagline=splash.querySelector('.petgrow-splash__tagline');
                var progressEl=splash.querySelector('.petgrow-splash__progress');
                if(!content||!logo||!progressEl)return;
                mounted=true;
                var kicker=document.createElement('p');kicker.className='pg-premium-kicker';kicker.textContent='PETGROW · PET LIFE';content.insertBefore(kicker,logo);
                if(tagline)tagline.textContent='우리 아이의 오늘부터 평생까지';
                var sub=document.createElement('p');sub.className='pg-premium-subtag';sub.textContent='CARE · GROWTH · MEMORY';progressEl.parentNode.insertBefore(sub,progressEl);
                progressEl.setAttribute('role','progressbar');progressEl.setAttribute('aria-valuemin','1');progressEl.setAttribute('aria-valuemax','100');
                var meta=document.createElement('div');meta.className='pg-premium-meta';meta.innerHTML='<div><small>LOADING PETGROW</small><b class="pg-premium-message">PetGrow를 준비하고 있어요</b></div><strong class="pg-premium-percent">1%</strong>';
                progressEl.insertAdjacentElement('afterend',meta);
                var foot=document.createElement('p');foot.className='pg-premium-foot';foot.textContent='A BETTER LIFE WITH YOUR PET';content.appendChild(foot);
                setProgress(1);
                timer=window.setInterval(function(){
                  if(finished||progress>=94)return;
                  var step=progress<30?2:progress<68?1.5:progress<86?1:0.45;
                  setProgress(Math.min(94,progress+step));
                },48);
              }
              function finish(){
                if(finished)return;finished=true;if(timer)window.clearInterval(timer);
                var start=progress, began=performance.now(), duration=170;
                function frame(now){
                  var t=Math.min(1,(now-began)/duration);var eased=1-Math.pow(1-t,3);setProgress(start+(100-start)*eased);
                  if(t<1){requestAnimationFrame(frame);return;}
                  setProgress(100);
                  window.setTimeout(function(){
                    var splash=document.getElementById('petgrow-initial-splash');if(!splash)return;
                    splash.classList.add('petgrow-splash--hide');
                    window.setTimeout(function(){if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);},240);
                  },75);
                }
                requestAnimationFrame(frame);
              }
              window.__hidePetGrowSplash=finish;
              window.__petgrowSetSplashProgress=setProgress;
              if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
              window.setTimeout(mount,0);
            })();
          `,
          injectTo: "head",
        },
      ];
    },
  };
}
