import { clampRectToBounds } from './math';
import {
  type DesktopSnapSettings,
  WINDOW_MANAGER_STATE_VERSION,
  type DesktopState,
  type Rect,
  type SerializationEnvelope,
  type WindowEntity,
  type WindowId,
  type WindowManagerState,
} from './types';

const DEFAULT_RECT: Rect = {
  x: 40,
  y: 40,
  width: 480,
  height: 320,
};

const DEFAULT_FLAGS = {
  resizable: true,
  movable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getDesktopRect(desktop: DesktopState): Rect {
  return {
    x: desktop.bounds.minX,
    y: desktop.bounds.minY,
    width: desktop.bounds.maxX - desktop.bounds.minX,
    height: desktop.bounds.maxY - desktop.bounds.minY,
  };
}

function clampDimension(value: number, min: number, max: number): number {
  const lowerBound = Math.min(min, max);
  return Math.max(lowerBound, Math.min(value, max));
}

function sanitizeDesktop(value: unknown): DesktopState | null {
  if (!isRecord(value) || !isRecord(value.size) || !isRecord(value.bounds)) {
    return null;
  }

  const width = value.size.width;
  const height = value.size.height;
  const minX = value.bounds.minX;
  const minY = value.bounds.minY;
  const maxX = value.bounds.maxX;
  const maxY = value.bounds.maxY;

  if (
    !isFiniteNumber(width) ||
    !isFiniteNumber(height) ||
    !isFiniteNumber(minX) ||
    !isFiniteNumber(minY) ||
    !isFiniteNumber(maxX) ||
    !isFiniteNumber(maxY) ||
    width <= 0 ||
    height <= 0 ||
    maxX <= minX ||
    maxY <= minY
  ) {
    return null;
  }

  const snap = sanitizeSnapSettings(value.snap);

  return {
    size: { width, height },
    bounds: { minX, minY, maxX, maxY },
    ...(snap ? { snap } : {}),
  };
}

function sanitizeSnapSettings(value: unknown): DesktopSnapSettings | null {
  if (!isRecord(value) || !isFiniteNumber(value.threshold) || value.threshold < 0) {
    return null;
  }

  return {
    threshold: value.threshold,
  };
}

function sanitizeRect(value: unknown, fallback: Rect, desktop: DesktopState): Rect {
  const baseRect = isRecord(value)
    ? {
        x: isFiniteNumber(value.x) ? value.x : fallback.x,
        y: isFiniteNumber(value.y) ? value.y : fallback.y,
        width: isFiniteNumber(value.width) ? value.width : fallback.width,
        height: isFiniteNumber(value.height) ? value.height : fallback.height,
      }
    : fallback;

  const maxWidth = desktop.bounds.maxX - desktop.bounds.minX;
  const maxHeight = desktop.bounds.maxY - desktop.bounds.minY;
  const safeRect = {
    ...baseRect,
    width: clampDimension(baseRect.width, 160, maxWidth),
    height: clampDimension(baseRect.height, 120, maxHeight),
  };

  return clampRectToBounds(safeRect, desktop.bounds);
}

function sanitizeWindow(id: WindowId, value: unknown, desktop: DesktopState): WindowEntity | null {
  if (!isRecord(value) || id.length === 0) {
    return null;
  }

  const parsedState = isRecord(value.state) ? value.state : {};
  const parsedFlags = isRecord(value.flags) ? value.flags : {};
  const baseRect = sanitizeRect(value.rect, DEFAULT_RECT, desktop);
  const restoreRect = sanitizeRect(value.restoreRect, baseRect, desktop);

  let closed = sanitizeBoolean(parsedState.closed, false);
  let minimized = sanitizeBoolean(parsedState.minimized, false);
  let maximized = sanitizeBoolean(parsedState.maximized, false);
  const flags = {
    resizable: sanitizeBoolean(parsedFlags.resizable, DEFAULT_FLAGS.resizable),
    movable: sanitizeBoolean(parsedFlags.movable, DEFAULT_FLAGS.movable),
    closable: sanitizeBoolean(parsedFlags.closable, DEFAULT_FLAGS.closable),
    minimizable: sanitizeBoolean(parsedFlags.minimizable, DEFAULT_FLAGS.minimizable),
    maximizable: sanitizeBoolean(parsedFlags.maximizable, DEFAULT_FLAGS.maximizable),
  };

  if (closed) {
    minimized = false;
    maximized = false;
  } else if (minimized) {
    maximized = false;
  }

  if (!flags.minimizable) {
    minimized = false;
  }

  if (!flags.maximizable) {
    maximized = false;
  }
  const title = sanitizeString(value.title);

  return {
    id,
    state: {
      minimized,
      maximized,
      closed,
    },
    rect: maximized
      ? getDesktopRect(desktop)
      : sanitizeRect(value.rect, restoreRect, desktop),
    restoreRect,
    flags,
    ...(title !== undefined ? { title } : {}),
  };
}

function findNextActiveId(state: WindowManagerState): WindowId | null {
  for (let index = state.orderedWindowIds.length - 1; index >= 0; index -= 1) {
    const id = state.orderedWindowIds[index];
    const windowEntity = state.windows[id];
    if (windowEntity && !windowEntity.state.closed && !windowEntity.state.minimized) {
      return id;
    }
  }

  return null;
}

export function sanitizeWindowManagerState(value: unknown): WindowManagerState | null {
  if (!isRecord(value)) {
    return null;
  }

  const desktop = sanitizeDesktop(value.desktop);
  const windowsInput = value.windows;

  if (!desktop || !isRecord(windowsInput)) {
    return null;
  }

  const windows: Record<WindowId, WindowEntity> = {};
  for (const [id, windowValue] of Object.entries(windowsInput)) {
    const sanitizedWindow = sanitizeWindow(id, windowValue, desktop);
    if (sanitizedWindow) {
      windows[id] = sanitizedWindow;
    }
  }

  const orderedWindowIds = new Set<WindowId>();
  const normalizedOrder: WindowId[] = [];
  if (Array.isArray(value.orderedWindowIds)) {
    for (const candidate of value.orderedWindowIds) {
      if (typeof candidate !== 'string' || orderedWindowIds.has(candidate) || !windows[candidate]) {
        continue;
      }

      orderedWindowIds.add(candidate);
      normalizedOrder.push(candidate);
    }
  }

  for (const id of Object.keys(windows)) {
    if (orderedWindowIds.has(id)) {
      continue;
    }

    orderedWindowIds.add(id);
    normalizedOrder.push(id);
  }

  let activeWindowId =
    typeof value.activeWindowId === 'string' &&
    windows[value.activeWindowId] &&
    !windows[value.activeWindowId].state.closed &&
    !windows[value.activeWindowId].state.minimized
      ? value.activeWindowId
      : null;

  if (!activeWindowId) {
    activeWindowId = findNextActiveId({
      version: WINDOW_MANAGER_STATE_VERSION,
      windows,
      orderedWindowIds: normalizedOrder,
      activeWindowId: null,
      desktop,
    });
  }

  if (activeWindowId) {
    const remainingIds = normalizedOrder.filter((id) => id !== activeWindowId);
    normalizedOrder.splice(0, normalizedOrder.length, ...remainingIds, activeWindowId);
  }

  return {
    version: WINDOW_MANAGER_STATE_VERSION,
    windows,
    orderedWindowIds: normalizedOrder,
    activeWindowId,
    desktop,
  };
}

export function serializeState(state: WindowManagerState): string {
  const envelope: SerializationEnvelope = {
    version: WINDOW_MANAGER_STATE_VERSION,
    state,
  };

  return JSON.stringify(envelope);
}

export function hydrateState(raw: string): WindowManagerState | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed) || parsed.version !== WINDOW_MANAGER_STATE_VERSION) {
      return null;
    }

    return sanitizeWindowManagerState(parsed.state);
  } catch {
    return null;
  }
}
