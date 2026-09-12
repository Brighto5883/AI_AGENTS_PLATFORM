// TEMPORARY: no plan/subscription data exists on the backend yet.
// Everyone is effectively "free" tier right now. When you add a
// User.plan field + expose it via /users/me, replace the body of
// this function only — nothing else in the app needs to change.

import type { Service, UserPlan } from "@/config/services";

const planRank: Record<UserPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function canAccessService(
  service: Service,
  currentUserPlan: UserPlan = "free",
): boolean {
  if (service.status !== "available") {
    return false;
  }

  return (
    planRank[currentUserPlan] >=
    planRank[service.minPlan]
  );
}
