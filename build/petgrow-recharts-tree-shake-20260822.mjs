const APP_RE = /[\\/]src[\\/]App\.jsx(?:\?|$)/;
const RECHART_DYNAMIC_IMPORT = 'import("recharts")';
const GROWTH_KIT_IMPORT = 'import("./recharts-growth-kit.js")';

export default function petgrowRechartsTreeShake20260822() {
  return {
    name: "petgrow-recharts-tree-shake-20260822",
    enforce: "pre",
    transform(code, id) {
      if (!APP_RE.test(id)) return null;
      if (!code.includes(RECHART_DYNAMIC_IMPORT)) {
        this.error("PetGrow recharts lazy import anchor missing");
      }
      return {
        code: code.replace(RECHART_DYNAMIC_IMPORT, GROWTH_KIT_IMPORT),
        map: null,
      };
    },
  };
}
