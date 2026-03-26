import type { WindowEntity, WindowId, WindowManagerState } from './types';

export function getWindowById(state: WindowManagerState, id: WindowId): WindowEntity | null {
  return state.windows[id] ?? null;
}

export function getActiveWindow(state: WindowManagerState): WindowEntity | null {
  if (!state.activeWindowId) {
    return null;
  }

  return getWindowById(state, state.activeWindowId);
}

export function getVisibleWindows(state: WindowManagerState): WindowEntity[] {
  return state.orderedWindowIds
    .map((id) => state.windows[id])
    .filter((windowEntity): windowEntity is WindowEntity => {
      return !windowEntity.state.closed && !windowEntity.state.minimized;
    });
}

export function getTaskbarItems(state: WindowManagerState): WindowEntity[] {
  return state.orderedWindowIds
    .map((id) => state.windows[id])
    .filter((windowEntity): windowEntity is WindowEntity => !windowEntity.state.closed);
}
