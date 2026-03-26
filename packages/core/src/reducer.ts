import { clampRectToBounds, moveRect, resizeRect } from './math';
import type {
  DesktopState,
  Rect,
  WindowEntity,
  WindowId,
  WindowManagerCommand,
  WindowManagerState,
} from './types';
import { WINDOW_MANAGER_STATE_VERSION } from './types';

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
};

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

function bringToFront(state: WindowManagerState, id: WindowId): WindowManagerState {
  const rest = state.orderedWindowIds.filter((windowId) => windowId !== id);
  return {
    ...state,
    orderedWindowIds: [...rest, id],
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

  return {
    ...state,
    windows: {
      ...state.windows,
      [id]: updater(windowEntity),
    },
  };
}

export function createInitialState(): WindowManagerState {
  return {
    version: WINDOW_MANAGER_STATE_VERSION,
    windows: {},
    orderedWindowIds: [],
    activeWindowId: null,
    desktop: DEFAULT_DESKTOP,
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

      const baseRect = {
        ...DEFAULT_RECT,
        ...command.payload.rect,
      };
      const safeRect = clampRectToBounds(baseRect, state.desktop.bounds);
      const windowEntity: WindowEntity = {
        id: command.payload.id,
        title: command.payload.title,
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
      };

      const nextState = {
        ...state,
        windows: { ...state.windows, [windowEntity.id]: windowEntity },
        orderedWindowIds: [...state.orderedWindowIds, windowEntity.id],
      };

      if (command.payload.focus ?? true) {
        return {
          ...nextState,
          activeWindowId: windowEntity.id,
        };
      }

      return nextState;
    }

    case 'FOCUS_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || windowEntity.state.closed || windowEntity.state.minimized) {
        return state;
      }

      const layered = bringToFront(state, command.payload.id);
      return {
        ...layered,
        activeWindowId: command.payload.id,
      };
    }

    case 'MOVE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || !windowEntity.flags.movable || windowEntity.state.maximized) {
        return state;
      }

      return patchWindow(state, command.payload.id, (current) => {
        const moved = moveRect(current.rect, command.payload.deltaX, command.payload.deltaY);
        const clamped = clampRectToBounds(moved, state.desktop.bounds);

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

      return patchWindow(state, command.payload.id, (current) => {
        const resized = resizeRect(
          current.rect,
          command.payload.edge,
          command.payload.deltaX,
          command.payload.deltaY,
        );
        const clamped = clampRectToBounds(resized, state.desktop.bounds);

        return {
          ...current,
          rect: clamped,
          restoreRect: clamped,
        };
      });
    }

    case 'MAXIMIZE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity || windowEntity.state.maximized) {
        return state;
      }

      return {
        ...patchWindow(state, command.payload.id, (current) => ({
          ...current,
          state: { ...current.state, minimized: false, maximized: true },
          restoreRect: current.state.maximized ? current.restoreRect : current.rect,
          rect: {
            x: state.desktop.bounds.minX,
            y: state.desktop.bounds.minY,
            width: state.desktop.size.width,
            height: state.desktop.size.height,
          },
        })),
        activeWindowId: command.payload.id,
        orderedWindowIds: bringToFront(state, command.payload.id).orderedWindowIds,
      };
    }

    case 'MINIMIZE_WINDOW': {
      const minimized = patchWindow(state, command.payload.id, (current) => ({
        ...current,
        state: { ...current.state, minimized: true, maximized: false },
      }));

      if (minimized === state) {
        return state;
      }

      return {
        ...minimized,
        activeWindowId:
          state.activeWindowId === command.payload.id ? findNextActiveId(minimized) : state.activeWindowId,
      };
    }

    case 'RESTORE_WINDOW': {
      const windowEntity = state.windows[command.payload.id];
      if (!windowEntity) {
        return state;
      }

      const restoredState = patchWindow(state, command.payload.id, (current) => ({
        ...current,
        state: { ...current.state, minimized: false, maximized: false },
        rect: clampRectToBounds(current.restoreRect, state.desktop.bounds),
      }));
      const layered = bringToFront(restoredState, command.payload.id);

      return {
        ...layered,
        activeWindowId: command.payload.id,
      };
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

      return {
        ...closedState,
        activeWindowId:
          state.activeWindowId === command.payload.id ? findNextActiveId(closedState) : state.activeWindowId,
      };
    }

    case 'SET_DESKTOP': {
      let nextState: WindowManagerState = {
        ...state,
        desktop: command.payload,
      };

      for (const windowId of state.orderedWindowIds) {
        nextState = patchWindow(nextState, windowId, (current) => {
          if (current.state.maximized) {
            return {
              ...current,
              rect: {
                x: command.payload.bounds.minX,
                y: command.payload.bounds.minY,
                width: command.payload.size.width,
                height: command.payload.size.height,
              },
            };
          }

          return {
            ...current,
            rect: clampRectToBounds(current.rect, command.payload.bounds),
          };
        });
      }

      return nextState;
    }

    case 'HYDRATE_STATE': {
      return command.payload;
    }

    default: {
      return state;
    }
  }
}
