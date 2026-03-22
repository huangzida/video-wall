import { describe, expect, it } from 'vitest';
import {
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
});
