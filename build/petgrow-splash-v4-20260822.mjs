export default function petgrowSplashV4(){
  return {
    name:"petgrow-growth-system-splash-20260904",
    transformIndexHtml(){
      return [{
        tag:"style",
        attrs:{id:"petgrow-growth-system-splash-style"},
        injectTo:"head",
        children:`
          #petgrow-initial-splash{
            background:radial-gradient(circle at 50% 40%,rgba(44,113,80,.08),transparent 31%),linear-gradient(145deg,#f9fcfa 0%,#eef6f1 100%)!important;
            color:#173e31!important;overflow:hidden!important;
          }
          #petgrow-initial-splash:before{
            content:""!important;display:block!important;position:absolute!important;inset:0!important;pointer-events:none!important;
            border-radius:0!important;filter:none!important;transform:none!important;
            background-image:linear-gradient(rgba(27,83,60,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(27,83,60,.035) 1px,transparent 1px)!important;
            background-size:40px 40px!important;mask-image:radial-gradient(circle at 50% 42%,#000,transparent 72%)!important;
          }
          #petgrow-initial-splash:after{display:none!important}
          #petgrow-initial-splash .petgrow-runners,#petgrow-initial-splash .petgrow-splash__logo-wrap,#petgrow-initial-splash .petgrow-splash__logo,
          #petgrow-initial-splash .pg-signature-orbit,#petgrow-initial-splash .pg-paw-trail,#petgrow-initial-splash .pg-sprout,
          #petgrow-initial-splash .petgrow-splash__dots,.pg4-wordmark,.pg4-kicker{display:none!important}

          #petgrow-initial-splash .pg-growth-system{position:absolute!important;left:50%!important;top:50%!important;width:286px!important;height:286px!important;transform:translate(-50%,-62%)!important;z-index:3!important}
          #petgrow-initial-splash .pg-growth-grid{position:absolute!important;inset:28px!important;border-radius:50%!important;background:radial-gradient(circle,rgba(36,105,75,.07) 1px,transparent 1.5px)!important;background-size:14px 14px!important;mask-image:radial-gradient(circle,#000 0 42%,transparent 73%)!important}
          #petgrow-initial-splash .pg-growth-orbit{position:absolute!important;border-radius:50%!important;pointer-events:none!important;border:1px solid rgba(35,106,77,.2)!important}
          #petgrow-initial-splash .pg-growth-orbit:after{content:""!important;position:absolute!important;width:8px!important;height:8px!important;border-radius:50%!important;background:#2d7957!important;box-shadow:0 0 0 6px rgba(45,121,87,.09)!important}
          #petgrow-initial-splash .pg-growth-orbit--outer{inset:7px!important;animation:pgGrowthRotate 8s linear infinite!important}
          #petgrow-initial-splash .pg-growth-orbit--outer:after{right:33px!important;top:26px!important}
          #petgrow-initial-splash .pg-growth-orbit--inner{inset:44px!important;border-style:dashed!important;animation:pgGrowthRotateReverse 11s linear infinite!important}
          #petgrow-initial-splash .pg-growth-orbit--inner:after{left:20px!important;bottom:19px!important;background:#c5a454!important}

          #petgrow-initial-splash .pg-growth-core{position:absolute!important;left:50%!important;top:50%!important;width:116px!important;height:116px!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;color:#f7fbf8!important;background:linear-gradient(145deg,#245f46,#173e31)!important;border:1px solid rgba(255,255,255,.24)!important;box-shadow:0 22px 50px rgba(21,66,47,.22),inset 0 0 0 8px rgba(255,255,255,.035)!important;animation:pgGrowthCoreIn .66s cubic-bezier(.2,.8,.2,1) both!important}
          #petgrow-initial-splash .pg-growth-paw{position:relative!important;width:25px!important;height:20px!important;margin-bottom:7px!important;color:#d8bd76!important;font-size:0!important}
          #petgrow-initial-splash .pg-growth-paw:before{content:""!important;position:absolute!important;left:7px!important;bottom:0!important;width:13px!important;height:11px!important;border-radius:8px 8px 6px 6px!important;background:currentColor!important;box-shadow:-8px -8px 0 -3px currentColor,-1px -11px 0 -3px currentColor,7px -9px 0 -3px currentColor!important}
          #petgrow-initial-splash .pg-growth-core b{font:850 18px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;letter-spacing:-.04em!important}
          #petgrow-initial-splash .pg-growth-core small{margin-top:7px!important;color:#bdd8c9!important;font:750 7px/1 sans-serif!important;letter-spacing:.17em!important}

          #petgrow-initial-splash .pg-growth-node{position:absolute!important;z-index:4!important;display:flex!important;align-items:center!important;gap:6px!important;padding:7px 9px!important;border-radius:9px!important;background:rgba(255,255,255,.9)!important;border:1px solid rgba(35,106,77,.14)!important;box-shadow:0 8px 22px rgba(24,67,48,.08)!important;color:#687c71!important;font:750 7px/1 sans-serif!important;letter-spacing:.11em!important;opacity:0;animation:pgGrowthNodeIn .38s ease-out both!important}
          #petgrow-initial-splash .pg-growth-node b{color:#236a4d!important;font-size:9px!important}
          #petgrow-initial-splash .pg-growth-node--record{left:-8px!important;top:55px!important;animation-delay:.22s!important}
          #petgrow-initial-splash .pg-growth-node--insight{right:-12px!important;top:70px!important;animation-delay:.39s!important}
          #petgrow-initial-splash .pg-growth-node--care{right:4px!important;bottom:30px!important;animation-delay:.56s!important}

          #petgrow-initial-splash .pg-growth-chart{position:absolute!important;inset:68px 13px auto!important;width:260px!important;height:150px!important;overflow:visible!important}
          #petgrow-initial-splash .pg-growth-chart__guide{stroke:rgba(35,106,77,.11)!important;stroke-width:2!important;stroke-dasharray:4 6!important}
          #petgrow-initial-splash .pg-growth-chart__line{stroke:#4c9a70!important;stroke-width:2.5!important;stroke-linecap:round!important;stroke-dasharray:300!important;stroke-dashoffset:300;animation:pgGrowthChart 1s ease-out .18s forwards!important}
          #petgrow-initial-splash .pg-growth-chart circle{fill:#fff!important;stroke:#2d7957!important;stroke-width:2!important;opacity:0;animation:pgGrowthDot .3s ease-out .72s forwards!important}
          #petgrow-initial-splash .pg-growth-chart circle:last-child{fill:#d8bd76!important;stroke:#8f7336!important}

          #petgrow-initial-splash .petgrow-splash__content{position:relative!important;z-index:5!important;width:min(88vw,360px)!important;max-width:360px!important;align-items:center!important;text-align:center!important;transform:translateY(137px)!important;animation:pgGrowthCopy .42s ease-out .32s both!important}
          #petgrow-initial-splash .petgrow-splash__tagline{margin:0!important;font-size:0!important;line-height:1.45!important;animation:none!important;transform:none!important}
          #petgrow-initial-splash .petgrow-splash__tagline:before{content:"기록에서 성장까지";display:block!important;color:#173e31!important;font:850 25px/1.2 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif!important;letter-spacing:-.055em!important}
          #petgrow-initial-splash .petgrow-splash__tagline:after{content:"우리 아이의 하루를 이해하는 PetGrow";display:block!important;margin-top:7px!important;color:#708078!important;font:600 11.5px/1.5 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif!important;letter-spacing:-.02em!important}
          #petgrow-initial-splash .petgrow-splash__progress{width:162px!important;height:3px!important;margin:19px auto 0!important;border:0!important;border-radius:999px!important;background:rgba(35,106,77,.12)!important;box-shadow:none!important;overflow:hidden!important}
          #petgrow-initial-splash .petgrow-splash__progress-bar{height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,#236a4d,#7abb95,#c9aa5e)!important;box-shadow:none!important;animation:pgGrowthProgress 1.04s cubic-bezier(.2,.75,.2,1) forwards!important}
          #petgrow-initial-splash .petgrow-splash__progress-bar:after{display:none!important}
          #petgrow-initial-splash .petgrow-splash__status{margin:8px 0 0!important;color:#849188!important;font-size:0!important;animation:none!important;transform:none!important}
          #petgrow-initial-splash .petgrow-splash__status:before{content:"PET DATA SYNC";font:750 8px/1 sans-serif!important;letter-spacing:.16em!important}

          @keyframes pgGrowthRotate{to{transform:rotate(360deg)}}
          @keyframes pgGrowthRotateReverse{to{transform:rotate(-360deg)}}
          @keyframes pgGrowthCoreIn{from{opacity:0;transform:translate(-50%,-50%) scale(.8)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          @keyframes pgGrowthNodeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
          @keyframes pgGrowthChart{to{stroke-dashoffset:0}}
          @keyframes pgGrowthDot{to{opacity:1}}
          @keyframes pgGrowthCopy{from{opacity:0;transform:translateY(145px)}to{opacity:1;transform:translateY(137px)}}
          @keyframes pgGrowthProgress{0%{width:8%}46%{width:58%}100%{width:94%}}
          @media(max-height:650px){#petgrow-initial-splash .pg-growth-system{transform:translate(-50%,-65%) scale(.86)!important}#petgrow-initial-splash .petgrow-splash__content{transform:translateY(124px)!important}#petgrow-initial-splash .petgrow-splash__tagline:before{font-size:22px!important}}
          @media(prefers-reduced-motion:reduce){
            #petgrow-initial-splash .pg-growth-orbit,#petgrow-initial-splash .pg-growth-core,#petgrow-initial-splash .pg-growth-node,#petgrow-initial-splash .pg-growth-chart__line,#petgrow-initial-splash .pg-growth-chart circle,#petgrow-initial-splash .petgrow-splash__content,#petgrow-initial-splash .petgrow-splash__progress-bar{animation:none!important}
            #petgrow-initial-splash .pg-growth-node,#petgrow-initial-splash .pg-growth-chart circle{opacity:1!important}
            #petgrow-initial-splash .pg-growth-chart__line{stroke-dashoffset:0!important}
            #petgrow-initial-splash .petgrow-splash__progress-bar{width:94%!important}
          }
        `
      }];
    }
  };
}
