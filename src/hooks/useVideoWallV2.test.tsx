import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVideoWallV2 } from './useVideoWallV2';

describe('useVideoWallV2', () => {
  it('dispatches action and returns updated state', () => {
    const { result } = renderHook(() => useVideoWallV2({ rows: 2, cols: 3 }));

    let created: any;
    act(() => {
      created = result.current.dispatch({
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
      } as any);
    });

    expect(created.ok).toBe(true);
    expect(result.current.getState().windowsById.w1.id).toBe('w1');
  });

  it('subscribes to state change events', () => {
    const { result } = renderHook(() => useVideoWallV2({ rows: 1, cols: 1 }));
    const handler = vi.fn();
    const unsubscribe = result.current.subscribe(handler);

    act(() => {
      result.current.dispatch({
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
      } as any);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
