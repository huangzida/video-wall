import type { Cell, Layout } from '../types';

export interface CellPosition {
  cellId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateCellPositions(
  cells: Cell[],
  layout: Layout,
  gap: number = 0
): CellPosition[] {
  const { rows, cols } = layout;
  const positions: CellPosition[] = [];
  
  let currentX = 0;
  let currentY = 0;
  let maxHeightInRow = 0;

  cells.forEach((cell, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    if (col === 0 && index > 0) {
      currentX = 0;
      currentY += maxHeightInRow + gap;
      maxHeightInRow = 0;
    }

    positions.push({
      cellId: cell.id,
      x: currentX,
      y: currentY,
      width: cell.width,
      height: cell.height,
    });

    currentX += cell.width + gap;
    maxHeightInRow = Math.max(maxHeightInRow, cell.height);
  });

  return positions;
}

export function getWallSize(
  cells: Cell[],
  layout: Layout,
  gap: number = 0
): { width: number; height: number } {
  const positions = calculateCellPositions(cells, layout, gap);
  if (positions.length === 0) return { width: 0, height: 0 };

  let maxX = 0;
  let maxY = 0;

  positions.forEach(pos => {
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });

  return { width: maxX, height: maxY };
}

export function calculateScale(
  wallSize: { width: number; height: number },
  containerSize: { width: number; height: number },
  mode: 'contain' | 'cover' | 'original' | 'custom',
  customScale?: number
): number {
  if (containerSize.width === 0 || containerSize.height === 0) {
    return 1;
  }
  switch (mode) {
    case 'contain': {
      const scaleX = containerSize.width / wallSize.width;
      const scaleY = containerSize.height / wallSize.height;
      return Math.min(scaleX, scaleY);
    }
    case 'cover': {
      const scaleX = containerSize.width / wallSize.width;
      const scaleY = containerSize.height / wallSize.height;
      return Math.max(scaleX, scaleY);
    }
    case 'original':
      return 1;
    case 'custom':
      return customScale ?? 1;
  }
}

export function findCellAtPosition(
  x: number,
  y: number,
  cellPositions: CellPosition[]
): CellPosition | undefined {
  return cellPositions.find(
    pos => x >= pos.x && x <= pos.x + pos.width &&
           y >= pos.y && y <= pos.y + pos.height
  );
}