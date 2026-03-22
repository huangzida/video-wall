export type ConflictStep = 'boundary' | 'zone' | 'overlap' | 'min-size' | 'snap';

const FIXED_ORDER: ConflictStep[] = ['boundary', 'zone', 'overlap', 'min-size', 'snap'];

export function orderConflictSteps(steps: ConflictStep[]): ConflictStep[] {
  const stepSet = new Set(steps);
  return FIXED_ORDER.filter(step => stepSet.has(step));
}
