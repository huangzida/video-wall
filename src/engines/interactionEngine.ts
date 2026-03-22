export type EmptyAreaDragMode = 'create' | 'select';

export type RangeOrderStrategy = 'spatial' | 'createOrder' | 'zIndexOrder';

export interface SelectionState {
  selectedIds: string[];
  anchorId?: string;
}

export interface ModifierState {
  keepAspectRatio: boolean;
  centerResize: boolean;
  disableSnap: boolean;
}

export function resolveEmptyAreaDragMode(shiftKey: boolean): EmptyAreaDragMode {
  return shiftKey ? 'select' : 'create';
}

export function shouldStartDrag(dx: number, dy: number, threshold = 4): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

export function resolveModifiers(input: { shiftKey?: boolean; altKey?: boolean; spaceKey?: boolean }): ModifierState {
  return {
    keepAspectRatio: Boolean(input.shiftKey),
    centerResize: Boolean(input.altKey),
    disableSnap: Boolean(input.spaceKey),
  };
}

export function resolveSelectionAction(state: SelectionState, clickedId: string, shiftKey: boolean): 'single' | 'append-toggle' | 'range' {
  if (!shiftKey) {
    return 'single';
  }

  if (state.selectedIds.length <= 1 || !state.anchorId) {
    return 'append-toggle';
  }

  if (state.anchorId === clickedId) {
    return 'append-toggle';
  }

  return 'range';
}

export function getRangeSelectionIds(
  ids: string[],
  anchorId: string,
  targetId: string,
  strategy: RangeOrderStrategy,
  spatialOrder?: string[],
  createOrder?: string[],
  zIndexOrder?: string[]
): string[] {
  const base = strategy === 'spatial'
    ? spatialOrder ?? ids
    : strategy === 'createOrder'
      ? createOrder ?? ids
      : zIndexOrder ?? ids;

  const anchorIndex = base.indexOf(anchorId);
  const targetIndex = base.indexOf(targetId);
  if (anchorIndex === -1 || targetIndex === -1) {
    return [targetId];
  }

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return base.slice(start, end + 1);
}
