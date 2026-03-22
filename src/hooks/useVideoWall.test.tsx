import { useMemo, useRef, useState } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useVideoWall } from './useVideoWall';
import type { Cell, Layout } from '../types';

function createCells(layout: Layout): Cell[] {
  return Array.from({ length: layout.rows * layout.cols }, (_, index) => ({
    id: String(index),
    width: 1920,
    height: 1080,
  }));
}

function ControlledWallHarness({
  persistenceEnabled,
  onLayoutChangeSpy,
}: {
  persistenceEnabled: boolean;
  onLayoutChangeSpy: (layout: Layout) => void;
}) {
  const [propLayout, setPropLayout] = useState<Layout>({ rows: 2, cols: 3 });
  const cells = useMemo(() => createCells(propLayout), [propLayout]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { layout } = useVideoWall(
    {
      layout: propLayout,
      cells,
      persistence: persistenceEnabled
        ? { enabled: true, key: 'video-wall-persist-layout-sync-test' }
        : undefined,
      onLayoutChange: nextLayout => {
        onLayoutChangeSpy(nextLayout);
        setPropLayout(nextLayout);
      },
    },
    containerRef
  );

  return (
    <div>
      <div data-testid="prop-layout">{`${propLayout.rows}x${propLayout.cols}`}</div>
      <div data-testid="internal-layout">{`${layout.rows}x${layout.cols}`}</div>
      <div data-testid="cell-count">{cells.length}</div>
    </div>
  );
}

describe('useVideoWall persistence sync', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('syncs restored layout to controlled parent through onLayoutChange', async () => {
    window.localStorage.setItem(
      'video-wall-persist-layout-sync-test',
      JSON.stringify({
        layout: { rows: 1, cols: 1 },
        windows: [],
      })
    );

    const onLayoutChangeSpy = vi.fn();
    const { rerender } = render(
      <ControlledWallHarness persistenceEnabled={false} onLayoutChangeSpy={onLayoutChangeSpy} />
    );

    expect(screen.getByTestId('prop-layout').textContent).toBe('2x3');
    expect(screen.getByTestId('internal-layout').textContent).toBe('2x3');
    expect(screen.getByTestId('cell-count').textContent).toBe('6');

    rerender(<ControlledWallHarness persistenceEnabled onLayoutChangeSpy={onLayoutChangeSpy} />);

    await waitFor(() => {
      expect(onLayoutChangeSpy).toHaveBeenCalledWith({ rows: 1, cols: 1 });
    });

    await waitFor(() => {
      expect(screen.getByTestId('prop-layout').textContent).toBe('1x1');
      expect(screen.getByTestId('internal-layout').textContent).toBe('1x1');
      expect(screen.getByTestId('cell-count').textContent).toBe('1');
    });
  });
});
