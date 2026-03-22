import { describe, expect, it } from 'vitest';
import { reduceState, type KernelAction } from './kernel';
import type { V2WallState } from '../types/v2';

function makeState(): V2WallState {
  return {
    windowsById: {},
    windowOrder: [],
    selection: { selectedIds: [] },
    groupsById: {},
    zonesById: {},
    layout: { rows: 1, cols: 1, strategy: 'free', locked: false },
    history: { past: [], future: [], capacity: 100 },
    meta: { version: 2 },
  };
}

describe('kernel invariants', () => {
  it('keeps windowOrder and windowsById one-to-one on create/remove', () => {
    const state = makeState();
    const created = reduceState(state, {
      type: 'window.create',
      config: {
        id: 'w1',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        zIndex: 1,
        locked: false,
        collapsed: false,
        lifecycle: 'idle',
        stream: { url: '', kind: 'auto' },
        priority: 0,
      },
    } as KernelAction);

    expect(created.windowOrder).toEqual(['w1']);
    expect(created.windowsById.w1.id).toBe('w1');

    const removed = reduceState(created, { type: 'window.remove', id: 'w1' } as KernelAction);
    expect(removed.windowOrder).toEqual([]);
    expect(removed.windowsById.w1).toBeUndefined();
  });

  it('removes deleted window from selection and groups', () => {
    const state = makeState();
    const withWindow = reduceState(state, {
      type: 'window.create',
      config: {
        id: 'w1',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        zIndex: 1,
        locked: false,
        collapsed: false,
        lifecycle: 'idle',
        stream: { url: '', kind: 'auto' },
        priority: 0,
      },
    } as KernelAction);

    withWindow.selection.selectedIds = ['w1'];
    withWindow.groupsById.g1 = { id: 'g1', name: 'g1', windowIds: ['w1'] };

    const removed = reduceState(withWindow, { type: 'window.remove', id: 'w1' } as KernelAction);
    expect(removed.selection.selectedIds).toEqual([]);
    expect(removed.groupsById.g1.windowIds).toEqual([]);
  });
});
