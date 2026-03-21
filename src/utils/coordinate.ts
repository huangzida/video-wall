export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export function logicalToScreenPoint(point: Point, scale: number): Point {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

export function logicalToScreenSize(size: Size, scale: number): Size {
  return {
    width: size.width * scale,
    height: size.height * scale,
  };
}

export function screenToLogicalPoint(point: Point, scale: number): Point {
  return {
    x: point.x / scale,
    y: point.y / scale,
  };
}

export function screenToLogicalSize(size: Size, scale: number): Size {
  return {
    width: size.width / scale,
    height: size.height / scale,
  };
}

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function doRectsOverlap(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}
