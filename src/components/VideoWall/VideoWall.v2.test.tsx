import { describe, expect, it } from 'vitest';
import { resolveEmptyAreaDragMode, resolveSelectionAction } from '../../engines/interactionEngine';

describe('VideoWall v2 interaction semantics', () => {
  it('keeps empty-area drag as create by default and uses shift for select-box mode', () => {
    expect(resolveEmptyAreaDragMode(false)).toBe('create');
    expect(resolveEmptyAreaDragMode(true)).toBe('select');
  });

  it('uses range selection only when anchor exists with multi-select', () => {
    expect(resolveSelectionAction({ selectedIds: ['w1'], anchorId: 'w1' }, 'w2', true)).toBe('append-toggle');
    expect(resolveSelectionAction({ selectedIds: ['w1', 'w2'], anchorId: 'w1' }, 'w4', true)).toBe('range');
  });
});
