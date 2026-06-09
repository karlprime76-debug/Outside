export function useOnboardingCheck() {
  const markStep = async (field: string) => {
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: true }),
      });
    } catch {
    }
  };

  return {
    markProfilePhoto: () => markStep("hasProfilePhoto"),
    markActiveCity: () => markStep("hasActiveCity"),
    markFollowedUsers: () => markStep("hasFollowedUsers"),
    markSavedPlan: () => markStep("hasSavedPlan"),
    markViewedMoment: () => markStep("hasViewedMoment"),
    markActivatedStatus: () => markStep("hasActivatedStatus"),
  };
}
