import { orderConflictSteps, type ConflictStep } from '../utils/conflict';
import { scaleRectByBasis, type Rect, type Size } from '../utils/zones';

export interface ZoneCandidate {
  cellId: string;
  overlapArea: number;
  zonePriority: number;
  index: number;
}

export function mapZoneRectToWall(rect: Rect, basis: Size, current: Size): Rect {
  return scaleRectByBasis(rect, basis, current);
}

export function rankZoneCandidates(candidates: ZoneCandidate[]): ZoneCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.overlapArea !== a.overlapArea) {
      return b.overlapArea - a.overlapArea;
    }
    if (b.zonePriority !== a.zonePriority) {
      return b.zonePriority - a.zonePriority;
    }
    return a.index - b.index;
  });
}

export function runConflictPipeline(steps: ConflictStep[]): ConflictStep[] {
  return orderConflictSteps(steps);
}
