import { clampRectToBounds } from './math';
import {
  DEFAULT_DESKTOP_ID,
  DEFAULT_MONITOR_ID,
  type DesktopId,
  type DesktopSnapSettings,
  WINDOW_MANAGER_STATE_VERSION,
  type DesktopWorkspace,
  type MonitorId,
  type MonitorState,
  type Rect,
  type SerializationEnvelope,
  type WindowEntity,
  type WindowId,
  type WindowManagerState,
} from './types';

const LEGACY_WINDOW_MANAGER_STATE_VERSION = 1;
const MULTI_DESKTOP_WINDOW_MANAGER_STATE_VERSION = 2;
const MULTI_MONITOR_WINDOW_MANAGER_STATE_VERSION = 3;

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

interface LegacyWindowManagerState {
  version: number;
  windows: Record<WindowId, unknown>;
  orderedWindowIds: unknown;
  activeWindowId: unknown;
  desktop: unknown;
}

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

function getMonitorRect(monitor: MonitorState): Rect {
  return {
    x: monitor.bounds.minX,
    y: monitor.bounds.minY,
    width: monitor.bounds.maxX - monitor.bounds.minX,
    height: monitor.bounds.maxY - monitor.bounds.minY,
  };
}

function isWindowFocusable(windowEntity: WindowEntity | undefined): windowEntity is WindowEntity {
  return !!windowEntity && !windowEntity.state.closed && !windowEntity.state.minimized;
}

function clampDimension(value: number, min: number, max: number): number {
  const lowerBound = Math.min(min, max);
  return Math.max(lowerBound, Math.min(value, max));
}

function sanitizeMonitor(value: unknown): MonitorState | null {
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

function sanitizeRect(value: unknown, fallback: Rect, monitor: MonitorState): Rect {
  const baseRect = isRecord(value)
    ? {
        x: isFiniteNumber(value.x) ? value.x : fallback.x,
        y: isFiniteNumber(value.y) ? value.y : fallback.y,
        width: isFiniteNumber(value.width) ? value.width : fallback.width,
        height: isFiniteNumber(value.height) ? value.height : fallback.height,
      }
    : fallback;

  const maxWidth = monitor.bounds.maxX - monitor.bounds.minX;
  const maxHeight = monitor.bounds.maxY - monitor.bounds.minY;
  const safeRect = {
    ...baseRect,
    width: clampDimension(baseRect.width, 160, maxWidth),
    height: clampDimension(baseRect.height, 120, maxHeight),
  };

  return clampRectToBounds(safeRect, monitor.bounds);
}

function sanitizeWindow(
  id: WindowId,
  value: unknown,
  desktopId: DesktopId,
  monitorId: MonitorId,
  monitor: MonitorState,
): WindowEntity | null {
  if (!isRecord(value) || id.length === 0) {
    return null;
  }

  const parsedState = isRecord(value.state) ? value.state : {};
  const parsedFlags = isRecord(value.flags) ? value.flags : {};
  const baseRect = sanitizeRect(value.rect, DEFAULT_RECT, monitor);
  const restoreRect = sanitizeRect(value.restoreRect, baseRect, monitor);

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
    desktopId,
    monitorId,
    ...(typeof value.ownerWindowId === 'string' ? { ownerWindowId: value.ownerWindowId } : {}),
    state: {
      minimized,
      maximized,
      closed,
    },
    rect: maximized ? getMonitorRect(monitor) : sanitizeRect(value.rect, restoreRect, monitor),
    restoreRect,
    flags,
    ...(title !== undefined ? { title } : {}),
  };
}

function getTopModalId(
  orderedWindowIds: WindowId[],
  windows: Record<WindowId, WindowEntity>,
  desktopId?: DesktopId,
): WindowId | null {
  for (let index = orderedWindowIds.length - 1; index >= 0; index -= 1) {
    const id = orderedWindowIds[index];
    const windowEntity = windows[id];
    if (
      isWindowFocusable(windowEntity) &&
      !!windowEntity.ownerWindowId &&
      (desktopId === undefined || windowEntity.desktopId === desktopId)
    ) {
      return id;
    }
  }

  return null;
}

function findNextActiveId(orderedWindowIds: WindowId[], windows: Record<WindowId, WindowEntity>): WindowId | null {
  const topModalId = getTopModalId(orderedWindowIds, windows);
  if (topModalId) {
    return topModalId;
  }

  for (let index = orderedWindowIds.length - 1; index >= 0; index -= 1) {
    const id = orderedWindowIds[index];
    const windowEntity = windows[id];
    if (isWindowFocusable(windowEntity)) {
      return id;
    }
  }

  return null;
}

function hasOwnerCycle(windowId: WindowId, windows: Record<WindowId, WindowEntity>): boolean {
  const seen = new Set<WindowId>();
  let current: WindowEntity | undefined = windows[windowId];

  while (current?.ownerWindowId) {
    if (seen.has(current.ownerWindowId)) {
      return true;
    }

    seen.add(current.ownerWindowId);
    if (current.ownerWindowId === windowId) {
      return true;
    }

    current = windows[current.ownerWindowId];
    if (!current) {
      return false;
    }
  }

  return false;
}

function enforceModalOwnerOrder(
  orderedWindowIds: WindowId[],
  windows: Record<WindowId, WindowEntity>,
): WindowId[] {
  const nextOrder = [...orderedWindowIds];
  let changed = true;

  while (changed) {
    changed = false;

    for (const windowId of [...nextOrder]) {
      const windowEntity = windows[windowId];
      if (!windowEntity?.ownerWindowId) {
        continue;
      }

      const currentIndex = nextOrder.indexOf(windowId);
      const ownerIndex = nextOrder.indexOf(windowEntity.ownerWindowId);
      if (currentIndex === -1 || ownerIndex === -1 || currentIndex > ownerIndex) {
        continue;
      }

      nextOrder.splice(currentIndex, 1);
      nextOrder.splice(ownerIndex + 1, 0, windowId);
      changed = true;
    }
  }

  return nextOrder;
}

function sanitizeDesktopWorkspace(id: DesktopId, value: unknown): DesktopWorkspace | null {
  if (!isRecord(value) || !isRecord(value.monitors)) {
    return null;
  }

  const monitors: Record<MonitorId, MonitorState> = {};
  for (const [monitorId, monitorValue] of Object.entries(value.monitors)) {
    const monitor = sanitizeMonitor(monitorValue);
    if (monitor) {
      monitors[monitorId] = monitor;
    }
  }

  if (Object.keys(monitors).length === 0) {
    return null;
  }

  const activeMonitorId =
    typeof value.activeMonitorId === 'string' && monitors[value.activeMonitorId]
      ? value.activeMonitorId
      : (Object.keys(monitors)[0] ?? DEFAULT_MONITOR_ID);

  return {
    id,
    monitors,
    activeMonitorId,
    orderedWindowIds: Array.isArray(value.orderedWindowIds)
      ? value.orderedWindowIds.filter((candidate): candidate is WindowId => typeof candidate === 'string')
      : [],
    activeWindowId: typeof value.activeWindowId === 'string' ? value.activeWindowId : null,
  };
}

export function sanitizeWindowManagerState(value: unknown): WindowManagerState | null {
  if (!isRecord(value) || !isRecord(value.desktops)) {
    return null;
  }

  const desktops: Record<DesktopId, DesktopWorkspace> = {};
  for (const [desktopId, desktopValue] of Object.entries(value.desktops)) {
    const workspace = sanitizeDesktopWorkspace(desktopId, desktopValue);
    if (workspace) {
      desktops[desktopId] = workspace;
    }
  }

  if (Object.keys(desktops).length === 0) {
    return null;
  }

  const activeDesktopId =
    typeof value.activeDesktopId === 'string' && desktops[value.activeDesktopId]
      ? value.activeDesktopId
      : (Object.keys(desktops)[0] ?? DEFAULT_DESKTOP_ID);

  const windowsInput = value.windows;
  if (!isRecord(windowsInput)) {
    return null;
  }

  const windows: Record<WindowId, WindowEntity> = {};
  for (const [id, windowValue] of Object.entries(windowsInput)) {
    if (!isRecord(windowValue)) {
      continue;
    }

    const parsedDesktopId =
      typeof windowValue.desktopId === 'string' && desktops[windowValue.desktopId]
        ? windowValue.desktopId
        : activeDesktopId;
    const workspace = desktops[parsedDesktopId];
    if (!workspace) {
      continue;
    }

    const parsedMonitorId =
      typeof windowValue.monitorId === 'string' && workspace.monitors[windowValue.monitorId]
        ? windowValue.monitorId
        : workspace.activeMonitorId;
    const monitor = workspace.monitors[parsedMonitorId];
    if (!monitor) {
      continue;
    }

    const sanitizedWindow = sanitizeWindow(id, windowValue, parsedDesktopId, parsedMonitorId, monitor);
    if (sanitizedWindow) {
      windows[id] = sanitizedWindow;
    }
  }

  const normalizedWindows: Record<WindowId, WindowEntity> = {};
  for (const [windowId, windowEntity] of Object.entries(windows)) {
    const ownerWindowId = windowEntity.ownerWindowId;
    if (!ownerWindowId) {
      normalizedWindows[windowId] = windowEntity;
      continue;
    }

    const ownerWindow = windows[ownerWindowId];
    if (!ownerWindow || hasOwnerCycle(windowId, windows)) {
      const { ownerWindowId: _ownerWindowId, ...windowWithoutOwner } = windowEntity;
      normalizedWindows[windowId] = windowWithoutOwner;
      continue;
    }

    const ownerWorkspace = desktops[ownerWindow.desktopId];
    const ownerMonitor = ownerWorkspace?.monitors[ownerWindow.monitorId];
    if (!ownerWorkspace || !ownerMonitor) {
      const { ownerWindowId: _ownerWindowId, ...windowWithoutOwner } = windowEntity;
      normalizedWindows[windowId] = windowWithoutOwner;
      continue;
    }

    normalizedWindows[windowId] = {
      ...windowEntity,
      desktopId: ownerWindow.desktopId,
      monitorId: ownerWindow.monitorId,
      rect: windowEntity.state.maximized
        ? getMonitorRect(ownerMonitor)
        : sanitizeRect(windowEntity.rect, windowEntity.restoreRect, ownerMonitor),
      restoreRect: sanitizeRect(windowEntity.restoreRect, windowEntity.restoreRect, ownerMonitor),
      ownerWindowId,
    };
  }

  const normalizedDesktops: Record<DesktopId, DesktopWorkspace> = {};
  for (const [desktopId, workspace] of Object.entries(desktops)) {
    const seen = new Set<WindowId>();
    const orderedWindowIds: WindowId[] = [];

    for (const candidate of workspace.orderedWindowIds) {
      const windowEntity = normalizedWindows[candidate];
      if (!windowEntity || windowEntity.desktopId !== desktopId || seen.has(candidate)) {
        continue;
      }

      seen.add(candidate);
      orderedWindowIds.push(candidate);
    }

    for (const [windowId, windowEntity] of Object.entries(normalizedWindows)) {
      if (windowEntity.desktopId !== desktopId || seen.has(windowId)) {
        continue;
      }

      seen.add(windowId);
      orderedWindowIds.push(windowId);
    }

    const normalizedOrder = enforceModalOwnerOrder(orderedWindowIds, normalizedWindows);
    const topModalId = getTopModalId(normalizedOrder, normalizedWindows, desktopId);
    const activeWindowId =
      workspace.activeWindowId &&
      normalizedWindows[workspace.activeWindowId] &&
      normalizedWindows[workspace.activeWindowId].desktopId === desktopId &&
      isWindowFocusable(normalizedWindows[workspace.activeWindowId]) &&
      (!topModalId || workspace.activeWindowId === topModalId)
        ? workspace.activeWindowId
        : findNextActiveId(normalizedOrder, normalizedWindows);
    const activeMonitorId =
      activeWindowId &&
      normalizedWindows[activeWindowId] &&
      workspace.monitors[normalizedWindows[activeWindowId].monitorId]
        ? normalizedWindows[activeWindowId].monitorId
        : workspace.monitors[workspace.activeMonitorId]
          ? workspace.activeMonitorId
          : (Object.keys(workspace.monitors)[0] ?? DEFAULT_MONITOR_ID);

    normalizedDesktops[desktopId] = {
      ...workspace,
      activeMonitorId,
      orderedWindowIds: normalizedOrder,
      activeWindowId,
    };
  }

  return {
    version: WINDOW_MANAGER_STATE_VERSION,
    windows: normalizedWindows,
    desktops: normalizedDesktops,
    activeDesktopId,
  };
}

function migrateVersionTwoState(value: unknown): WindowManagerState | null {
  if (!isRecord(value) || !isRecord(value.desktops) || !isRecord(value.windows)) {
    return null;
  }

  const migratedDesktops: Record<DesktopId, unknown> = {};
  for (const [desktopId, workspaceValue] of Object.entries(value.desktops)) {
    if (!isRecord(workspaceValue)) {
      continue;
    }

    migratedDesktops[desktopId] = {
      id: desktopId,
      monitors: {
        [DEFAULT_MONITOR_ID]: workspaceValue.desktop,
      },
      activeMonitorId: DEFAULT_MONITOR_ID,
      orderedWindowIds: workspaceValue.orderedWindowIds,
      activeWindowId: workspaceValue.activeWindowId,
    };
  }

  const migratedWindows: Record<WindowId, unknown> = {};
  for (const [windowId, windowValue] of Object.entries(value.windows)) {
    if (!isRecord(windowValue)) {
      continue;
    }

    migratedWindows[windowId] = {
      ...windowValue,
      monitorId: DEFAULT_MONITOR_ID,
    };
  }

  return sanitizeWindowManagerState({
    version: WINDOW_MANAGER_STATE_VERSION,
    desktops: migratedDesktops,
    windows: migratedWindows,
    activeDesktopId: value.activeDesktopId,
  });
}

function sanitizeLegacyWindowManagerState(value: unknown): WindowManagerState | null {
  if (!isRecord(value)) {
    return null;
  }

  const legacyState = value as unknown as LegacyWindowManagerState;
  const monitor = sanitizeMonitor(legacyState.desktop);
  const windowsInput = legacyState.windows;

  if (!monitor || !isRecord(windowsInput)) {
    return null;
  }

  const windows: Record<WindowId, WindowEntity> = {};
  for (const [id, windowValue] of Object.entries(windowsInput)) {
    const sanitizedWindow = sanitizeWindow(id, windowValue, DEFAULT_DESKTOP_ID, DEFAULT_MONITOR_ID, monitor);
    if (sanitizedWindow) {
      windows[id] = sanitizedWindow;
    }
  }

  const seen = new Set<WindowId>();
  const orderedWindowIds: WindowId[] = [];
  if (Array.isArray(legacyState.orderedWindowIds)) {
    for (const candidate of legacyState.orderedWindowIds) {
      if (typeof candidate !== 'string' || seen.has(candidate) || !windows[candidate]) {
        continue;
      }

      seen.add(candidate);
      orderedWindowIds.push(candidate);
    }
  }

  for (const id of Object.keys(windows)) {
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    orderedWindowIds.push(id);
  }

  let activeWindowId =
    typeof legacyState.activeWindowId === 'string' &&
    windows[legacyState.activeWindowId] &&
    isWindowFocusable(windows[legacyState.activeWindowId])
      ? legacyState.activeWindowId
      : null;

  if (!activeWindowId) {
    activeWindowId = findNextActiveId(orderedWindowIds, windows);
  }

  if (activeWindowId) {
    const remainingIds = orderedWindowIds.filter((id) => id !== activeWindowId);
    orderedWindowIds.splice(0, orderedWindowIds.length, ...remainingIds, activeWindowId);
  }

  return {
    version: WINDOW_MANAGER_STATE_VERSION,
    windows,
    desktops: {
      [DEFAULT_DESKTOP_ID]: {
        id: DEFAULT_DESKTOP_ID,
        monitors: {
          [DEFAULT_MONITOR_ID]: monitor,
        },
        activeMonitorId: DEFAULT_MONITOR_ID,
        orderedWindowIds,
        activeWindowId,
      },
    },
    activeDesktopId: DEFAULT_DESKTOP_ID,
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

    if (!isRecord(parsed)) {
      return null;
    }

    if (parsed.version === WINDOW_MANAGER_STATE_VERSION) {
      return sanitizeWindowManagerState(parsed.state);
    }

    if (parsed.version === MULTI_DESKTOP_WINDOW_MANAGER_STATE_VERSION) {
      return migrateVersionTwoState(parsed.state);
    }

    if (parsed.version === MULTI_MONITOR_WINDOW_MANAGER_STATE_VERSION) {
      return sanitizeWindowManagerState(parsed.state);
    }

    if (parsed.version === LEGACY_WINDOW_MANAGER_STATE_VERSION) {
      return sanitizeLegacyWindowManagerState(parsed.state);
    }

    return null;
  } catch {
    return null;
  }
}
