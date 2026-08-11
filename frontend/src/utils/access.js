// TEMPORARY: no plan/subscription data exists on the backend yet.
// Everyone is effectively "free" tier right now. When you add a
// User.plan field + expose it via /users/me, replace the body of
// this function only — nothing else in the app needs to change.

export function canAccessService(service, currentUserPlan = "free") {

  if (service.status !== "available") return false;
  
  const planRank = {
    free: 0,
    pro: 1,
    enterprise: 2
  };

  return planRank[currentUserPlan] >= planRank[service.minPlan];

}