const BRAND_ASSET = "/petgrow-brand-source.svg?v=20260822b";
const SITE_URL = "https://www.petgrow.co.kr/";
const SEO_TITLE = "PetGrow | 반려동물 평생 기록·건강·커뮤니티";
const SEO_DESCRIPTION = "반려동물의 성장·건강·일상·추억을 기록하고, 우리 아이·커뮤니티·Pet정보·내 주변 Pet을 한곳에서 이용하는 PetGrow.";
const SEO_STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "PetGrow",
      alternateName: "펫그로우",
      url: SITE_URL,
      logo: `${SITE_URL}petgrow-brand-source.svg?v=20260822b`,
      description: SEO_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "PetGrow",
      description: SEO_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}#organization` },
      inLanguage: "ko-KR",
    },
  ],
});

const PETGROW_MENU_LABELS_SOURCE = `const PETGROW_MENU_LABELS = {
  ko: {
    myPetsNav: "우리 아이",
    communityNav: "커뮤니티",
    sajuNav: "펫운세",
    petBtiNav: "펫성향",
    tipsTitle: "Pet정보",
    nearbyNav: "펫플레이스",
    nearbyTitle: "펫플레이스",
    myPageTitle: "내 정보",
  },
  en: {
    myPetsNav: "My Pets",
    communityNav: "Community",
    sajuNav: "Pet Fortune",
    petBtiNav: "Pet Personality",
    tipsTitle: "Pet Info",
    nearbyNav: "Pet Places",
    nearbyTitle: "Pet Places",
    myPageTitle: "My Profile",
  },
  ja: {
    myPetsNav: "マイペット",
    communityNav: "コミュニティ",
    sajuNav: "Pet運勢",
    petBtiNav: "Pet性格",
    tipsTitle: "Pet情報",
    nearbyNav: "Petスポット",
    nearbyTitle: "Petスポット",
    myPageTitle: "マイページ",
  },
  zh: {
    myPetsNav: "我的宠物",
    communityNav: "社区",
    sajuNav: "Pet运势",
    petBtiNav: "Pet性格",
    tipsTitle: "Pet信息",
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
          .replace(/href="\/icon-192\.png"/g, 'href="/petgrow-brand-source.svg?v=20260822b"')
          .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/i, '<meta name="theme-color" content="#086a3c" />')
          .replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${SEO_DESCRIPTION}" />`)
          .replace(/<title>[^<]*<\/title>/i, `<title>${SEO_TITLE}</title>`);

        return {
          html: next,
          tags: [
            {
              tag: "link",
              attrs: { rel: "preload", as: "image", href: BRAND_ASSET, fetchpriority: "high" },
              injectTo: "head-prepend",
            },
            {
              tag: "link",
              attrs: { rel: "canonical", href: SITE_URL },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "application-name", content: "PetGrow" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:type", content: "website" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:locale", content: "ko_KR" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:site_name", content: "PetGrow" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:title", content: SEO_TITLE },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:description", content: SEO_DESCRIPTION },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:url", content: SITE_URL },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:image", content: `${SITE_URL}icon-512.png?v=20260822` },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "twitter:card", content: "summary_large_image" },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "twitter:title", content: SEO_TITLE },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "twitter:description", content: SEO_DESCRIPTION },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "twitter:image", content: `${SITE_URL}icon-512.png?v=20260822` },
              injectTo: "head",
            },
            {
              tag: "script",
              attrs: { type: "application/ld+json", id: "petgrow-structured-data" },
              children: SEO_STRUCTURED_DATA,
              injectTo: "head",
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
