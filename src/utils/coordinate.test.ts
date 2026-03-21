import { describe, expect, it } from 'vitest';
import {
  logicalToScreen,
  screenToLogical,
  isPointInRect,
  doRectsOverlap,
  getRectCenter,
} from './coordinate';

describe('coordinate', () => {
  describe('logicalToScreen', () => {
    it('converts logical coordinates to screen coordinates', () => {
      const point = { x: 100, y: 200 };
      const scale = 0.5;
      const result = logicalToScreen(point, scale);
      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
    });
  });

  describe('screenToLogical', () => {
    it('converts screen coordinates to logical coordinates', () => {
      const point = { x: 50, y: 100 };
      const scale = 0.5;
      const result = screenToLogical(point, scale);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });
  });

  describe('isPointInRect', () => {
    it('returns true when point is inside rect', () => {
      const point = { x: 50, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(isPointInRect(point, rect)).toBe(true);
    });

    it('returns false when point is outside rect', () => {
      const point = { x: 150, y: 150 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(isPointInRect(point, rect)).toBe(false);
    });
  });

  describe('doRectsOverlap', () => {
    it('returns true for overlapping rects', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 25, y: 25, width: 50, height: 50 };
      expect(doRectsOverlap(rect1, rect2)).toBe(true);
    });

    it('returns false for non-overlapping rects', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 100, y: 100, width: 50, height: 50 };
      expect(doRectsOverlap(rect1, rect2)).toBe(false);
    });
  });

  describe('getRectCenter', () => {
    it('calculates center correctly', () => {
      const rect = { x: 0, y: 0, width: 100, height: 200 };
      const center = getRectCenter(rect);
      expect(center.x).toBe(50);
      expect(center.y).toBe(100);
    });
  });
});
