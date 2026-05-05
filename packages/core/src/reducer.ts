import { clampRectToBounds, moveRect, resizeRect, snapRectToBounds, snapResizedRectToBounds } from './math';
import { sanitizeWindowManagerState } from './serialization';
import type {
  DesktopId,
  DesktopState,
  DesktopWorkspace,
  Rect,
  WindowEntity,
  WindowId,
  WindowManagerCommand,
  WindowManagerState,
} from './types';
import { DEFAULT_DESKTOP_ID, WINDOW_MANAGER_STATE_VERSION } from './types';

const DEFAULT_RECT: Rect = {
  x: 40,
  y: 40,
  width: 480,
  height: 320,
};

const DEFAULT_DESKTOP: DesktopState = {
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

function createDesktopWorkspace(id: DesktopId, desktop: DesktopState = DEFAULT_DESKTOP): DesktopWorkspace {
  return {
    id,
    desktop,
    orderedWindowIds: [],
    activeWindowId: null,
  };
}

function getDesktopWorkspace(state: WindowManagerState, desktopId: DesktopId): DesktopWorkspace | null {
  return state.desktops[desktopId] ?? null;
}

function getDesktopRect(desktop: DesktopState): Rect {
  return {
    x: desktop.bounds.minX,
    y: desktop.bounds.minY,
    width: desktop.bounds.maxX - desktop.bounds.minX,
    height: desktop.bounds.maxY - desktop.bounds.minY,
  };
}

function getSnapThreshold(desktop: DesktopState): number {
  return desktop.snap?.threshold ?? 0;
}

function isWindowFocusable(windowEntity: WindowEntity | undefined): windowEntity is WindowEntity {
  return !!windowEntity && !windowEntity.state.closed && !windowEntity.state.minimized;
}

function findNextActiveId(state: WindowManagerState, desktopId: DesktopId): WindowId | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  for (let index = workspace.orderedWindowIds.length - 1; index >= 0; index -= 1) {
    const id = workspace.orderedWindowIds[index];
    const windowEntity = state.windows[id];
    if (isWindowFocusable(windowEntity) && windowEntity.desktopId === desktopId) {
      return id;
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

function desktopEquals(left: DesktopState, right: DesktopState): boolean {
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

function getVisibleWindowIds(state: WindowManagerState, desktopId: DesktopId): WindowId[] {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return [];
  }

  return workspace.orderedWindowIds.filter((id) => {
    const windowEntity = state.windows[id];
    return isWindowFocusable(windowEntity) && windowEntity.desktopId === desktopId;
  });
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
      : [visibleWindowIds[visibleWindowIds.length - 1], ...visibleWindowIds.slice(0, -1)];
  const visibleIdSet = new Set(visibleWindowIds);
  let visibleIndex = 0;

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
    activeWindowId: rotatedVisibleIds[rotatedVisibleIds.length - 1] ?? null,
  }));
}

function updateWindowWorkspaceFocus(
  state: WindowManagerState,
  desktopId: DesktopId,
  windowId: WindowId,
  switchDesktop: boolean,
): WindowManagerState {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return state;
  }

  const orderedWindowIds = bringToFront(workspace.orderedWindowIds, windowId);
  const nextState =
    orderedWindowIds === workspace.orderedWindowIds && workspace.activeWindowId === windowId
      ? state
      : patchWorkspace(state, desktopId, (current) => ({
          ...current,
          orderedWindowIds,
          activeWindowId: windowId,
        }));

  if (!switchDesktop || nextState.activeDesktopId === desktopId) {
    return nextState;
  }

  return {
    ...nextState,
    activeDesktopId: desktopId,
  };
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

      const desktopId = command.payload.desktopId ?? state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (!workspace) {
        return state;
      }

      const baseRect = {
        ...DEFAULT_RECT,
        ...command.payload.rect,
      };
      const safeRect = clampRectToBounds(baseRect, workspace.desktop.bounds);
      const windowEntity: WindowEntity = {
        id: command.payload.id,
        desktopId,
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
        ...(command.payload.title !== undefined ? { title: command.payload.title } : {}),
      };

      const nextState: WindowManagerState = {
        ...state,
        windows: { ...state.windows, [windowEntity.id]: windowEntity },
        desktops: {
          ...state.desktops,
          [desktopId]: {
            ...workspace,
            orderedWindowIds: [...workspace.orderedWindowIds, windowEntity.id],
            activeWindowId: (command.payload.focus ?? true) ? windowEntity.id : workspace.activeWindowId,
          },
        },
      };

      if (!(command.payload.focus ?? true) || state.activeDesktopId === desktopId) {
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
          [command.payload.id]: createDesktopWorkspace(command.payload.id, command.payload.desktop),
        },
      };
    }

    case 'SWITCH_DESKTOP': {
      if (!state.desktops[command.payload.id] || state.activeDesktopId === command.payload.id) {
        return state;
      }

      return {
        ...state,
        activeDesktopId: command.payload.id,
      };
    }

    case 'FOCUS_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!isWindowFocusable(windowEntity)) {
        return state;
      }

      return updateWindowWorkspaceFocus(state, windowEntity.desktopId, command.payload.id, true);
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
      if (!windowEntity || !windowEntity.flags.movable || windowEntity.state.maximized) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      if (!workspace) {
        return state;
      }

      return patchWindow(state, command.payload.id, (current) => {
        if (command.payload.deltaX === 0 && command.payload.deltaY === 0) {
          return current;
        }

        const moved = moveRect(current.rect, command.payload.deltaX, command.payload.deltaY);
        const snapped = snapRectToBounds(moved, workspace.desktop.bounds, getSnapThreshold(workspace.desktop));
        const clamped = clampRectToBounds(snapped, workspace.desktop.bounds);
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
      if (!windowEntity || !windowEntity.flags.resizable || windowEntity.state.maximized) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      if (!workspace) {
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
          workspace.desktop.bounds,
          command.payload.edge,
          getSnapThreshold(workspace.desktop),
        );
        const clamped = clampRectToBounds(snapped, workspace.desktop.bounds);
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
      if (!workspace) {
        return state;
      }

      const nextState = patchWindow(state, command.payload.id, (current) => ({
        ...current,
        state: { ...current.state, minimized: false, maximized: true },
        restoreRect: current.rect,
        rect: getDesktopRect(workspace.desktop),
      }));

      return patchWorkspace(nextState, windowEntity.desktopId, (current) => ({
        ...current,
        orderedWindowIds: bringToFront(current.orderedWindowIds, command.payload.id),
        activeWindowId: command.payload.id,
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

      return patchWorkspace(minimized, windowEntity.desktopId, (current) => ({
        ...current,
        activeWindowId:
          current.activeWindowId === command.payload.id
            ? findNextActiveId(minimized, windowEntity.desktopId)
            : current.activeWindowId,
      }));
    }

    case 'RESTORE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || windowEntity.state.closed) {
        return state;
      }

      const workspace = getDesktopWorkspace(state, windowEntity.desktopId);
      if (!workspace) {
        return state;
      }

      const restoredState = patchWindow(state, command.payload.id, (current) => {
        const nextRect = clampRectToBounds(current.restoreRect, workspace.desktop.bounds);
        const hasStateChange = current.state.minimized || current.state.maximized;
        const hasRectChange = !rectEquals(nextRect, current.rect);

        if (!hasStateChange && !hasRectChange) {
          return current;
        }

        return {
          ...current,
          state: { ...current.state, minimized: false, maximized: false },
          rect: nextRect,
        };
      });

      return updateWindowWorkspaceFocus(restoredState, windowEntity.desktopId, command.payload.id, true);
    }

    case 'CLOSE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || !windowEntity.flags.closable) {
        return state;
      }

      const closedState = patchWindow(state, command.payload.id, (current) => ({
        ...current,
        state: {
          ...current.state,
          closed: true,
          minimized: false,
          maximized: false,
        },
      }));

      return patchWorkspace(closedState, windowEntity.desktopId, (current) => ({
        ...current,
        activeWindowId:
          current.activeWindowId === command.payload.id
            ? findNextActiveId(closedState, windowEntity.desktopId)
            : current.activeWindowId,
      }));
    }

    case 'SET_DESKTOP': {
      const desktopId = command.payload.desktopId ?? state.activeDesktopId;
      const workspace = getDesktopWorkspace(state, desktopId);
      if (!workspace) {
        return state;
      }

      const nextDesktop = command.payload.desktop;
      let nextWindows: WindowManagerState['windows'] | null = null;

      for (const windowId of workspace.orderedWindowIds) {
        const current = state.windows[windowId];
        if (!current || current.state.closed) {
          continue;
        }

        const nextRect = current.state.maximized
          ? getDesktopRect(nextDesktop)
          : clampRectToBounds(current.rect, nextDesktop.bounds);

        if (rectEquals(nextRect, current.rect)) {
          continue;
        }

        nextWindows ??= { ...state.windows };
        nextWindows[windowId] = {
          ...current,
          rect: nextRect,
        };
      }

      if (!nextWindows && desktopEquals(workspace.desktop, nextDesktop)) {
        return state;
      }

      return {
        ...state,
        windows: nextWindows ?? state.windows,
        desktops: {
          ...state.desktops,
          [desktopId]: {
            ...workspace,
            desktop: nextDesktop,
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
