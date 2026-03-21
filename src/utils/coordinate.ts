export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export function logicalToScreen(
  logical: Point | Size,
  scale: number
): Point | Size {
  return {
    x: 'x' in logical ? logical.x * scale : undefined,
    y: 'y' in logical ? logical.y * scale : undefined,
    width: 'width' in logical ? logical.width * scale : undefined,
    height: 'height' in logical ? logical.height * scale : undefined,
  } as Point | Size;
}

export function screenToLogical(
  screen: Point | Size,
  scale: number
): Point | Size {
  return {
    x: 'x' in screen ? screen.x / scale : undefined,
    y: 'y' in screen ? screen.y / scale : undefined,
    width: 'width' in screen ? screen.width / scale : undefined,
    height: 'height' in screen ? screen.height / scale : undefined,
  } as Point | Size;
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
