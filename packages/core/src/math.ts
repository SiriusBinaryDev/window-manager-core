import type { Bounds, Rect, ResizeEdge } from './types';

const MIN_WIDTH = 160;
const MIN_HEIGHT = 120;

export function moveRect(rect: Rect, deltaX: number, deltaY: number): Rect {
  return {
    ...rect,
    x: rect.x + deltaX,
    y: rect.y + deltaY,
  };
}

export function enforceMinSize(
  rect: Rect,
  minWidth: number = MIN_WIDTH,
  minHeight: number = MIN_HEIGHT,
): Rect {
  return {
    ...rect,
    width: Math.max(rect.width, minWidth),
    height: Math.max(rect.height, minHeight),
  };
}

export function clampRectToBounds(rect: Rect, bounds: Bounds): Rect {
  const maxX = Math.max(bounds.minX, bounds.maxX - rect.width);
  const maxY = Math.max(bounds.minY, bounds.maxY - rect.height);

  return {
    ...rect,
    x: Math.max(bounds.minX, Math.min(rect.x, maxX)),
    y: Math.max(bounds.minY, Math.min(rect.y, maxY)),
  };
}

export function resizeRect(
  rect: Rect,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
): Rect {
  let nextRect: Rect = { ...rect };

  if (edge.includes('right')) {
    nextRect.width += deltaX;
  }
  if (edge.includes('left')) {
    nextRect.x += deltaX;
    nextRect.width -= deltaX;
  }
  if (edge.includes('bottom')) {
    nextRect.height += deltaY;
  }
  if (edge.includes('top')) {
    nextRect.y += deltaY;
    nextRect.height -= deltaY;
  }

  const minSized = enforceMinSize(nextRect);

  if (minSized.width !== nextRect.width && edge.includes('left')) {
    minSized.x = rect.x + (rect.width - minSized.width);
  }
  if (minSized.height !== nextRect.height && edge.includes('top')) {
    minSized.y = rect.y + (rect.height - minSized.height);
  }

  return minSized;
}
