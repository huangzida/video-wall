export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export function scaleRectByBasis(rect: Rect, basis: Size, current: Size): Rect {
  const sx = current.width / basis.width;
  const sy = current.height / basis.height;
  return {
    x: rect.x * sx,
    y: rect.y * sy,
    width: rect.width * sx,
    height: rect.height * sy,
  };
}
