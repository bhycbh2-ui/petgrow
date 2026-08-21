const BRAND_ASSET = "/petgrow-brand-source.png?v=20260822";

const PETGROW_MENU_LABELS_SOURCE = `const PETGROW_MENU_LABELS = {
  ko: {
    myPetsNav: "펫라이프",
    communityNav: "커뮤니티",
    sajuNav: "펫운세",
    petBtiNav: "펫성향",
    tipsTitle: "펫가이드",
    nearbyNav: "펫플레이스",
    nearbyTitle: "펫플레이스",
    myPageTitle: "내 정보",
  },
  en: {
    myPetsNav: "PetLife",
    communityNav: "Community",
    sajuNav: "Pet Fortune",
    petBtiNav: "Pet Personality",
    tipsTitle: "Pet Guide",
    nearbyNav: "Pet Places",
    nearbyTitle: "Pet Places",
    myPageTitle: "My Profile",
  },
  ja: {
    myPetsNav: "PetLife",
    communityNav: "コミュニティ",
    sajuNav: "Pet運勢",
    petBtiNav: "Pet性格",
    tipsTitle: "Petガイド",
    nearbyNav: "Petスポット",
    nearbyTitle: "Petスポット",
    myPageTitle: "マイページ",
  },
  zh: {
    myPetsNav: "Pet生活",
    communityNav: "社区",
    sajuNav: "Pet运势",
    petBtiNav: "Pet性格",
    tipsTitle: "Pet指南",
    nearbyNav: "Pet地点",
    nearbyTitle: "Pet地点",
    myPageTitle: "我的资料",
  },
};`;

export default function petgrowBrandRefresh20260822() {
  return {
    name: "petgrow-brand-refresh-20260822",
    enforce: "pre",
    transform(code, id) {
      const cleanId = String(id || "").replace(/\\/g, "/");
      if (!cleanId.endsWith("/src/App.jsx")) return null;

      let next = code;
      const beforeLogo = next;
      next = next.replace(
        /const PETGROW_LOGO_DATA_URI\s*=\s*"data:image\/png;base64,[^"]+";/,
        `const PETGROW_LOGO_DATA_URI = "${BRAND_ASSET}";`
      );
      if (next === beforeLogo) this.error("PetGrow brand refresh: embedded logo source was not found.");

      next = next.replace(
        'style={{ ...style, borderRadius: "50%", objectFit: "cover", display: "block" }}',
        'style={{ ...style, borderRadius: "22%", objectFit: "contain", display: "block" }}'
      );

      const useTPattern = /function useT\(\)\s*\{\s*const lang = useLang\(\);\s*return STRINGS\[lang\] \|\| STRINGS\.ko;\s*\}/;
      if (!useTPattern.test(next)) this.error("PetGrow brand refresh: translation resolver was not found.");
      next = next.replace(
        useTPattern,
        `${PETGROW_MENU_LABELS_SOURCE}\n\nfunction useT() {\n  const lang = useLang();\n  const base = STRINGS[lang] || STRINGS.ko;\n  return { ...base, ...(PETGROW_MENU_LABELS[lang] || PETGROW_MENU_LABELS.ko) };\n}`
      );

      return { code: next, map: null };
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        let next = html
          .replace(/src="\/petgrow-splash-logo\.png"/g, `src="${BRAND_ASSET}"`)
          .replace(/href="\/icon-192\.png"/g, 'href="/icon-192.png?v=20260822"')
          .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/i, '<meta name="theme-color" content="#245e49" />');

        return {
          html: next,
          tags: [
            {
              tag: "link",
              attrs: { rel: "preload", as: "image", href: BRAND_ASSET, fetchpriority: "high" },
              injectTo: "head-prepend",
            },
            {
              tag: "style",
              attrs: { id: "petgrow-brand-refresh-20260822" },
              children: `
                #petgrow-initial-splash.pg3-premium .pg2-mark,
                #petgrow-initial-splash .pg2-mark {
                  background: url('${BRAND_ASSET}') center / cover no-repeat !important;
                  border-radius: 23px !important;
                  box-shadow: 0 15px 36px rgba(31,70,50,.17), inset 0 1px 0 rgba(255,255,255,.20) !important;
                }
                #petgrow-initial-splash .pg2-mark svg { opacity: 0 !important; }
                .petgrow-splash__logo { border-radius: 24% !important; object-fit: contain !important; }
              `,
              injectTo: "head",
            },
          ],
        };
      },
    },
  };
}
