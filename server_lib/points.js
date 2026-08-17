/* PetPoint feature disabled - 2026-08-18.
 *
 * These exports remain temporarily for compatibility with legacy callers in the
 * existing app bundle. They do not create/read point tables, award points, revoke
 * points, deduct points, or block content.
 */

export const POINT_COSTS = Object.freeze({
  saju_basic: 0,
  saju_daily: 0,
  saju_compat: 0,
  tarot: 0,
});

const disabledEvent = () => ({
  disabled: true,
  awarded: 0,
  revoked: 0,
  spent: 0,
  balance: 0,
});

export async function awardPoints() {
  return disabledEvent();
}

export async function revokePoints() {
  return disabledEvent();
}

export async function spendPoints() {
  return disabledEvent();
}

export async function getPointSummary() {
  return {
    disabled: true,
    balance: 0,
    startPoints: 0,
    costs: POINT_COSTS,
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
  };
}

export async function getPointAdminStats() {
  return {
    disabled: true,
    users: 0,
    balance: 0,
    earned: 0,
    spent: 0,
    events: 0,
  };
}
