import { ErrorCode, type Action, type Result, type V2WallState, type V2WindowState } from '../types/v2';

export type KernelAction = Action;

function cloneState(state: V2WallState): V2WallState {
  return {
    windowsById: { ...state.windowsById },
    windowOrder: [...state.windowOrder],
    selection: {
      selectedIds: [...state.selection.selectedIds],
      anchorId: state.selection.anchorId,
    },
    groupsById: Object.fromEntries(
      Object.entries(state.groupsById).map(([id, group]) => [
        id,
        {
          ...group,
          windowIds: [...group.windowIds],
        },
      ])
    ),
    zonesById: { ...state.zonesById },
    layout: { ...state.layout },
    history: {
      past: [...state.history.past],
      future: [...state.history.future],
      capacity: state.history.capacity,
    },
    meta: { ...state.meta },
  };
}

function pruneDanglingReferences(state: V2WallState): void {
  const windowIdSet = new Set(state.windowOrder);

  state.selection.selectedIds = state.selection.selectedIds.filter(id => windowIdSet.has(id));

  Object.values(state.groupsById).forEach(group => {
    group.windowIds = group.windowIds.filter(id => windowIdSet.has(id));
  });
}

export function reduceState(state: V2WallState, action: KernelAction): V2WallState {
  const next = cloneState(state);

  switch (action.type) {
    case 'window.create': {
      const source = action.config as Partial<V2WindowState>;
      if (!source.id || next.windowsById[source.id]) {
        return next;
      }

      const windowState: V2WindowState = {
        id: source.id,
        bounds: source.bounds ?? { x: 0, y: 0, width: 100, height: 100 },
        zIndex: source.zIndex ?? next.windowOrder.length + 1,
        zoneId: source.zoneId,
        groupId: source.groupId,
        locked: source.locked ?? false,
        collapsed: source.collapsed ?? false,
        lifecycle: source.lifecycle ?? 'idle',
        stream: source.stream ?? { url: '', kind: 'auto' },
        priority: source.priority ?? 0,
      };

      next.windowsById[windowState.id] = windowState;
      next.windowOrder.push(windowState.id);
      break;
    }

    case 'window.remove': {
      delete next.windowsById[action.id];
      next.windowOrder = next.windowOrder.filter(id => id !== action.id);
      pruneDanglingReferences(next);
      break;
    }

    case 'window.update': {
      const target = next.windowsById[action.id];
      if (!target) {
        return next;
      }
      next.windowsById[action.id] = {
        ...target,
        ...action.patch,
        bounds: action.patch.bounds ? { ...action.patch.bounds } : target.bounds,
        stream: action.patch.stream ? { ...action.patch.stream } : target.stream,
      };
      break;
    }

    case 'interaction.select.single': {
      if (!next.windowsById[action.id]) {
        return next;
      }
      next.selection.selectedIds = [action.id];
      next.selection.anchorId = action.id;
      break;
    }

    default:
      break;
  }

  pruneDanglingReferences(next);
  return next;
}

function canApplyAction(state: V2WallState, action: KernelAction): boolean {
  if (action.type === 'window.update') {
    return Boolean(state.windowsById[action.id]);
  }
  if (action.type === 'window.remove') {
    return Boolean(state.windowsById[action.id]);
  }
  return true;
}

export function applyActionsAtomically(state: V2WallState, actions: KernelAction[]): Result<V2WallState> {
  let next = cloneState(state);

  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    if (!canApplyAction(next, action)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.ERR_WINDOW_NOT_FOUND,
          message: 'Atomic batch failed because a window target does not exist.',
          detail: { failedAt: index, action },
        },
      };
    }
    next = reduceState(next, action);
  }

  return { ok: true, data: next };
}
