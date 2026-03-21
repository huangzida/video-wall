import { describe, expect, it } from 'vitest';
import {
  calculateCellPositions,
  getWallSize,
  calculateScale,
  findCellAtPosition,
} from './layout';
import type { Cell, Layout } from '../types';

describe('layout', () => {
  const cells: Cell[] = [
    { id: '0', width: 1920, height: 1080 },
    { id: '1', width: 1920, height: 1080 },
    { id: '2', width: 1920, height: 1080 },
    { id: '3', width: 1920, height: 1080 },
    { id: '4', width: 1920, height: 1080 },
    { id: '5', width: 1920, height: 1080 },
  ];
  const layout: Layout = { rows: 2, cols: 3 };

  describe('calculateCellPositions', () => {
    it('positions cells in correct order', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      
      expect(positions[0]).toEqual({ cellId: '0', x: 0, y: 0, width: 1920, height: 1080 });
      expect(positions[1]).toEqual({ cellId: '1', x: 1920, y: 0, width: 1920, height: 1080 });
      expect(positions[2]).toEqual({ cellId: '2', x: 3840, y: 0, width: 1920, height: 1080 });
      expect(positions[3]).toEqual({ cellId: '3', x: 0, y: 1080, width: 1920, height: 1080 });
      expect(positions[4]).toEqual({ cellId: '4', x: 1920, y: 1080, width: 1920, height: 1080 });
      expect(positions[5]).toEqual({ cellId: '5', x: 3840, y: 1080, width: 1920, height: 1080 });
    });

    it('applies gap between cells', () => {
      const positions = calculateCellPositions(cells, layout, 10);
      
      expect(positions[1].x).toBe(1930);
      expect(positions[3].y).toBe(1090);
    });
  });

  describe('getWallSize', () => {
    it('calculates total wall dimensions', () => {
      const size = getWallSize(cells, layout, 0);
      expect(size.width).toBe(5760);
      expect(size.height).toBe(2160);
    });
  });

  describe('calculateScale', () => {
    it('calculates contain scale correctly', () => {
      const wallSize = { width: 5760, height: 2160 };
      const containerSize = { width: 1920, height: 1080 };
      const scale = calculateScale(wallSize, containerSize, 'contain');
      expect(scale).toBeCloseTo(0.3333);
    });

    it('calculates cover scale correctly', () => {
      const wallSize = { width: 5760, height: 2160 };
      const containerSize = { width: 1920, height: 1080 };
      const scale = calculateScale(wallSize, containerSize, 'cover');
      expect(scale).toBeCloseTo(0.5);
    });
  });

  describe('findCellAtPosition', () => {
    it('finds cell at given position', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      const found = findCellAtPosition(1000, 500, positions);
      expect(found?.cellId).toBe('0');
    });

    it('returns undefined for position outside cells', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      const found = findCellAtPosition(6000, 1000, positions);
      expect(found).toBeUndefined();
    });
  });
});