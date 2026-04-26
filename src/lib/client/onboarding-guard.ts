/** sessionStorage: user completed onboarding in this browser session. */
export function onboardingCacheKey(userId: string) {
  return `tl_onb_done_${userId}` as const;
}
