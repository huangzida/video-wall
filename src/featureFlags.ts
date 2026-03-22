export const featureFlags = {
  FF_HISTORY_STACK: false,
  FF_ZONE_SUPPORT: false,
  FF_GROUP_OPERATIONS: false,
  FF_LAYOUT_STRATEGIES: false,
  FF_PERSISTENCE_V2: false,
  FF_UNIFIED_API: false,
  FF_PLAYGROUND_LAB: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envValue = (import.meta as { env?: Record<string, string | undefined> }).env?.[flag];
  if (envValue === '1' || envValue === 'true') {
    return true;
  }
  if (envValue === '0' || envValue === 'false') {
    return false;
  }
  return featureFlags[flag];
}
