import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { VideoWall } from './VideoWall';
import type { VideoWallRef } from '../../types';
import { resolveEmptyAreaDragMode, resolveSelectionAction } from '../../engines/interactionEngine';

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as any).ResizeObserver = ResizeObserverMock;
  }

  if (!globalThis.IntersectionObserver) {
    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];
    }
    (globalThis as any).IntersectionObserver = IntersectionObserverMock;
  }
});

describe('VideoWall v2 interaction semantics', () => {
  it('keeps empty-area drag as create by default and uses shift for select-box mode', () => {
    expect(resolveEmptyAreaDragMode(false)).toBe('create');
    expect(resolveEmptyAreaDragMode(true)).toBe('select');
  });

  it('uses range selection only when anchor exists with multi-select', () => {
    expect(resolveSelectionAction({ selectedIds: ['w1'], anchorId: 'w1' }, 'w2', true)).toBe('append-toggle');
    expect(resolveSelectionAction({ selectedIds: ['w1', 'w2'], anchorId: 'w1' }, 'w4', true)).toBe('range');
  });

  it('keeps drag movement anchored to logical state at low scale', () => {
    const ref = createRef<VideoWallRef>();

    const { container } = render(
      <div style={{ width: 800, height: 500 }}>
        <VideoWall
          ref={ref}
          layout={{ rows: 1, cols: 1 }}
          cells={[{ id: '0', width: 1920, height: 1080 }]}
          scaleMode="original"
          showTitle={false}
        />
      </div>
    );

    let id: string | null = null;
    act(() => {
      id = ref.current?.addWindow({
        cellId: '0',
        position: [100, 50],
        size: [400, 300],
        streamUrl: 'https://example.com/video.mp4',
        snapGrid: 10,
      }) ?? null;
    });

    expect(id).toBeTruthy();

    const windowEl = container.querySelector(`[data-window-id="${id}"]`) as HTMLElement | null;
    expect(windowEl).toBeTruthy();
    const wallEl = windowEl?.parentElement as HTMLElement | null;
    expect(wallEl).toBeTruthy();

    wallEl!.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1920,
      bottom: 1080,
      width: 1920,
      height: 1080,
      toJSON: () => ({}),
    } as DOMRect);

    // Inject a small sub-pixel style drift. Drag math should still rely on logical state.
    windowEl!.getBoundingClientRect = () => ({
      x: 110,
      y: 60,
      left: 110,
      top: 60,
      right: 530,
      bottom: 380,
      width: 420,
      height: 320,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseDown(windowEl!, { clientX: 150, clientY: 80, button: 0 });
    fireEvent.mouseMove(window, { clientX: 250, clientY: 120 });
    fireEvent.mouseUp(window, { clientX: 250, clientY: 120 });

    const moved = ref.current?.getWindow(id!);
    expect(moved?.position).toEqual([200, 90]);
  });
});
