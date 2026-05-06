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

function getClampedRightX(bounds: Bounds, width: number): number {
  return Math.max(bounds.minX, bounds.maxX - width);
}

function getClampedBottomY(bounds: Bounds, height: number): number {
  return Math.max(bounds.minY, bounds.maxY - height);
}

export function snapRectToBounds(
  rect: Rect,
  bounds: Bounds,
  threshold: number,
): Rect {
  if (threshold <= 0) {
    return rect;
  }

  const leftTarget = bounds.minX;
  const rightTarget = getClampedRightX(bounds, rect.width);
  const topTarget = bounds.minY;
  const bottomTarget = getClampedBottomY(bounds, rect.height);
  const leftDistance = Math.abs(rect.x - leftTarget);
  const rightDistance = Math.abs(rect.x - rightTarget);
  const topDistance = Math.abs(rect.y - topTarget);
  const bottomDistance = Math.abs(rect.y - bottomTarget);

  return {
    ...rect,
    x:
      leftDistance <= threshold && leftDistance <= rightDistance
        ? leftTarget
        : rightDistance <= threshold
          ? rightTarget
          : rect.x,
    y:
      topDistance <= threshold && topDistance <= bottomDistance
        ? topTarget
        : bottomDistance <= threshold
          ? bottomTarget
          : rect.y,
  };
}

function fitDimension(value: number, min: number, max: number): number {
  const lowerBound = Math.min(min, max);
  return Math.max(lowerBound, Math.min(value, max));
}

export function fitRectToBounds(rect: Rect, bounds: Bounds): Rect {
  const maxWidth = bounds.maxX - bounds.minX;
  const maxHeight = bounds.maxY - bounds.minY;
  const sizedRect = {
    ...rect,
    width: fitDimension(rect.width, MIN_WIDTH, maxWidth),
    height: fitDimension(rect.height, MIN_HEIGHT, maxHeight),
  };

  return clampRectToBounds(sizedRect, bounds);
}

export function fitResizedRectToBounds(
  rect: Rect,
  bounds: Bounds,
  edge: ResizeEdge,
): Rect {
  const maxWidth = bounds.maxX - bounds.minX;
  const maxHeight = bounds.maxY - bounds.minY;
  const nextRect: Rect = { ...rect };

  if (edge.includes('left')) {
    const right = Math.min(bounds.maxX, rect.x + rect.width);
    const x = Math.max(bounds.minX, rect.x);
    nextRect.x = x;
    nextRect.width = Math.min(Math.max(right - x, 0), maxWidth);
  } else if (edge.includes('right')) {
    const x = Math.max(bounds.minX, rect.x);
    const right = Math.min(bounds.maxX, rect.x + rect.width);
    nextRect.x = Math.min(x, right);
    nextRect.width = Math.min(Math.max(right - nextRect.x, 0), maxWidth);
  } else {
    nextRect.width = Math.min(nextRect.width, maxWidth);
  }

  if (edge.includes('top')) {
    const bottom = Math.min(bounds.maxY, rect.y + rect.height);
    const y = Math.max(bounds.minY, rect.y);
    nextRect.y = y;
    nextRect.height = Math.min(Math.max(bottom - y, 0), maxHeight);
  } else if (edge.includes('bottom')) {
    const y = Math.max(bounds.minY, rect.y);
    const bottom = Math.min(bounds.maxY, rect.y + rect.height);
    nextRect.y = Math.min(y, bottom);
    nextRect.height = Math.min(Math.max(bottom - nextRect.y, 0), maxHeight);
  } else {
    nextRect.height = Math.min(nextRect.height, maxHeight);
  }

  return clampRectToBounds(nextRect, bounds);
}

export function snapResizedRectToBounds(
  rect: Rect,
  bounds: Bounds,
  edge: ResizeEdge,
  threshold: number,
): Rect {
  if (threshold <= 0) {
    return rect;
  }

  const nextRect: Rect = { ...rect };
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  if (edge.includes('left') && Math.abs(rect.x - bounds.minX) <= threshold) {
    nextRect.width = right - bounds.minX;
    nextRect.x = bounds.minX;
  }

  if (edge.includes('right') && Math.abs(right - bounds.maxX) <= threshold) {
    nextRect.width = bounds.maxX - nextRect.x;
  }

  if (edge.includes('top') && Math.abs(rect.y - bounds.minY) <= threshold) {
    nextRect.height = bottom - bounds.minY;
    nextRect.y = bounds.minY;
  }

  if (edge.includes('bottom') && Math.abs(bottom - bounds.maxY) <= threshold) {
    nextRect.height = bounds.maxY - nextRect.y;
  }

  return nextRect;
}

export function resizeRect(
  rect: Rect,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
): Rect {
  const nextRect: Rect = { ...rect };

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
