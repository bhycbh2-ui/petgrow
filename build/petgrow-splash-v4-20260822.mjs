export default function petgrowSplashV4(){
  return {
    name:"petgrow-fixed-calm-splash-20260828",
    transformIndexHtml(){
      return [{
        tag:"style",
        attrs:{id:"petgrow-fixed-calm-splash-style"},
        injectTo:"head",
        children:`
          /* Apply from the first paint — no JS class handoff and no size-changing motion. */
          #petgrow-initial-splash{
            background:#f8faf7!important;
            color:#18382d!important;
            overflow:hidden!important;
          }
          #petgrow-initial-splash:before,
          #petgrow-initial-splash:after{
            display:none!important;
            content:none!important;
          }
          #petgrow-initial-splash .petgrow-runners,
          #petgrow-initial-splash .pg-signature-orbit,
          #petgrow-initial-splash .pg-paw-trail,
          #petgrow-initial-splash .pg-sprout{
            display:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__content{
            position:relative!important;
            z-index:2!important;
            width:min(82vw,300px)!important;
            max-width:300px!important;
            align-items:center!important;
            justify-content:center!important;
            text-align:center!important;
            transform:none!important;
            animation:pg-splash-fade .18s ease-out both!important;
          }
          #petgrow-initial-splash .petgrow-splash__logo-wrap{
            position:relative!important;
            width:108px!important;
            height:108px!important;
            aspect-ratio:1/1!important;
            margin:0 0 14px!important;
            padding:7px!important;
            box-sizing:border-box!important;
            border-radius:26px!important;
            overflow:visible!important;
            isolation:auto!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__logo-wrap:before,
          #petgrow-initial-splash .petgrow-splash__logo-wrap:after{
            display:none!important;
            content:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__logo{
            display:block!important;
            width:100%!important;
            height:100%!important;
            max-width:100%!important;
            max-height:100%!important;
            padding:0!important;
            border-radius:24%!important;
            object-fit:contain!important;
            object-position:center!important;
            filter:drop-shadow(0 6px 14px rgba(24,65,43,.09))!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__tagline{
            display:flex!important;
            flex-direction:column!important;
            align-items:center!important;
            gap:7px!important;
            margin:0!important;
            color:#718078!important;
            font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Segoe UI",Roboto,Arial,sans-serif!important;
            font-size:12px!important;
            font-weight:550!important;
            line-height:1.5!important;
            letter-spacing:-.02em!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__tagline:before{
            content:"PetGrow";
            display:block;
            color:#274b39;
            font-size:28px;
            font-weight:800;
            line-height:1.08;
            letter-spacing:-.045em;
          }
          #petgrow-initial-splash .petgrow-splash__progress{
            width:148px!important;
            height:3px!important;
            margin:22px auto 0!important;
            border:0!important;
            border-radius:999px!important;
            background:#e3ebe5!important;
            box-shadow:none!important;
            overflow:hidden!important;
          }
          #petgrow-initial-splash .petgrow-splash__progress-bar{
            height:100%!important;
            border-radius:999px!important;
            background:#4f8a5b!important;
            box-shadow:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__progress-bar:after{
            display:none!important;
            content:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__status{
            margin:9px 0 0!important;
            color:#8b9790!important;
            font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Segoe UI",Roboto,Arial,sans-serif!important;
            font-size:10.5px!important;
            font-weight:500!important;
            line-height:1.4!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__dots{display:none!important}
          .pg4-wordmark,.pg4-kicker{display:none!important}
          @keyframes pg-splash-fade{
            from{opacity:0}
            to{opacity:1}
          }
          @media(max-width:430px){
            #petgrow-initial-splash .petgrow-splash__logo-wrap{
              width:104px!important;
              height:104px!important;
            }
            #petgrow-initial-splash .petgrow-splash__tagline:before{font-size:27px}
          }
          @media(max-height:650px){
            #petgrow-initial-splash .petgrow-splash__logo-wrap{
              width:92px!important;
              height:92px!important;
              margin-bottom:11px!important;
            }
            #petgrow-initial-splash .petgrow-splash__tagline:before{font-size:25px}
            #petgrow-initial-splash .petgrow-splash__progress{margin-top:17px!important}
          }
          @media(prefers-reduced-motion:reduce){
            #petgrow-initial-splash .petgrow-splash__content{animation:none!important}
          }
        `
      }];
    }
  };
}
