import { describe, expect, it } from 'vitest';
import {
  applyResizePointerAnchor,
  computeDragPosition,
  computeResizeRect,
  getRangeSelectionIds,
  resolveEmptyAreaDragMode,
  resolveModifiers,
  resolveSelectionAction,
  shouldStartDrag,
} from './interactionEngine';

describe('interactionEngine', () => {
  it('uses create mode on empty drag without shift and select mode with shift', () => {
    expect(resolveEmptyAreaDragMode(false)).toBe('create');
    expect(resolveEmptyAreaDragMode(true)).toBe('select');
  });

  it('applies drag threshold', () => {
    expect(shouldStartDrag(1, 1, 4)).toBe(false);
    expect(shouldStartDrag(3, 3, 4)).toBe(true);
  });

  it('resolves modifier keys', () => {
    const modifiers = resolveModifiers({ shiftKey: true, altKey: true, spaceKey: true });
    expect(modifiers.keepAspectRatio).toBe(true);
    expect(modifiers.centerResize).toBe(true);
    expect(modifiers.disableSnap).toBe(true);
  });

  it('uses append-toggle for first shift selection and range when anchor exists with multi-select', () => {
    expect(resolveSelectionAction({ selectedIds: ['a'], anchorId: 'a' }, 'b', true)).toBe('append-toggle');
    expect(resolveSelectionAction({ selectedIds: ['a', 'b'], anchorId: 'a' }, 'd', true)).toBe('range');
  });

  it('returns ordered range by selected strategy', () => {
    const all = ['a', 'b', 'c', 'd'];
    expect(getRangeSelectionIds(all, 'a', 'c', 'spatial', all)).toEqual(['a', 'b', 'c']);
    expect(getRangeSelectionIds(all, 'd', 'b', 'createOrder', undefined, all)).toEqual(['b', 'c', 'd']);
    expect(getRangeSelectionIds(all, 'b', 'd', 'zIndexOrder', undefined, undefined, all)).toEqual(['b', 'c', 'd']);
  });

  it('keeps drag anchor under pointer without left-shift drift', () => {
    const result = computeDragPosition({
      pointerX: 370,
      pointerY: 260,
      pointerOffsetX: 90,
      pointerOffsetY: 40,
      maxLeft: 800,
      maxTop: 500,
      snapGrid: 10,
    });

    expect(result).toEqual({ left: 280, top: 220 });
  });

  it('keeps opposite edge stable when west resize hits min width', () => {
    const result = computeResizeRect({
      pointerX: 350,
      pointerY: 200,
      resizeDir: 'w',
      initialLeft: 100,
      initialTop: 100,
      initialWidth: 300,
      initialHeight: 200,
      minWidth: 200,
      minHeight: 120,
      maxWidth: 1920,
      maxHeight: 1080,
      snapGrid: 10,
    });

    expect(result.left).toBe(200);
    expect(result.width).toBe(200);
    expect(result.top).toBe(100);
    expect(result.height).toBe(200);
  });

  it('keeps resize edge anchored to initial pointer offset', () => {
    const anchored = applyResizePointerAnchor({
      pointerX: 300,
      pointerY: 220,
      offsetX: -20,
      offsetY: 0,
      resizeDir: 'e',
    });

    expect(anchored.pointerX).toBe(320);
    expect(anchored.pointerY).toBe(220);

    const resized = computeResizeRect({
      pointerX: anchored.pointerX,
      pointerY: anchored.pointerY,
      resizeDir: 'e',
      initialLeft: 100,
      initialTop: 100,
      initialWidth: 200,
      initialHeight: 120,
      minWidth: 100,
      minHeight: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      snapGrid: 0,
    });

    expect(resized.width).toBe(220);
  });

  it('anchors bottom edge when dragging north handle', () => {
    const anchored = applyResizePointerAnchor({
      pointerX: 150,
      pointerY: 90,
      offsetX: 0,
      offsetY: 10,
      resizeDir: 'n',
    });

    expect(anchored.pointerX).toBe(150);
    expect(anchored.pointerY).toBe(100);
  });

  it('anchors top edge when dragging south handle', () => {
    const anchored = applyResizePointerAnchor({
      pointerX: 150,
      pointerY: 230,
      offsetX: 0,
      offsetY: 10,
      resizeDir: 's',
    });

    expect(anchored.pointerX).toBe(150);
    expect(anchored.pointerY).toBe(240);
  });

  it('north resize expands window downward with top fixed', () => {
    const anchored = applyResizePointerAnchor({
      pointerX: 150,
      pointerY: 80,
      offsetX: 0,
      offsetY: 20,
      resizeDir: 'n',
    });

    const resized = computeResizeRect({
      pointerX: anchored.pointerX,
      pointerY: anchored.pointerY,
      resizeDir: 'n',
      initialLeft: 100,
      initialTop: 100,
      initialWidth: 200,
      initialHeight: 150,
      minWidth: 100,
      minHeight: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      snapGrid: 0,
    });

    expect(resized.left).toBe(100);
    expect(resized.top).toBe(100);
    expect(resized.height).toBeGreaterThanOrEqual(150);
  });
});
