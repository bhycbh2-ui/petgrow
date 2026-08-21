const RECHART_NAMES = [
  "LineChart",
  "Line",
  "Area",
  "XAxis",
  "YAxis",
  "CartesianGrid",
  "Tooltip",
  "ResponsiveContainer",
  "ReferenceDot",
  "ReferenceLine",
  "Label",
];

const RECHART_IMPORT_RE = /import\s*\{\s*LineChart,\s*Line,\s*Area,\s*XAxis,\s*YAxis,\s*CartesianGrid,\s*Tooltip,\s*ResponsiveContainer,\s*ReferenceDot,\s*ReferenceLine,\s*Label,\s*\}\s*from\s*["']recharts["'];?\s*/;
const LEAFLET_IMPORT_RE = /import\s*\*\s*as\s*LeafletLib\s*from\s*["']leaflet["'];?\s*\n?import\s*["']leaflet\/dist\/leaflet\.css["'];?\s*/;
const HOME_INFO_IMPORT_RE = /import\s+HomeInfoMusicSections\s+from\s+["']\.\/HomeInfoMusicSections\.jsx["'];?\s*/;
const PET_DAILY_IMPORT_RE = /import\s*\{\s*DailyFortunePanel,\s*PetTarotPanel,\s*TodayPetHomeCard,\s*PetDailyHistory,\s*PET_DAILY_CSS\s*\}\s*from\s*["']\.\/PetDailyWidgets\.jsx["'];?\s*/;
const GROWTH_CHART_CALL_RE = /<GrowthChartCard\s+table=\{table\}\s+ageMonths=\{ageAtLatest\}\s+currentWeightKg=\{latest\.weightKg\}\s+statusDiffGrams=\{latest\.diffGrams\}\s*\/>/;
const LEAFLET_ASSIGN_RE = /if\s*\(\s*!window\.L\s*\)\s*window\.L\s*=\s*LeafletLib\s*;/;
const PET_DAILY_CSS_USE_RE = /\$\{PET_DAILY_CSS\}/;

function rechartsGateSource() {
  return `let ${RECHART_NAMES.join(", ")};
let __petgrowRechartsPromise = null;

function __petgrowLoadRecharts() {
  if (!__petgrowRechartsPromise) {
    __petgrowRechartsPromise = import("recharts")
      .then((mod) => {
        ({ ${RECHART_NAMES.join(", ")} } = mod);
        return mod;
      })
      .catch((error) => {
        __petgrowRechartsPromise = null;
        throw error;
      });
  }
  return __petgrowRechartsPromise;
}

function PetGrowRechartsGate({ children }) {
  const [ready, setReady] = useState(() => Boolean(ResponsiveContainer));
  useEffect(() => {
    if (ready) return undefined;
    let active = true;
    __petgrowLoadRecharts()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((error) => {
        console.warn("PetGrow growth chart lazy load failed", error);
      });
    return () => {
      active = false;
    };
  }, [ready]);

  if (!ready) {
    return React.createElement(
      "div",
      {
        className: "bg-card",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        style: { minHeight: 280, display: "grid", placeItems: "center" },
      },
      "성장 차트를 불러오는 중입니다…",
    );
  }
  return children;
}

`;
}

function homeInfoLazySource() {
  return `let __petgrowHomeInfoPromise = null;
function __petgrowLoadHomeInfo() {
  if (!__petgrowHomeInfoPromise) {
    __petgrowHomeInfoPromise = import("./HomeInfoMusicSections.jsx").catch((error) => {
      __petgrowHomeInfoPromise = null;
      throw error;
    });
  }
  return __petgrowHomeInfoPromise;
}

function HomeInfoMusicSections(props) {
  const hostRef = useRef(null);
  const [Component, setComponent] = useState(null);
  useEffect(() => {
    let active = true;
    let observer = null;
    let timer = null;
    let idleId = null;
    let requested = false;
    const load = () => {
      if (requested) return;
      requested = true;
      __petgrowLoadHomeInfo()
        .then((mod) => {
          if (active) setComponent(() => mod.default);
        })
        .catch((error) => console.warn("PetGrow home extras lazy load failed", error));
    };

    if (typeof IntersectionObserver !== "undefined" && hostRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
          observer?.disconnect();
        }
      }, { rootMargin: "520px 0px" });
      observer.observe(hostRef.current);
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(load, { timeout: 1200 });
    } else {
      timer = window.setTimeout(load, 500);
    }

    return () => {
      active = false;
      observer?.disconnect();
      if (idleId != null && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  return React.createElement(
    "div",
    { ref: hostRef, "data-home-extras-deferred": "true", style: { minHeight: Component ? undefined : 84 } },
    Component
      ? React.createElement(Component, props)
      : React.createElement("div", {
          "aria-hidden": "true",
          "data-petgrow-silent-placeholder": "home-extras",
          style: { minHeight: 84, borderRadius: 18, background: "rgba(245,248,245,.42)" },
        }),
  );
}

`;
}

function petDailyLazySource() {
  return `let __petgrowPetDailyPromise = null;
function __petgrowLoadPetDaily() {
  if (!__petgrowPetDailyPromise) {
    __petgrowPetDailyPromise = import("./PetDailyWidgets.jsx")
      .then((mod) => {
        if (typeof document !== "undefined" && mod.PET_DAILY_CSS && !document.getElementById("petgrow-pet-daily-css")) {
          const style = document.createElement("style");
          style.id = "petgrow-pet-daily-css";
          style.textContent = mod.PET_DAILY_CSS;
          document.head.appendChild(style);
        }
        return mod;
      })
      .catch((error) => {
        __petgrowPetDailyPromise = null;
        throw error;
      });
  }
  return __petgrowPetDailyPromise;
}

function __petgrowPetDailyProxy(exportName, compact = false) {
  return function PetGrowPetDailyDeferred(props) {
    const [Component, setComponent] = useState(null);
    useEffect(() => {
      let active = true;
      __petgrowLoadPetDaily()
        .then((mod) => {
          const resolved = mod?.[exportName];
          if (active && resolved) setComponent(() => resolved);
        })
        .catch((error) => console.warn("PetGrow daily widget lazy load failed", exportName, error));
      return () => { active = false; };
    }, []);

    if (Component) return React.createElement(Component, props);
    return React.createElement("div", {
      "aria-hidden": "true",
      "data-petgrow-silent-placeholder": exportName,
      style: compact
        ? { minHeight: 72, borderRadius: 16, background: "rgba(245,248,245,.4)" }
        : { minHeight: 132, borderRadius: 18, background: "rgba(245,248,245,.4)" },
    });
  };
}

const DailyFortunePanel = __petgrowPetDailyProxy("DailyFortunePanel");
const PetTarotPanel = __petgrowPetDailyProxy("PetTarotPanel");
const TodayPetHomeCard = __petgrowPetDailyProxy("TodayPetHomeCard", true);
const PetDailyHistory = __petgrowPetDailyProxy("PetDailyHistory", true);

`;
}

const leafletLazySource = `if(!window.L){
      try {
        const [leafletModule] = await Promise.all([
          import("leaflet"),
          import("leaflet/dist/leaflet.css"),
        ]);
        window.L = leafletModule?.default || leafletModule;
      } catch (error) {
        console.warn("Leaflet local chunk load failed; using CDN fallback", error);
      }
    }`;

export default function petgrowPerformanceLazy() {
  return {
    name: "petgrow-performance-lazy-20260821",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;

      let next = code;
      const missing = [];

      if (!HOME_INFO_IMPORT_RE.test(next)) missing.push("home info import");
      else next = next.replace(HOME_INFO_IMPORT_RE, homeInfoLazySource());

      if (!PET_DAILY_IMPORT_RE.test(next)) missing.push("pet daily import");
      else next = next.replace(PET_DAILY_IMPORT_RE, petDailyLazySource());

      if (!PET_DAILY_CSS_USE_RE.test(next)) missing.push("pet daily css use");
      else next = next.replace(PET_DAILY_CSS_USE_RE, "");

      if (!RECHART_IMPORT_RE.test(next)) missing.push("recharts import");
      else next = next.replace(RECHART_IMPORT_RE, rechartsGateSource());

      if (!GROWTH_CHART_CALL_RE.test(next)) missing.push("GrowthChartCard call");
      else {
        next = next.replace(
          GROWTH_CHART_CALL_RE,
          (match) => `<PetGrowRechartsGate>\n          ${match}\n        </PetGrowRechartsGate>`,
        );
      }

      if (!LEAFLET_IMPORT_RE.test(next)) missing.push("leaflet imports");
      else next = next.replace(LEAFLET_IMPORT_RE, "");

      if (!LEAFLET_ASSIGN_RE.test(next)) missing.push("leaflet assignment");
      else next = next.replace(LEAFLET_ASSIGN_RE, leafletLazySource);

      if (missing.length) {
        this.error(`PetGrow performance lazy transform anchors missing: ${missing.join(", ")}`);
      }

      return {
        code: next,
        map: null,
      };
    },
  };
}
