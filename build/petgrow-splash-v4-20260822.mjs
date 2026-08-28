export default function petgrowSplashV4(){
  return {
    name:"petgrow-cute-pets-splash-20260828",
    transformIndexHtml(){
      return [{
        tag:"style",
        attrs:{id:"petgrow-cute-pets-splash-style"},
        injectTo:"head",
        children:`
          #petgrow-initial-splash{
            background:
              radial-gradient(circle at 50% 38%, rgba(226,242,229,.9) 0%, rgba(247,250,246,.25) 34%, rgba(248,250,247,0) 60%),
              linear-gradient(180deg,#fbfdf9 0%,#f5f9f4 100%)!important;
            color:#20372b!important;
            overflow:hidden!important;
          }
          #petgrow-initial-splash:before,
          #petgrow-initial-splash:after{
            display:block!important;
            content:""!important;
            position:absolute!important;
            pointer-events:none!important;
            border-radius:999px!important;
            filter:none!important;
          }
          #petgrow-initial-splash:before{
            width:210px!important;height:210px!important;
            left:-90px!important;top:-70px!important;bottom:auto!important;
            background:rgba(219,237,222,.42)!important;
            transform:none!important;
          }
          #petgrow-initial-splash:after{
            width:250px!important;height:250px!important;
            right:-120px!important;bottom:-110px!important;
            background:rgba(232,241,231,.7)!important;
            transform:none!important;
          }

          /* 기존 로고는 숨기고, HTML에 이미 있는 강아지/고양이 캐릭터를 주인공으로 사용합니다. */
          #petgrow-initial-splash .petgrow-splash__logo-wrap{display:none!important}
          #petgrow-initial-splash .petgrow-splash__logo{display:none!important}
          #petgrow-initial-splash .pg-signature-orbit,
          #petgrow-initial-splash .pg-paw-trail,
          #petgrow-initial-splash .pg-sprout{display:none!important}

          #petgrow-initial-splash .petgrow-runners{
            display:block!important;
            position:absolute!important;
            left:0!important;right:0!important;
            top:50%!important;bottom:auto!important;
            height:110px!important;
            overflow:visible!important;
            pointer-events:none!important;
            z-index:3!important;
            transform:translateY(-112px)!important;
          }
          #petgrow-initial-splash .petgrow-runners:after{
            content:""!important;
            position:absolute!important;
            left:50%!important;right:auto!important;
            bottom:8px!important;
            width:176px!important;height:2px!important;
            border-radius:999px!important;
            background:linear-gradient(90deg,transparent,rgba(91,142,99,.18),transparent)!important;
            transform:translateX(-50%)!important;
          }
          #petgrow-initial-splash .petgrow-runners:before{
            content:"♡"!important;
            position:absolute!important;
            left:50%!important;top:-5px!important;
            color:#3f9557!important;
            font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
            font-size:27px!important;
            font-weight:800!important;
            line-height:1!important;
            opacity:0;
            transform:translate(-50%,10px) rotate(-8deg)!important;
            animation:pg-cute-heart .62s ease-out .52s both!important;
          }
          #petgrow-initial-splash .petgrow-runner{
            position:absolute!important;
            right:auto!important;
            bottom:10px!important;
            width:78px!important;
            height:66px!important;
            filter:drop-shadow(0 7px 8px rgba(38,67,47,.10))!important;
            will-change:transform,opacity!important;
          }
          #petgrow-initial-splash .petgrow-runner--dog{
            left:calc(50% - 84px)!important;
            animation:pg-cute-dog-in .82s cubic-bezier(.22,.8,.28,1) both!important;
          }
          #petgrow-initial-splash .petgrow-runner--cat{
            left:calc(50% + 7px)!important;
            animation:pg-cute-cat-in .82s cubic-bezier(.22,.8,.28,1) .08s both!important;
          }
          #petgrow-initial-splash .petgrow-runner__body{
            animation:pg-cute-bob .34s ease-in-out .70s 2 alternate!important;
            transform-origin:50% 65%!important;
          }
          #petgrow-initial-splash .petgrow-leg--front,
          #petgrow-initial-splash .petgrow-leg--back{animation:none!important;transform:none!important}
          #petgrow-initial-splash .petgrow-tail{
            animation:pg-cute-tail .22s ease-in-out .58s 3 alternate!important;
          }
          #petgrow-initial-splash .petgrow-speedline{display:none!important;animation:none!important}

          #petgrow-initial-splash .petgrow-splash__content{
            position:relative!important;
            z-index:4!important;
            width:min(86vw,330px)!important;
            max-width:330px!important;
            align-items:center!important;
            justify-content:center!important;
            text-align:center!important;
            transform:translateY(68px)!important;
            animation:pg-copy-fade .35s ease-out .35s both!important;
          }
          #petgrow-initial-splash .petgrow-splash__tagline{
            display:block!important;
            margin:0!important;
            color:#748078!important;
            font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Segoe UI",Roboto,Arial,sans-serif!important;
            font-size:0!important;
            line-height:1.5!important;
            text-align:center!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__tagline:before{
            content:"오늘도 같이 자라요";
            display:block!important;
            color:#244a36!important;
            font-size:25px!important;
            font-weight:850!important;
            line-height:1.2!important;
            letter-spacing:-.045em!important;
          }
          #petgrow-initial-splash .petgrow-splash__tagline:after{
            content:"우리 아이와 보내는 하루를 준비 중이에요";
            display:block!important;
            margin-top:7px!important;
            color:#7c8981!important;
            font-size:12px!important;
            font-weight:550!important;
            line-height:1.5!important;
            letter-spacing:-.02em!important;
          }
          #petgrow-initial-splash .petgrow-splash__progress{
            width:132px!important;
            height:4px!important;
            margin:20px auto 0!important;
            border:0!important;
            border-radius:999px!important;
            background:#dfe9e1!important;
            box-shadow:none!important;
            overflow:hidden!important;
          }
          #petgrow-initial-splash .petgrow-splash__progress-bar{
            height:100%!important;
            border-radius:999px!important;
            background:linear-gradient(90deg,#7cb987 0%,#3f8e54 100%)!important;
            box-shadow:none!important;
            animation:pg-cute-progress 1.02s cubic-bezier(.22,.72,.25,1) forwards!important;
          }
          #petgrow-initial-splash .petgrow-splash__progress-bar:after{display:none!important;content:none!important}
          #petgrow-initial-splash .petgrow-splash__status{
            margin:9px 0 0!important;
            color:#8b9790!important;
            font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Segoe UI",Roboto,Arial,sans-serif!important;
            font-size:0!important;
            font-weight:550!important;
            line-height:1.4!important;
            animation:none!important;
            transform:none!important;
          }
          #petgrow-initial-splash .petgrow-splash__status:before{
            content:"발자국 따라 준비 중…";
            font-size:10.5px!important;
          }
          #petgrow-initial-splash .petgrow-splash__dots{display:none!important}
          .pg4-wordmark,.pg4-kicker{display:none!important}

          @keyframes pg-cute-dog-in{
            0%{opacity:0;transform:translate3d(-24px,7px,0) rotate(-4deg)}
            58%{opacity:1;transform:translate3d(3px,-4px,0) rotate(2deg)}
            100%{opacity:1;transform:translate3d(0,0,0) rotate(0)}
          }
          @keyframes pg-cute-cat-in{
            0%{opacity:0;transform:translate3d(24px,7px,0) rotate(4deg)}
            58%{opacity:1;transform:translate3d(-3px,-4px,0) rotate(-2deg)}
            100%{opacity:1;transform:translate3d(0,0,0) rotate(0)}
          }
          @keyframes pg-cute-bob{
            from{transform:translateY(0)}
            to{transform:translateY(-3px)}
          }
          @keyframes pg-cute-tail{
            from{transform:rotate(-10deg)}
            to{transform:rotate(17deg)}
          }
          @keyframes pg-cute-heart{
            0%{opacity:0;transform:translate(-50%,10px) rotate(-8deg)}
            65%{opacity:1;transform:translate(-50%,-4px) rotate(4deg)}
            100%{opacity:1;transform:translate(-50%,-8px) rotate(0)}
          }
          @keyframes pg-copy-fade{
            from{opacity:0;transform:translateY(74px)}
            to{opacity:1;transform:translateY(68px)}
          }
          @keyframes pg-cute-progress{
            0%{width:10%}
            42%{width:52%}
            100%{width:94%}
          }

          @media(max-width:430px){
            #petgrow-initial-splash .petgrow-runners{transform:translateY(-108px)!important}
            #petgrow-initial-splash .petgrow-runner{width:74px!important;height:63px!important}
            #petgrow-initial-splash .petgrow-runner--dog{left:calc(50% - 80px)!important}
            #petgrow-initial-splash .petgrow-runner--cat{left:calc(50% + 6px)!important}
            #petgrow-initial-splash .petgrow-splash__tagline:before{font-size:24px!important}
          }
          @media(max-height:650px){
            #petgrow-initial-splash .petgrow-runners{transform:translateY(-92px)!important}
            #petgrow-initial-splash .petgrow-splash__content{transform:translateY(62px)!important}
            #petgrow-initial-splash .petgrow-splash__tagline:before{font-size:22px!important}
            #petgrow-initial-splash .petgrow-splash__progress{margin-top:15px!important}
          }
          @media(prefers-reduced-motion:reduce){
            #petgrow-initial-splash .petgrow-runner--dog,
            #petgrow-initial-splash .petgrow-runner--cat,
            #petgrow-initial-splash .petgrow-runner__body,
            #petgrow-initial-splash .petgrow-tail,
            #petgrow-initial-splash .petgrow-runners:before,
            #petgrow-initial-splash .petgrow-splash__content,
            #petgrow-initial-splash .petgrow-splash__progress-bar{animation:none!important}
            #petgrow-initial-splash .petgrow-runner{opacity:1!important;transform:none!important}
            #petgrow-initial-splash .petgrow-runners:before{opacity:1!important;transform:translate(-50%,-8px)!important}
            #petgrow-initial-splash .petgrow-splash__progress-bar{width:94%!important}
          }
        `
      }];
    }
  };
}
