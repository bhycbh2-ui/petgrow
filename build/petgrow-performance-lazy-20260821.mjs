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
const GROWTH_CHART_CALL_RE = /<GrowthChartCard\s+table=\{table\}\s+ageMonths=\{ageAtLatest\}\s+currentWeightKg=\{latest\.weightKg\}\s+statusDiffGrams=\{latest\.diffGrams\}\s*\/>/;
const LEAFLET_ASSIGN_RE = /if\s*\(\s*!window\.L\s*\)\s*window\.L\s*=\s*LeafletLib\s*;/;

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
