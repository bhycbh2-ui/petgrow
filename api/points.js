/* Legacy compatibility endpoint after PetPoint removal - 2026-08-18.
 * Existing clients may still call this URL briefly. Return zero/disabled data so
 * no point balance is created, awarded, deducted, or required for content access.
 */

const ZERO_COSTS = Object.freeze({
  saju_basic: 0,
  saju_daily: 0,
  saju_compat: 0,
  tarot: 0,
});

export default async function handler(req, res) {
  const action = String(req.query.action || "summary");

  if (req.method === "GET" && action === "summary") {
    return res.status(200).json({
      disabled: true,
      balance: 0,
      startPoints: 0,
      costs: ZERO_COSTS,
      recent: [],
      pointEvent: null,
      todayEarned: 0,
      todaySpent: 0,
      weekSpent: 0,
      totalEarned: 0,
      totalSpent: 0,
      rank: 0,
      memberCount: 0,
      topPercent: 0,
      earnGuide: [],
    });
  }

  if (req.method === "GET" && action === "admin") {
    return res.status(200).json({ disabled: true, users: 0, balance: 0, earned: 0, spent: 0, events: 0 });
  }

  if (req.method === "POST" && action === "spend") {
    return res.status(200).json({ ok: true, disabled: true, spent: 0, balance: 0, label: "" });
  }

  return res.status(404).json({ error: "지원하지 않는 요청이에요." });
}
