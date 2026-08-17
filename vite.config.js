import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function petgrowFinalRuntimePatch() {
  return {
    name: "petgrow-final-runtime-patch-20260818",
    enforce: "pre",
    transform(code, id) {
      const isApp=id.endsWith("/src/App.jsx") || id.endsWith("\\src\\App.jsx");
      const isDaily=id.endsWith("/src/PetDailyWidgets.jsx") || id.endsWith("\\src\\PetDailyWidgets.jsx");
      if (!isApp && !isDaily) return null;
      let out = code;

      if (isDaily) {
        // Pet타로도 Pet사주/PetBTI처럼 선택된 반려동물 사진(또는 종 아이콘)+이름을 상단에 항상 표시.
        const tarotRoot='  return <div className="feature-module-shell pet-tarot-shell"><style>{`';
        if(out.includes(tarotRoot) && !out.includes('pg-tarot-pet-identity')){
          out=out.replace(tarotRoot,'  return <div className="feature-module-shell pet-tarot-shell"><div className="pg-tarot-pet-identity"><span className="pg-tarot-pet-avatar">{pet?.profile?.profileImage ? <img src={pet.profile.profileImage} alt="" /> : <em>{pet?.species==="cat"?"🐱":"🐶"}</em>}</span><b className="pet-user-name">{petName}</b></div><style>{`');
        }
        // 모바일/PC에서 기다리는 느낌을 줄이도록 안내→셔플→선택 전환과 결과 펼침 지연을 단축.
        out=out.replace('window.setTimeout(()=>setPhase("focus"),650);window.setTimeout(()=>setPhase("shuffle"),1300);window.setTimeout(()=>setPhase("choose"),2300);','window.setTimeout(()=>setPhase("focus"),360);window.setTimeout(()=>setPhase("shuffle"),760);window.setTimeout(()=>setPhase("choose"),1380);');
        out=out.replace('setPhase("reveal");window.setTimeout(()=>setPhase("result"),900)},500);','setPhase("reveal");window.setTimeout(()=>setPhase("result"),620)},160);');
        return out===code?null:{code:out,map:null};
      }

      // 정보가이드: 이전 정리 과정에서 q 선언이 빠져 렌더링 시 ReferenceError가 나던 문제 복구.
      out = out.replace(
        '  const filtered=guides;\n  const active=guides.find(g=>g.key===activeKey)||guides[0];',
        '  const q=guideSearch.trim().toLowerCase();\n  const filtered=guides.filter(g=>!q||`${g.title} ${g.sub} ${g.intro} ${g.steps.join(" ")} ${g.faq} ${g.tip}`.toLowerCase().includes(q));\n  const active=guides.find(g=>g.key===activeKey)||guides[0];'
      );

      // 마이페이지 활동내역에서 실제 기능 화면으로 이동할 수 있도록 앱 전역 내비게이션 이벤트 연결.
      const goViewNeedle = '  const goView = (v) => { const next=(v==="talk"||v==="pettalk"||v==="pet-talk")?"community":v; setView(next); if(account?.id)logPetActivity({section:next,action:"view",title:({home:"홈",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",news:"Pet뉴스",guide:"정보가이드",my:"마이페이지",support:"고객지원"}[next]||next)}); scrollToTop(); };';
      if (out.includes(goViewNeedle) && !out.includes('petgrow:navigate')) {
        out = out.replace(goViewNeedle, `${goViewNeedle}\n  useEffect(()=>{\n    const handlePetgrowNavigate=(e)=>{\n      const d=e?.detail||{};\n      if(!d.view)return;\n      goView(d.view);\n      if(d.postId){window.setTimeout(()=>window.dispatchEvent(new CustomEvent("petgrow:open-post",{detail:{id:d.postId}})),320);}\n    };\n    window.addEventListener("petgrow:navigate",handlePetgrowNavigate);\n    return()=>window.removeEventListener("petgrow:navigate",handlePetgrowNavigate);\n  },[account?.id]);`);
      }

      // Pet톡 내부에서 특정 게시글을 열 수 있는 이벤트 브리지.
      const openPostNeedle = '  const openPost = (id) => { setActivePostId(id); setSub("detail"); };';
      if (out.includes(openPostNeedle) && !out.includes('handlePetgrowOpenPost')) {
        out = out.replace(openPostNeedle, `${openPostNeedle}\n  useEffect(()=>{\n    const handlePetgrowOpenPost=(e)=>{const id=e?.detail?.id;if(id)openPost(id);};\n    window.addEventListener("petgrow:open-post",handlePetgrowOpenPost);\n    return()=>window.removeEventListener("petgrow:open-post",handlePetgrowOpenPost);\n  },[]);`);
      }

      // Pet톡 목록은 DB 장식 테이블 일부가 문제여도 기본 글 목록이 열리도록 안전 목록 API 사용.
      out = out.replace(
        'return apiJson(`/api/community?action=posts&${params}`);',
        'return apiJson(`/api/community-safe?action=posts&${params}`);'
      );
      out = out.replaceAll(
        'fetch("/api/community?action=posts&category=all&sort=latest&page=1",',
        'fetch("/api/community-safe?action=posts&category=all&sort=latest&page=1",'
      );

      // Pet뉴스 상세 API에서 새로 찾은 대표 이미지도 상세 화면에서 사용.
      out = out.replaceAll(
        '{selected.image&&<img src={selected.image} alt=""/>}',
        '{(detail?.image||selected.image)&&<img src={detail?.image||selected.image} alt=""/>}'
      );

      // 약관/개인정보 하단 부가 안내를 본문과 같은 하나의 문서 흐름으로 묶음.
      out = out.replaceAll(
        '<><PrivacyContent /><PetNewsPrivacyAddendum /><PetPointPolicyAddendum type="privacy" /></>',
        '<div className="legal-combined-page"><PrivacyContent /><div className="legal-addenda-inline"><PetNewsPrivacyAddendum /><PetPointPolicyAddendum type="privacy" /></div></div>'
      );
      out = out.replaceAll(
        '<><TermsContent /><PetNewsTermsAddendum /><PetPointPolicyAddendum type="terms" /></>',
        '<div className="legal-combined-page"><TermsContent /><div className="legal-addenda-inline"><PetNewsTermsAddendum /><PetPointPolicyAddendum type="terms" /></div></div>'
      );

      return out === code ? null : { code: out, map: null };
    }
  };
}

export default defineConfig({
  plugins: [petgrowFinalRuntimePatch(), react()],
  build: {
    // 큰 의존성을 별도 캐시 청크로 분리해 첫 재방문/메뉴 전환 시 다시 받는 양을 줄여요.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react-vendor";
          if (id.includes("node_modules/recharts")) return "charts-vendor";
          if (id.includes("node_modules/@capacitor")) return "capacitor-vendor";
          if (id.includes("node_modules/@vercel")) return "vercel-vendor";
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
});
