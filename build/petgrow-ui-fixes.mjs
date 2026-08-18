function replaceRequired(code, from, to, label) {
  if (!code.includes(from)) {
    throw new Error(`[petgrow-ui-fixes] missing required pattern: ${label}`);
  }
  return code.replace(from, to);
}

function replaceOptionalAll(code, from, to) {
  return code.includes(from) ? code.split(from).join(to) : code;
}

export default function petgrowUiFixes() {
  return {
    name: "petgrow-ui-fixes-20260818",
    enforce: "pre",
    transform(code, id) {
      const norm = String(id || "").replaceAll("\\", "/");

      if (norm.endsWith("/src/App.jsx")) {
        let out = code;

        out = replaceRequired(
          out,
          'return apiJson(`/api/community?action=posts&${params}`);',
          'return apiJson(`/api/community-safe?action=posts&${params}`);',
          "PetTalk list endpoint"
        );

        out = replaceOptionalAll(
          out,
          'fetch("/api/community?action=posts&category=all&sort=latest&page=1",',
          'fetch("/api/community-safe?action=posts&category=all&sort=latest&page=1",'
        );

        out = replaceRequired(
          out,
          '  const filtered=guides;\n  const active=guides.find(g=>g.key===activeKey)||guides[0];',
          '  const q=guideSearch.trim().toLowerCase();\n  const filtered=guides.filter(g=>!q||`${g.title} ${g.sub} ${g.intro} ${g.steps.join(" ")} ${g.faq} ${g.tip}`.toLowerCase().includes(q));\n  const active=guides.find(g=>g.key===activeKey)||guides[0];',
          "InfoGuide q/filter"
        );

        out = replaceOptionalAll(
          out,
          '{selected.image&&<img src={selected.image} alt=""/>}',
          '{(detail?.image||selected.image)&&<img src={detail?.image||selected.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>}'
        );

        out = replaceOptionalAll(
          out,
          '타로 30P · 오늘 운세 20P · 기본 사주 50P · 궁합 40P',
          '타로 5P · 오늘 운세 5P · 기본 사주 10P · 궁합 10P'
        );
        out = replaceOptionalAll(out,'<span><b>+30P</b> 하루 첫 접속</span>','<span><b>+50P</b> 하루 첫 접속</span>');

        out = replaceRequired(out,'function AccountActivityHub({lang}){','function AccountActivityHub({lang,onOpenPost}){','activity navigation prop');
        out = replaceRequired(
          out,
          'PetGrow 메뉴 이용·글·댓글·좋아요·신고·문의 등을 최근순으로 확인해요.',
          'Pet톡 글·댓글·좋아요와 Pet사주·Pet타로 이용 기록을 최근순으로 확인해요.',
          'activity helper copy'
        );
        out = replaceRequired(
          out,
          '<div className="my-activity-row" key={`${x.type}-${x.createdAt}-${i}`}>',
          '<div className={"my-activity-row"+(x.target?.view==="community"&&x.target?.postId?" is-link":"")} role={x.target?.view==="community"&&x.target?.postId?"button":undefined} tabIndex={x.target?.view==="community"&&x.target?.postId?0:undefined} onClick={()=>{if(x.target?.view==="community"&&x.target?.postId)onOpenPost?.(x.target.postId)}} onKeyDown={(e)=>{if((e.key==="Enter"||e.key===" ")&&x.target?.view==="community"&&x.target?.postId){e.preventDefault();onOpenPost?.(x.target.postId)}}} key={`${x.type}-${x.createdAt}-${i}`}>',
          'activity row link'
        );
        out = replaceRequired(out,'<AccountActivityHub lang={lang}/>','<AccountActivityHub lang={lang} onOpenPost={onOpenPost}/>','activity hub wiring');
        out = replaceOptionalAll(
          out,
          '아직 기록된 활동이 없어요. 앞으로 이용한 메뉴와 활동이 여기에 쌓여요.',
          '아직 기록된 활동이 없어요. 글·댓글·좋아요·Pet사주·Pet타로 이용 기록이 여기에 쌓여요.'
        );

        out = replaceRequired(
          out,
          'function PetPointAboutCard(){return <section className="bg-card petpoint-about"><span>🐾</span><div><small>COMMUNITY REWARD</small><h2>활동이 혜택이 되는 PetPoint</h2><p>Pet톡에서 이야기를 나누고 댓글을 남기며 포인트를 모아 Pet사주·운세 같은 재미 콘텐츠를 즐길 수 있어요. 유료 충전 없이 PetGrow 안의 건강한 참여를 보상하는 방식이에요.</p></div></section>}',
          'function PetPointAboutCard(){const [open,setOpen]=useState(false),[d,setD]=useState(null),[loading,setLoading]=useState(false);const show=()=>{setOpen(true);if(d||loading)return;setLoading(true);apiJson("/api/points?action=summary").then(setD).catch(()=>setD(null)).finally(()=>setLoading(false))};return <><button type="button" className="bg-card petpoint-about petpoint-about-button" onClick={show}><span>🐾</span><div><small>COMMUNITY REWARD</small><h2>활동이 혜택이 되는 PetPoint</h2><p>Pet톡 활동과 하루 첫 접속으로 포인트를 모아 Pet사주·운세·타로를 부담 없이 즐길 수 있어요. 눌러서 적립·차감 기준을 확인해보세요.</p></div><em>›</em></button>{open&&<div className="petpoint-about-backdrop" onClick={()=>setOpen(false)}><section className="bg-card petpoint-about-modal" onClick={e=>e.stopPropagation()}><button type="button" className="petpoint-about-close" onClick={()=>setOpen(false)}>×</button><small>PETPOINT GUIDE</small><h2>PetPoint 이용 안내</h2><p className="bg-sub">PetGrow 안에서 활동을 보상하고 재미 콘텐츠를 더 편하게 이용할 수 있도록 만든 무료 포인트예요. 현금 구매·환전·출금용 포인트가 아니에요.</p><div className="petpoint-about-balance"><span>현재 보유</span><b>{loading?"…":`${Number(d?.balance||0).toLocaleString()}P`}</b></div><h3>어떻게 모아요?</h3><div className="petpoint-about-list">{(d?.earnGuide||[{label:"Pet톡 글 작성",points:50,limit:"하루 5회"},{label:"Pet톡 댓글 작성",points:20,limit:"하루 5회"},{label:"좋아요 받기",points:5,limit:"하루 50회"},{label:"하루 첫 접속",points:50,limit:"하루 1회"}]).map((x,i)=><p key={i}><b>+{x.points}P</b><span>{x.label}</span><small>{x.limit}</small></p>)}</div><h3>어디에 사용해요?</h3><div className="petpoint-about-costs"><span>🌤️ 오늘 운세 <b>{d?.costs?.saju_daily||5}P</b></span><span>🔮 기본 사주 <b>{d?.costs?.saju_basic||10}P</b></span><span>🫶 보호자 궁합 <b>{d?.costs?.saju_compat||10}P</b></span><span>🃏 Pet타로 <b>{d?.costs?.tarot||5}P</b></span></div><p className="petpoint-about-note">첫 이용 시 1,000P가 지급되고, 매일 첫 로그인만으로 50P를 받을 수 있어 주요 재미 콘텐츠를 충분히 이용할 수 있어요.</p></section></div>}</>}',
          'PetPoint about modal'
        );

        out = replaceOptionalAll(
          out,
          'function PetNewsPrivacyAddendum(){return <section className="bg-card" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}>',
          'function PetNewsPrivacyAddendum(){return <section className="bg-card petnews-privacy-addendum" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}>'
        );

        const oldMenuGroups = `  const groups=[
    {label:lang==="en"?"PET LIFE":"반려생활",items:[{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon},{key:"music",label:lang==="en"?"Pet Music":"Pet음악",Icon:MusicIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":"Pet뉴스",Icon:InfoIcon},{key:"about",label:t.aboutNav,Icon:InfoIcon}]}
  ];`;
        const newMenuGroups = `  const groups=[
    {label:lang==="en"?"PET LIFE":lang==="ja"?"ペットライフ":lang==="zh"?"宠物生活":"반려생활",items:[{key:"about",label:t.aboutNav,Icon:InfoIcon},{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":lang==="ja"?"コミュニティ · コンテンツ":lang==="zh"?"社区 · 内容":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"music",label:lang==="en"?"Pet Music":lang==="ja"?"Pet音楽":lang==="zh"?"Pet音乐":"Pet음악",Icon:MusicIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":lang==="ja"?"Petタロット":lang==="zh"?"Pet塔罗":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":lang==="ja"?"情報 · サポート":lang==="zh"?"信息 · 支持":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":lang==="ja"?"Petニュース":lang==="zh"?"Pet新闻":"Pet뉴스",Icon:InfoIcon}]}
  ];`;
        out = replaceRequired(out, oldMenuGroups, newMenuGroups, "menu group order and locale");

        out = replaceRequired(
          out,
          '  const x=meta[view]; if(!x)return null;\n  return <section className="nearby-hero bg-card petgrow-unified-hero" style={{maxWidth:900,margin:\'0 auto 18px\'}}><div><span className="nearby-eyebrow">{x.eyebrow}</span><h1>{lang===\'en\'?x.en:x.ko}</h1><p>{lang===\'en\'?x.enDesc:x.koDesc}</p>',
          '  const x=meta[view]; if(!x)return null;\n  const localized={ja:{pets:["うちの子","ペットの基本情報、成長記録、写真、健康情報をまとめて管理できます。"],community:["Petトーク","日常や質問、ペットとの暮らしに役立つ情報を気軽に共有できます。"],tips:["Pet情報","健康・食事・生活・トレーニングに役立つ情報を確認できます。"],saju:["Pet四柱","生年月日をもとに楽しむPetGrowのエンタメコンテンツです。"],petbti:["PetBTI","行動に関する質問から、うちの子の個性を楽しく確認できます。"],guide:["情報ガイド","PetGrowの主な機能と使い方をまとめて確認できます。"],my:["マイページ","会員情報、活動履歴、お気に入りコンテンツを管理できます。"],more:["もっと見る","PetGrowの機能とサポートメニューを確認できます。"],support:["サポート","サービス利用に関する質問やお問い合わせを送れます。"],"ad-inquiry":["広告・提携のお問い合わせ","PetGrowとの広告・提携についてお問い合わせいただけます。"]},zh:{pets:["我的宠物","集中管理宠物基本资料、成长记录、照片和健康信息。"],community:["Pet聊天","轻松分享宠物日常、问题和养宠生活信息。"],tips:["Pet信息","查看健康、饮食、生活和训练等实用养宠信息。"],saju:["Pet四柱","根据宠物生日轻松体验PetGrow趣味内容。"],petbti:["PetBTI","通过行为问题了解宠物的个性与倾向。"],guide:["信息指南","快速查看PetGrow主要功能和使用方法。"],my:["我的页面","管理会员信息、活动记录和喜欢的内容。"],more:["更多","查看PetGrow其他功能和支持菜单。"],support:["客户支持","提交使用服务时的问题或需要帮助的内容。"],"ad-inquiry":["广告合作咨询","联系PetGrow洽谈广告与合作机会。"]}};\n  const pair=localized[lang]?.[view]; const heroTitle=lang===\'en\'?x.en:(pair?.[0]||x.ko); const heroDesc=lang===\'en\'?x.enDesc:(pair?.[1]||x.koDesc);\n  return <section className="nearby-hero bg-card petgrow-unified-hero" style={{maxWidth:900,margin:\'0 auto 18px\'}}><div><span className="nearby-eyebrow">{x.eyebrow}</span><h1>{heroTitle}</h1><p>{heroDesc}</p>',
          "unified hero ja zh locale"
        );

        out = replaceOptionalAll(
          out,
          '<h1>{lang==="en"?"Pet Music":"Pet음악"}</h1>',
          '<h1>{lang==="en"?"Pet Music":lang==="ja"?"Pet音楽":lang==="zh"?"Pet音乐":"Pet음악"}</h1>'
        );

        return out === code ? null : { code: out, map: null };
      }

      if (norm.endsWith("/src/PetDailyWidgets.jsx")) {
        let out = code;

        out = replaceRequired(
          out,
          '  return <div className="feature-module-shell pet-tarot-shell"><style>{`',
          '  return <div className="feature-module-shell pet-tarot-shell"><div className="pg-tarot-pet-identity"><span className="pg-tarot-pet-avatar">{(pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo) ? <img src={pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo} alt={petName} /> : <em>{String(pet?.profile?.species||pet?.species||pet?.profile?.type||pet?.type||"dog").toLowerCase().includes("cat")||String(pet?.profile?.species||pet?.species||"").includes("고양")?"🐱":"🐶"}</em>}</span><b className="pet-user-name">{petName}</b></div><style>{`',
          "PetTarot identity"
        );

        out = replaceRequired(
          out,
          'window.setTimeout(()=>setPhase("focus"),650);window.setTimeout(()=>setPhase("shuffle"),1300);window.setTimeout(()=>setPhase("choose"),2300);',
          'window.setTimeout(()=>setPhase("focus"),360);window.setTimeout(()=>setPhase("shuffle"),760);window.setTimeout(()=>setPhase("choose"),1380);',
          "PetTarot opening timing"
        );

        out = replaceRequired(
          out,
          'setPhase("reveal");window.setTimeout(()=>setPhase("result"),900)},500);',
          'setPhase("reveal");window.setTimeout(()=>setPhase("result"),420)},160);',
          "PetTarot reveal timing"
        );

        out = replaceOptionalAll(
          out,
          'PetPoint {result.pointCost||30}P 사용',
          'PetPoint {result.pointCost||5}P 사용'
        );

        out = replaceOptionalAll(out,'{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW 타로 · 메이저 아르카나 22장"}','{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":lang==="ja"?"PETGROW タロット · 大アルカナ22枚":lang==="zh"?"PETGROW 塔罗 · 22张大阿尔卡那":"PETGROW 타로 · 메이저 아르카나 22장"}');
        out = replaceOptionalAll(out,'{petName}{lang==="en"?"\'s Tarot":"의 Pet타로"}','{petName}{lang==="en"?"\'s Tarot":lang==="ja"?"のPetタロット":lang==="zh"?"的Pet塔罗":"의 Pet타로"}');
        out = replaceOptionalAll(out,'<b>카드를 뽑아주세요</b><small>오늘 마음이 가는 한 장을 천천히 골라볼게요.</small>','<b>{lang==="ja"?"カードを1枚選んでください":lang==="zh"?"请选择一张牌":"카드를 뽑아주세요"}</b><small>{lang==="ja"?"今日いちばん心ひかれるカードを選んでみましょう。":lang==="zh"?"慢慢选择今天最吸引你的一张牌。":"오늘 마음이 가는 한 장을 천천히 골라볼게요."}</small>');
        out = replaceOptionalAll(out,'<b>카드에 집중해 주세요</b><small>우리 아이를 떠올리며 잠시 카드에 마음을 모아보세요.</small>','<b>{lang==="ja"?"カードに集中してください":lang==="zh"?"请专注于卡牌":"카드에 집중해 주세요"}</b><small>{lang==="ja"?"うちの子を思い浮かべながら少しだけ集中してみましょう。":lang==="zh"?"想着你的宠物，静静集中片刻。":"우리 아이를 떠올리며 잠시 카드에 마음을 모아보세요."}</small>');
        out = replaceOptionalAll(out,'<b>카드를 섞고 있어요</b><small>오늘의 메시지를 담은 22장을 준비하는 중이에요.</small>','<b>{lang==="ja"?"カードをシャッフルしています":lang==="zh"?"正在洗牌":"카드를 섞고 있어요"}</b><small>{lang==="ja"?"今日のメッセージを込めた22枚を準備しています。":lang==="zh"?"正在准备承载今日信息的22张牌。":"오늘의 메시지를 담은 22장을 준비하는 중이에요."}</small>');
        out = replaceOptionalAll(out,'← 다른 주제 선택','{lang==="ja"?"← 別のテーマを選ぶ":lang==="zh"?"← 选择其他主题":"← 다른 주제 선택"}');
        out = replaceOptionalAll(out,'선택한 카드를 천천히 펼치는 중…','{lang==="ja"?"選んだカードを開いています…":lang==="zh"?"正在翻开你选择的牌…":"선택한 카드를 천천히 펼치는 중…"}');

        return out === code ? null : { code: out, map: null };
      }

      return null;
    }
  };
}
