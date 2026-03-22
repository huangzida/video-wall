import { describe, expect, it } from 'vitest';
import { createGroup, removeGroup, transitionLifecycle } from './windowManager';
import { applyActionsAtomically } from '../core/kernel';
import type { V2WallState } from '../types/v2';

function makeState(): V2WallState {
  return {
    windowsById: {
      w1: {
        id: 'w1',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        zIndex: 1,
        locked: false,
        collapsed: false,
        lifecycle: 'idle',
        stream: { url: '', kind: 'auto' },
        priority: 0,
      },
    },
    windowOrder: ['w1'],
    selection: { selectedIds: [] },
    groupsById: {},
    zonesById: {},
    layout: { rows: 1, cols: 1, strategy: 'free', locked: false },
    history: { past: [], future: [], capacity: 100 },
    meta: { version: 2 },
  };
}

describe('windowManager', () => {
  it('creates and removes groups', () => {
    const state = makeState();
    const created = createGroup(state, 'g1', ['w1']);
    expect(created.groupsById.g1.windowIds).toEqual(['w1']);

    const removed = removeGroup(created, 'g1');
    expect(removed.groupsById.g1).toBeUndefined();
  });

  it('transitions lifecycle with guard', () => {
    expect(transitionLifecycle('idle', 'mounting')).toBe('mounting');
    expect(transitionLifecycle('idle', 'ready')).toBe('idle');
  });

  it('rolls back atomically when one action fails', () => {
    const state = makeState();
    const result = applyActionsAtomically(state, [
      { type: 'window.update', id: 'w1', patch: { collapsed: true } },
      { type: 'window.update', id: 'missing', patch: { collapsed: true } },
    ] as any);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect((result.error.detail as any).failedAt).toBe(1);
    }
    expect(state.windowsById.w1.collapsed).toBe(false);
  });
});
