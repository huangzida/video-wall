import type { V2WallState, WindowLifecycle } from '../types/v2';

const LIFECYCLE_TRANSITIONS: Record<WindowLifecycle, WindowLifecycle[]> = {
  idle: ['mounting'],
  mounting: ['ready', 'error'],
  ready: ['suspended', 'error'],
  suspended: ['ready', 'error'],
  error: ['mounting'],
};

export function createGroup(state: V2WallState, groupId: string, windowIds: string[]): V2WallState {
  const next: V2WallState = {
    ...state,
    groupsById: {
      ...state.groupsById,
      [groupId]: {
        id: groupId,
        name: groupId,
        windowIds: [...windowIds],
      },
    },
  };
  return next;
}

export function removeGroup(state: V2WallState, groupId: string): V2WallState {
  const groupsById = { ...state.groupsById };
  delete groupsById[groupId];
  return {
    ...state,
    groupsById,
  };
}

export function transitionLifecycle(current: WindowLifecycle, next: WindowLifecycle): WindowLifecycle {
  return LIFECYCLE_TRANSITIONS[current].includes(next) ? next : current;
}
