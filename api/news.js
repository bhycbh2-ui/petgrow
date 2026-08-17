const API_BASE = "https://naverapihub.apigw.ntruss.com/search/v1/news";

const SEARCH_QUERIES = [
  "반려동물",
  "반려견",
  "반려묘",
  "강아지",
  "고양이",
  "동물병원",
  "펫보험",
  "동물보호 유기동물"
];

const PET_TERMS = [
  "반려동물","반려견","반려묘","강아지","고양이","애견","애묘","펫","동물병원",
  "수의사","펫보험","유기동물","동물보호","입양","보호소","반려생활","반려인"
];

const CATEGORY_RULES = [
  ["건강", ["동물병원","수의사","질병","건강","백신","예방접종","치료","수술","의료","약"]],
  ["정책·제도", ["정책","법안","조례","정부","지자체","농림축산식품부","동물보호법","등록제","과태료"]],
  ["입양·보호", ["유기동물","보호소","입양","구조","동물보호","학대"]],
  ["산업·서비스", ["펫보험","펫푸드","사료","용품","펫테크","시장","산업","서비스","출시"]],
  ["반려견", ["반려견","강아지","애견","개 "]],
  ["반려묘", ["반려묘","고양이","애묘"]]
];

function stripHtml(value="") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isPetRelevant(item) {
  const hay = `${stripHtml(item.title)} ${stripHtml(item.description)}`.toLowerCase();
  return PET_TERMS.some(term => hay.includes(term.toLowerCase()));
}

function categoryFor(item) {
  const hay = `${stripHtml(item.title)} ${stripHtml(item.description)}`;
  for (const [category, terms] of CATEGORY_RULES) {
    if (terms.some(term => hay.includes(term))) return category;
  }
  return "반려동물";
}

function sourceFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "언론사";
  }
}

function normalizeItem(item) {
  const link = item.originallink || item.link || "";
  const title = stripHtml(item.title);
  const description = stripHtml(item.description);
  const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;
  return {
    id: `${title}|${link}`,
    title,
    description,
    category: categoryFor(item),
    source: sourceFromUrl(link),
    link,
    naverLink: item.link || link,
    publishedAt
  };
}

function dedupe(items) {
  const seenLinks = new Set();
  const seenTitles = new Set();
  const result = [];
  for (const item of items) {
    const titleKey = item.title.toLowerCase().replace(/[^0-9a-z가-힣]/g, "").slice(0, 80);
    if (!item.link || seenLinks.has(item.link) || seenTitles.has(titleKey)) continue;
    seenLinks.add(item.link);
    seenTitles.add(titleKey);
    result.push(item);
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clientId = process.env.NAVER_API_HUB_CLIENT_ID;
  const clientSecret = process.env.NAVER_API_HUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({
      configured: false,
      items: [],
      error: "뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    });
  }

  try {
    const responses = await Promise.all(
      SEARCH_QUERIES.map(async query => {
        const url = `${API_BASE}?query=${encodeURIComponent(query)}&display=20&start=1&sort=date&format=json`;
        const response = await fetch(url, {
          headers: {
            "X-NCP-APIGW-API-KEY-ID": clientId,
            "X-NCP-APIGW-API-KEY": clientSecret
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`NAVER API HUB ${response.status}: ${text.slice(0, 200)}`);
        }
        return response.json();
      })
    );

    const merged = responses.flatMap(r => Array.isArray(r.items) ? r.items : []);
    const normalized = dedupe(merged.filter(isPetRelevant).map(normalizeItem))
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const recent = normalized.filter(item => item.publishedAt && now - new Date(item.publishedAt).getTime() <= sevenDays);
    const items = (recent.length >= 20 ? recent : normalized).slice(0, 60);

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json({
      configured: true,
      updatedAt: new Date().toISOString(),
      refreshSeconds: 3600,
      total: items.length,
      items
    });
  } catch (error) {
    console.error("Pet news fetch failed", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({
      configured: true,
      items: [],
      error: "뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    });
  }
}
