import { useMemo, useRef, useState } from 'react';
import { createEventBus } from '../core/eventBus';
import { applyActionsAtomically, reduceState, type KernelAction } from '../core/kernel';
import type { Action, Result, V2WallState } from '../types/v2';

function createInitialState(rows: number, cols: number): V2WallState {
  return {
    windowsById: {},
    windowOrder: [],
    selection: { selectedIds: [] },
    groupsById: {},
    zonesById: {},
    layout: { rows, cols, strategy: 'free', locked: false },
    history: { past: [], future: [], capacity: 100 },
    meta: { version: 2 },
  };
}

export function useVideoWallV2(initialLayout: { rows: number; cols: number }) {
  const [state, setState] = useState<V2WallState>(() => createInitialState(initialLayout.rows, initialLayout.cols));
  const stateRef = useRef(state);
  stateRef.current = state;

  const bus = useMemo(() => createEventBus<{ type: 'state.changed'; state: V2WallState }>(), []);

  const dispatch = (action: Action): Result<V2WallState> => {
    const next = reduceState(stateRef.current, action as KernelAction);
    setState(next);
    bus.publish({ type: 'state.changed', state: next });
    return { ok: true, data: next };
  };

  const batch = (actions: Action[]): Result<V2WallState> => {
    const result = applyActionsAtomically(stateRef.current, actions as KernelAction[]);
    if (result.ok) {
      setState(result.data);
      bus.publish({ type: 'state.changed', state: result.data });
    }
    return result;
  };

  return {
    dispatch,
    batch,
    getState: () => stateRef.current,
    subscribe: bus.subscribe,
  };
}
