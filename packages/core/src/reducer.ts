import {
  fitRectToBounds,
  fitResizedRectToBounds,
  moveRect,
  resizeRect,
  snapRectToBounds,
  snapResizedRectToBounds,
} from './math';
import { sanitizeWindowManagerState } from './serialization';
import type {
  DesktopId,
  DesktopWorkspace,
  MonitorId,
  MonitorState,
  Rect,
  WindowEntity,
  WindowId,
  WindowManagerCommand,
  WindowManagerState,
} from './types';
import {
  DEFAULT_DESKTOP_ID,
  DEFAULT_MONITOR_ID,
  WINDOW_MANAGER_STATE_VERSION,
} from './types';

const DEFAULT_RECT: Rect = {
  x: 40,
  y: 40,
  width: 480,
  height: 320,
};

const DEFAULT_MONITOR: MonitorState = {
  size: { width: 1280, height: 720 },
  bounds: { minX: 0, minY: 0, maxX: 1280, maxY: 720 },
};

const DEFAULT_FLAGS = {
  resizable: true,
  movable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
};

function createDesktopWorkspace(
  id: DesktopId,
  monitor: MonitorState = DEFAULT_MONITOR,
): DesktopWorkspace {
  return {
    id,
    monitors: {
      [DEFAULT_MONITOR_ID]: monitor,
    },
    activeMonitorId: DEFAULT_MONITOR_ID,
    orderedWindowIds: [],
    activeWindowId: null,
  };
}

function getDesktopWorkspace(
  state: WindowManagerState,
  desktopId: DesktopId,
): DesktopWorkspace | null {
  return state.desktops[desktopId] ?? null;
}

function getMonitorState(
  workspace: DesktopWorkspace,
  monitorId: MonitorId,
): MonitorState | null {
  return workspace.monitors[monitorId] ?? null;
}

function getFallbackMonitorId(workspace: DesktopWorkspace): MonitorId {
  return workspace.monitors[workspace.activeMonitorId]
    ? workspace.activeMonitorId
    : (Object.keys(workspace.monitors)[0] ?? DEFAULT_MONITOR_ID);
}

function resolveMonitorId(
  workspace: DesktopWorkspace,
  monitorId?: MonitorId,
): MonitorId | null {
  const targetId = monitorId ?? workspace.activeMonitorId;
  if (workspace.monitors[targetId]) {
    return targetId;
  }

  return null;
}

function getMonitorRect(monitor: MonitorState): Rect {
  return {
    x: monitor.bounds.minX,
    y: monitor.bounds.minY,
    width: monitor.bounds.maxX - monitor.bounds.minX,
    height: monitor.bounds.maxY - monitor.bounds.minY,
  };
}

function getSnapThreshold(monitor: MonitorState): number {
  return monitor.snap?.threshold ?? 0;
}

function isWindowVisible(
  windowEntity: WindowEntity | undefined,
): windowEntity is WindowEntity {
  return (
    !!windowEntity &&
    !windowEntity.state.closed &&
    !windowEntity.state.minimized
  );
}

function getOpenModalWindow(
  state: WindowManagerState,
  desktopId: DesktopId,
): WindowEntity | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  for (
    let index = workspace.orderedWindowIds.length - 1;
    index >= 0;
    index -= 1
  ) {
    const id = workspace.orderedWindowIds[index];
    const windowEntity = state.windows[id];
    if (
      isWindowVisible(windowEntity) &&
      windowEntity.desktopId === desktopId &&
      !!windowEntity.ownerWindowId
    ) {
      return windowEntity;
    }
  }

  return null;
}

function resolveFocusableWindow(
  state: WindowManagerState,
  windowEntity: WindowEntity | undefined,
): WindowEntity | null {
  if (!isWindowVisible(windowEntity)) {
    return null;
  }

  const openModalWindow = getOpenModalWindow(state, windowEntity.desktopId);
  if (!openModalWindow) {
    return windowEntity;
  }

  return openModalWindow.id === windowEntity.id
    ? windowEntity
    : openModalWindow;
}

function getModalDescendantIds(
  state: WindowManagerState,
  ownerWindowId: WindowId,
): WindowId[] {
  const descendants: WindowId[] = [];
  const stack = [ownerWindowId];

  while (stack.length > 0) {
    const currentOwnerId = stack.pop()!;
    for (const windowEntity of Object.values(state.windows)) {
      if (windowEntity.ownerWindowId !== currentOwnerId) {
        continue;
      }

      descendants.push(windowEntity.id);
      stack.push(windowEntity.id);
    }
  }

  return descendants;
}

function findNextActiveId(
  state: WindowManagerState,
  desktopId: DesktopId,
): WindowId | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  for (
    let index = workspace.orderedWindowIds.length - 1;
    index >= 0;
    index -= 1
  ) {
    const id = workspace.orderedWindowIds[index];
    const windowEntity = state.windows[id];
    if (isWindowVisible(windowEntity) && windowEntity.desktopId === desktopId) {
      const focusTarget = resolveFocusableWindow(state, windowEntity);
      return focusTarget?.id ?? null;
    }
  }

  return null;
}

function rectEquals(left: Rect, right: Rect): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

function monitorEquals(left: MonitorState, right: MonitorState): boolean {
  return (
    left.size.width === right.size.width &&
    left.size.height === right.size.height &&
    left.bounds.minX === right.bounds.minX &&
    left.bounds.minY === right.bounds.minY &&
    left.bounds.maxX === right.bounds.maxX &&
    left.bounds.maxY === right.bounds.maxY &&
    (left.snap?.threshold ?? null) === (right.snap?.threshold ?? null)
  );
}

function bringToFront(orderedWindowIds: WindowId[], id: WindowId): WindowId[] {
  if (orderedWindowIds[orderedWindowIds.length - 1] === id) {
    return orderedWindowIds;
  }

  const rest = orderedWindowIds.filter((windowId) => windowId !== id);
  return [...rest, id];
}

function getVisibleWindowIds(
  state: WindowManagerState,
  desktopId: DesktopId,
  monitorId?: MonitorId,
): WindowId[] {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return [];
  }

  return workspace.orderedWindowIds.filter((id) => {
    const windowEntity = state.windows[id];
    return (
      isWindowVisible(windowEntity) &&
      resolveFocusableWindow(state, windowEntity)?.id === windowEntity.id &&
      windowEntity.desktopId === desktopId &&
      (monitorId === undefined || windowEntity.monitorId === monitorId)
    );
  });
}

function getResolvedActiveMonitorId(
  state: WindowManagerState,
  desktopId: DesktopId,
  activeWindowId: WindowId | null,
): MonitorId | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  if (activeWindowId) {
    const activeWindow = state.windows[activeWindowId];
    if (
      activeWindow &&
      activeWindow.desktopId === desktopId &&
      workspace.monitors[activeWindow.monitorId]
    ) {
      return activeWindow.monitorId;
    }
  }

  return getFallbackMonitorId(workspace);
}

function patchWorkspace(
  state: WindowManagerState,
  desktopId: DesktopId,
  updater: (workspace: DesktopWorkspace) => DesktopWorkspace,
): WindowManagerState {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return state;
  }

  const nextWorkspace = updater(workspace);
  if (nextWorkspace === workspace) {
    return state;
  }

  return {
    ...state,
    desktops: {
      ...state.desktops,
      [desktopId]: nextWorkspace,
    },
  };
}

function patchWindow(
  state: WindowManagerState,
  id: WindowId,
  updater: (windowEntity: WindowEntity) => WindowEntity,
): WindowManagerState {
  const windowEntity = state.windows[id];
  if (!windowEntity || windowEntity.state.closed) {
    return state;
  }

  const nextWindowEntity = updater(windowEntity);
  if (nextWindowEntity === windowEntity) {
    return state;
  }

  return {
    ...state,
    windows: {
      ...state.windows,
      [id]: nextWindowEntity,
    },
  };
}

function rotateVisibleWindowOrder(
  state: WindowManagerState,
  desktopId: DesktopId,
  direction: 'next' | 'previous',
): WindowManagerState | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  const visibleWindowIds = getVisibleWindowIds(state, desktopId);
  if (visibleWindowIds.length <= 1) {
    return null;
  }

  const rotatedVisibleIds =
    direction === 'next'
      ? [...visibleWindowIds.slice(1), visibleWindowIds[0]]
      : [
          visibleWindowIds[visibleWindowIds.length - 1],
          ...visibleWindowIds.slice(0, -1),
        ];
  const visibleIdSet = new Set(visibleWindowIds);
  let visibleIndex = 0;
  const activeWindowId =
    rotatedVisibleIds[rotatedVisibleIds.length - 1] ?? null;
  const activeMonitorId = getResolvedActiveMonitorId(
    state,
    desktopId,
    activeWindowId,
  );

  return patchWorkspace(state, desktopId, (current) => ({
    ...current,
    orderedWindowIds: current.orderedWindowIds.map((id) => {
      if (!visibleIdSet.has(id)) {
        return id;
      }

      const nextId = rotatedVisibleIds[visibleIndex];
      visibleIndex += 1;
      return nextId;
    }),
    activeWindowId,
    activeMonitorId: activeMonitorId ?? current.activeMonitorId,
  }));
}

function updateWindowWorkspaceFocus(
  state: WindowManagerState,
  desktopId: DesktopId,
  monitorId: MonitorId,
  windowId: WindowId,
  switchDesktop: boolean,
): WindowManagerState {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace || !workspace.monitors[monitorId]) {
    return state;
  }

  const orderedWindowIds = bringToFront(workspace.orderedWindowIds, windowId);
  const nextState =
    orderedWindowIds === workspace.orderedWindowIds &&
    workspace.activeWindowId === windowId &&
    workspace.activeMonitorId === monitorId
      ? state
      : patchWorkspace(state, desktopId, (current) => ({
          ...current,
          orderedWindowIds,
          activeWindowId: windowId,
          activeMonitorId: monitorId,
        }));

  if (!switchDesktop || nextState.activeDesktopId === desktopId) {
    return nextState;
  }

  return {
    ...nextState,
    activeDesktopId: desktopId,
  };
}

function updateWorkspaceActiveWindow(
  state: WindowManagerState,
  desktopId: DesktopId,
  activeWindowId: WindowId | null,
): WindowManagerState {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return state;
  }

  const activeMonitorId = getResolvedActiveMonitorId(
    state,
    desktopId,
    activeWindowId,
  );
  if (
    workspace.activeWindowId === activeWindowId &&
    (!activeMonitorId || workspace.activeMonitorId === activeMonitorId)
  ) {
    return state;
  }

  return patchWorkspace(state, desktopId, (current) => ({
    ...current,
    activeWindowId,
    activeMonitorId: activeMonitorId ?? current.activeMonitorId,
  }));
}

export function createInitialState(): WindowManagerState {
  return {
    version: WINDOW_MANAGER_STATE_VERSION,
    windows: {},
    desktops: {
      [DEFAULT_DESKTOP_ID]: createDesktopWorkspace(DEFAULT_DESKTOP_ID),
    },
    activeDesktopId: DEFAULT_DESKTOP_ID,
  };
}

export function windowManagerReducer(
  state: WindowManagerState,
  command: WindowManagerCommand,
): WindowManagerState {
  switch (command.type) {
    case 'CREATE_WINDOW': {
      if (state.windows[command.payload.id]) {
        return state;
      }

      const ownerWindow =
        command.payload.ownerWindowId !== undefined
          ? (state.windows[command.payload.ownerWindowId] ?? null)
          : null;
      if (
        command.payload.ownerWindowId !== undefined &&
        (!ownerWindow || ownerWindow.state.closed)
      ) {
        return state;
      }

      const desktopId =
        ownerWindow?.desktopId ??
        command.payload.workspaceId ??
        command.payload.desktopId ??
        state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (!workspace) {
        return state;
      }

      const monitorId =
        ownerWindow?.monitorId ??
        resolveMonitorId(workspace, command.payload.monitorId);
      if (!monitorId) {
        return state;
      }

      const monitor = getMonitorState(workspace, monitorId);
      if (!monitor) {
        return state;
      }

      const baseRect = {
        ...DEFAULT_RECT,
        ...command.payload.rect,
      };
      const safeRect = fitRectToBounds(baseRect, monitor.bounds);
      const windowEntity: WindowEntity = {
        id: command.payload.id,
        desktopId,
        monitorId,
        ...(ownerWindow ? { ownerWindowId: ownerWindow.id } : {}),
        state: {
          minimized: false,
          maximized: false,
          closed: false,
        },
        rect: safeRect,
        restoreRect: safeRect,
        flags: {
          ...DEFAULT_FLAGS,
          ...command.payload.flags,
        },
        ...(command.payload.title !== undefined
          ? { title: command.payload.title }
          : {}),
      };

      const shouldFocus = ownerWindow ? true : (command.payload.focus ?? true);
      const nextWorkspace: DesktopWorkspace = {
        ...workspace,
        orderedWindowIds: [...workspace.orderedWindowIds, windowEntity.id],
        activeWindowId: shouldFocus
          ? windowEntity.id
          : workspace.activeWindowId,
        activeMonitorId: shouldFocus ? monitorId : workspace.activeMonitorId,
      };

      const nextState: WindowManagerState = {
        ...state,
        windows: { ...state.windows, [windowEntity.id]: windowEntity },
        desktops: {
          ...state.desktops,
          [desktopId]: nextWorkspace,
        },
      };

      if (!shouldFocus || state.activeDesktopId === desktopId) {
        return nextState;
      }

      return {
        ...nextState,
        activeDesktopId: desktopId,
      };
    }

    case 'CREATE_DESKTOP': {
      if (state.desktops[command.payload.id]) {
        return state;
      }

      return {
        ...state,
        desktops: {
          ...state.desktops,
          [command.payload.id]: createDesktopWorkspace(
            command.payload.id,
            command.payload.desktop,
          ),
        },
      };
    }

    case 'SWITCH_DESKTOP': {
      if (
        !state.desktops[command.payload.id] ||
        state.activeDesktopId === command.payload.id
      ) {
        return state;
      }

      return {
        ...state,
        activeDesktopId: command.payload.id,
      };
    }

    case 'CREATE_MONITOR': {
      const desktopId = command.payload.desktopId ?? state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (!workspace || workspace.monitors[command.payload.id]) {
        return state;
      }

      return patchWorkspace(state, desktopId, (current) => ({
        ...current,
        monitors: {
          ...current.monitors,
          [command.payload.id]: command.payload.monitor ?? DEFAULT_MONITOR,
        },
      }));
    }

    case 'SWITCH_MONITOR': {
      const desktopId = command.payload.desktopId ?? state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (
        !workspace ||
        !workspace.monitors[command.payload.id] ||
        workspace.activeMonitorId === command.payload.id
      ) {
        return state;
      }

      return patchWorkspace(state, desktopId, (current) => ({
        ...current,
        activeMonitorId: command.payload.id,
      }));
    }

    case 'FOCUS_WINDOW': {
      const windowEntity = resolveFocusableWindow(
        state,
        state.windows[command.payload.id],
      );
      if (!windowEntity) {
        return state;
      }

      return updateWindowWorkspaceFocus(
        state,
        windowEntity.desktopId,
        windowEntity.monitorId,
        windowEntity.id,
        true,
      );
    }

    case 'FOCUS_NEXT_WINDOW':
    case 'FOCUS_PREVIOUS_WINDOW': {
      const rotatedState = rotateVisibleWindowOrder(
        state,
        state.activeDesktopId,
        command.type === 'FOCUS_NEXT_WINDOW' ? 'next' : 'previous',
      );
      if (!rotatedState) {
        return state;
      }

      return rotatedState;
    }

    case 'MOVE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (
        !windowEntity ||
        !windowEntity.flags.movable ||
        windowEntity.state.maximized
      ) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      const monitor = workspace
        ? getMonitorState(workspace, windowEntity.monitorId)
        : null;
      if (!workspace || !monitor) {
        return state;
      }

      return patchWindow(state, command.payload.id, (current) => {
        if (command.payload.deltaX === 0 && command.payload.deltaY === 0) {
          return current;
        }

        const moved = moveRect(
          current.rect,
          command.payload.deltaX,
          command.payload.deltaY,
        );
        const snapped = snapRectToBounds(
          moved,
          monitor.bounds,
          getSnapThreshold(monitor),
        );
        const clamped = fitRectToBounds(snapped, monitor.bounds);
        if (rectEquals(clamped, current.rect)) {
          return current;
        }

        return {
          ...current,
          rect: clamped,
          restoreRect: clamped,
        };
      });
    }

    case 'RESIZE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (
        !windowEntity ||
        !windowEntity.flags.resizable ||
        windowEntity.state.maximized
      ) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      const monitor = workspace
        ? getMonitorState(workspace, windowEntity.monitorId)
        : null;
      if (!workspace || !monitor) {
        return state;
      }

      return patchWindow(state, command.payload.id, (current) => {
        if (command.payload.deltaX === 0 && command.payload.deltaY === 0) {
          return current;
        }

        const resized = resizeRect(
          current.rect,
          command.payload.edge,
          command.payload.deltaX,
          command.payload.deltaY,
        );
        const snapped = snapResizedRectToBounds(
          resized,
          monitor.bounds,
          command.payload.edge,
          getSnapThreshold(monitor),
        );
        const clamped = fitResizedRectToBounds(
          snapped,
          monitor.bounds,
          command.payload.edge,
        );
        if (rectEquals(clamped, current.rect)) {
          return current;
        }

        return {
          ...current,
          rect: clamped,
          restoreRect: clamped,
        };
      });
    }

    case 'MAXIMIZE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (
        !windowEntity ||
        !windowEntity.flags.maximizable ||
        windowEntity.state.closed ||
        windowEntity.state.maximized
      ) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      const monitor = workspace
        ? getMonitorState(workspace, windowEntity.monitorId)
        : null;
      if (!workspace || !monitor) {
        return state;
      }

      const nextState = patchWindow(state, command.payload.id, (current) => ({
        ...current,
        state: { ...current.state, minimized: false, maximized: true },
        restoreRect: current.rect,
        rect: getMonitorRect(monitor),
      }));

      return patchWorkspace(nextState, windowEntity.desktopId, (current) => ({
        ...current,
        orderedWindowIds: bringToFront(
          current.orderedWindowIds,
          command.payload.id,
        ),
        activeWindowId: command.payload.id,
        activeMonitorId: windowEntity.monitorId,
      }));
    }

    case 'MINIMIZE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity) {
        return state;
      }

      const minimized = patchWindow(state, command.payload.id, (current) => {
        if (!current.flags.minimizable) {
          return current;
        }

        if (current.state.minimized && !current.state.maximized) {
          return current;
        }

        return {
          ...current,
          state: { ...current.state, minimized: true, maximized: false },
        };
      });

      if (minimized === state) {
        return state;
      }

      const nextActiveWindowId =
        getDesktopWorkspace(minimized, windowEntity.desktopId)
          ?.activeWindowId === command.payload.id
          ? findNextActiveId(minimized, windowEntity.desktopId)
          : (getDesktopWorkspace(minimized, windowEntity.desktopId)
              ?.activeWindowId ?? null);

      return updateWorkspaceActiveWindow(
        minimized,
        windowEntity.desktopId,
        nextActiveWindowId,
      );
    }

    case 'RESTORE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || windowEntity.state.closed) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      const monitor = workspace
        ? getMonitorState(workspace, windowEntity.monitorId)
        : null;
      if (!workspace || !monitor) {
        return state;
      }

      const restoredState = patchWindow(
        state,
        command.payload.id,
        (current) => {
          const nextRect = fitRectToBounds(current.restoreRect, monitor.bounds);
          const hasStateChange =
            current.state.minimized || current.state.maximized;
          const hasRectChange = !rectEquals(nextRect, current.rect);

          if (!hasStateChange && !hasRectChange) {
            return current;
          }

          return {
            ...current,
            state: { ...current.state, minimized: false, maximized: false },
            rect: nextRect,
          };
        },
      );

      const focusTarget = resolveFocusableWindow(
        restoredState,
        restoredState.windows[command.payload.id],
      );
      if (!focusTarget) {
        return restoredState;
      }

      return updateWindowWorkspaceFocus(
        restoredState,
        focusTarget.desktopId,
        focusTarget.monitorId,
        focusTarget.id,
        true,
      );
    }

    case 'CLOSE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || !windowEntity.flags.closable) {
        return state;
      }

      const windowIdsToClose = [
        command.payload.id,
        ...getModalDescendantIds(state, command.payload.id),
      ];
      let nextWindows: WindowManagerState['windows'] | null = null;

      for (const windowId of windowIdsToClose) {
        const current = state.windows[windowId];
        if (!current || current.state.closed) {
          continue;
        }

        nextWindows ??= { ...state.windows };
        nextWindows[windowId] = {
          ...current,
          state: {
            ...current.state,
            closed: true,
            minimized: false,
            maximized: false,
          },
        };
      }

      const closedState =
        nextWindows === null
          ? state
          : {
              ...state,
              windows: nextWindows,
            };

      const activeWindowId =
        getDesktopWorkspace(closedState, windowEntity.desktopId)
          ?.activeWindowId ?? null;
      const nextActiveWindowId =
        activeWindowId && windowIdsToClose.includes(activeWindowId)
          ? findNextActiveId(closedState, windowEntity.desktopId)
          : activeWindowId;

      return updateWorkspaceActiveWindow(
        closedState,
        windowEntity.desktopId,
        nextActiveWindowId,
      );
    }

    case 'SET_MONITOR':
    case 'SET_DESKTOP': {
      const desktopId = command.payload.desktopId ?? state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (!workspace) {
        return state;
      }

      const monitorId = resolveMonitorId(workspace, command.payload.monitorId);
      if (!monitorId) {
        return state;
      }

      const nextMonitor =
        command.type === 'SET_MONITOR'
          ? command.payload.monitor
          : command.payload.desktop;
      const currentMonitor = workspace.monitors[monitorId];
      if (!currentMonitor) {
        return state;
      }

      let nextWindows: WindowManagerState['windows'] | null = null;

      for (const windowId of workspace.orderedWindowIds) {
        const current = state.windows[windowId];
        if (
          !current ||
          current.state.closed ||
          current.monitorId !== monitorId
        ) {
          continue;
        }

        const nextRect = current.state.maximized
          ? getMonitorRect(nextMonitor)
          : fitRectToBounds(current.rect, nextMonitor.bounds);

        if (rectEquals(nextRect, current.rect)) {
          continue;
        }

        nextWindows ??= { ...state.windows };
        nextWindows[windowId] = {
          ...current,
          rect: nextRect,
        };
      }

      if (!nextWindows && monitorEquals(currentMonitor, nextMonitor)) {
        return state;
      }

      return {
        ...state,
        windows: nextWindows ?? state.windows,
        desktops: {
          ...state.desktops,
          [desktopId]: {
            ...workspace,
            monitors: {
              ...workspace.monitors,
              [monitorId]: nextMonitor,
            },
          },
        },
      };
    }

    case 'HYDRATE_STATE': {
      return sanitizeWindowManagerState(command.payload) ?? state;
    }

    default: {
      return state;
    }
  }
}
