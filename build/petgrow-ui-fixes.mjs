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
          '{(detail?.image||selected.image)&&<img src={detail?.image||selected.image} alt=""/>}'
        );

        return out === code ? null : { code: out, map: null };
      }

      if (norm.endsWith("/src/PetDailyWidgets.jsx")) {
        let out = code;

        out = replaceRequired(
          out,
          '  return <div className="feature-module-shell pet-tarot-shell"><style>{`',
          '  return <div className="feature-module-shell pet-tarot-shell"><div className="pg-tarot-pet-identity"><span className="pg-tarot-pet-avatar">{pet?.profile?.profileImage ? <img src={pet.profile.profileImage} alt="" /> : <em>{pet?.species==="cat"?"🐱":"🐶"}</em>}</span><b className="pet-user-name">{petName}</b></div><style>{`',
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
          'setPhase("reveal");window.setTimeout(()=>setPhase("result"),620)},160);',
          "PetTarot reveal timing"
        );

        return out === code ? null : { code: out, map: null };
      }

      return null;
    }
  };
}
