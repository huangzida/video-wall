import { describe, expect, it } from 'vitest';
import { mapZoneRectToWall, rankZoneCandidates, runConflictPipeline } from './layoutEngine';

describe('layoutEngine', () => {
  it('maps zone rect from basis resolution to current wall size', () => {
    const mapped = mapZoneRectToWall(
      { x: 100, y: 50, width: 200, height: 100 },
      { width: 1000, height: 500 },
      { width: 2000, height: 1000 }
    );

    expect(mapped).toEqual({ x: 200, y: 100, width: 400, height: 200 });
  });

  it('ranks candidates by overlap desc, priority desc, index asc', () => {
    const ranked = rankZoneCandidates([
      { cellId: '2', overlapArea: 100, zonePriority: 1, index: 2 },
      { cellId: '1', overlapArea: 100, zonePriority: 2, index: 1 },
      { cellId: '0', overlapArea: 120, zonePriority: 1, index: 0 },
    ]);

    expect(ranked.map(item => item.cellId)).toEqual(['0', '1', '2']);
  });

  it('runs deterministic conflict step order', () => {
    const result = runConflictPipeline(['boundary', 'zone', 'overlap', 'min-size', 'snap']);
    expect(result).toEqual(['boundary', 'zone', 'overlap', 'min-size', 'snap']);
  });
});
