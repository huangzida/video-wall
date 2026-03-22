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

export interface DragComputeInput {
  pointerX: number;
  pointerY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  maxLeft: number;
  maxTop: number;
  snapGrid: number;
  snapThreshold?: number;
}

export interface ResizeComputeInput {
  pointerX: number;
  pointerY: number;
  resizeDir: string;
  initialLeft: number;
  initialTop: number;
  initialWidth: number;
  initialHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  snapGrid: number;
  snapThreshold?: number;
}

export interface ResizeAnchorInput {
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  resizeDir: string;
}

function snapValue(value: number, gridSize: number, threshold: number): number {
  if (!gridSize || gridSize <= 0) return value;
  const snapped = Math.round(value / gridSize) * gridSize;
  return Math.abs(snapped - value) <= threshold ? snapped : value;
}

export function computeDragPosition(input: DragComputeInput): { left: number; top: number } {
  const {
    pointerX,
    pointerY,
    pointerOffsetX,
    pointerOffsetY,
    maxLeft,
    maxTop,
    snapGrid,
    snapThreshold = 5,
  } = input;

  const left = Math.max(0, Math.min(snapValue(pointerX - pointerOffsetX, snapGrid, snapThreshold), maxLeft));
  const top = Math.max(0, Math.min(snapValue(pointerY - pointerOffsetY, snapGrid, snapThreshold), maxTop));

  return { left, top };
}

export function computeResizeRect(input: ResizeComputeInput): { left: number; top: number; width: number; height: number } {
  const {
    pointerX,
    pointerY,
    resizeDir,
    initialLeft,
    initialTop,
    initialWidth,
    initialHeight,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    snapGrid,
    snapThreshold = 5,
  } = input;

  const initialRight = initialLeft + initialWidth;
  const initialBottom = initialTop + initialHeight;

  let left = initialLeft;
  let top = initialTop;
  let right = initialRight;
  let bottom = initialBottom;

  if (resizeDir.includes('w')) {
    const maxLeft = Math.min(initialRight - minWidth, maxWidth - minWidth);
    left = Math.max(0, Math.min(pointerX, maxLeft));
    left = snapValue(left, snapGrid, snapThreshold);
    left = Math.max(0, Math.min(left, maxLeft));
    right = initialRight;
  }

  if (resizeDir.includes('e')) {
    const minRight = Math.max(initialLeft + minWidth, minWidth);
    right = Math.max(minRight, Math.min(pointerX, maxWidth));
    right = snapValue(right, snapGrid, snapThreshold);
    right = Math.max(minRight, Math.min(right, maxWidth));
    left = initialLeft;
  }

  if (resizeDir.includes('n')) {
    const maxTop = Math.min(initialBottom - minHeight, maxHeight - minHeight);
    top = Math.max(0, Math.min(pointerY, maxTop));
    top = snapValue(top, snapGrid, snapThreshold);
    top = Math.max(0, Math.min(top, maxTop));
    bottom = initialBottom;
  }

  if (resizeDir.includes('s')) {
    const minBottom = Math.max(initialTop + minHeight, minHeight);
    bottom = Math.max(minBottom, Math.min(pointerY, maxHeight));
    bottom = snapValue(bottom, snapGrid, snapThreshold);
    bottom = Math.max(minBottom, Math.min(bottom, maxHeight));
    top = initialTop;
  }

  const width = Math.max(minWidth, right - left);
  const height = Math.max(minHeight, bottom - top);

  return { left, top, width, height };
}

export function applyResizePointerAnchor(input: ResizeAnchorInput): { pointerX: number; pointerY: number } {
  const { pointerX, pointerY, offsetX, offsetY, resizeDir } = input;

  return {
    pointerX: resizeDir.includes('w') || resizeDir.includes('e') ? pointerX - offsetX : pointerX,
    pointerY: resizeDir.includes('n') || resizeDir.includes('s') ? pointerY - offsetY : pointerY,
  };
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
