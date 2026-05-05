import type { DesktopId, DesktopWorkspace, WindowEntity, WindowId, WindowManagerState } from './types';

function getDesktopWorkspace(state: WindowManagerState, desktopId: DesktopId): DesktopWorkspace | null {
  return state.desktops[desktopId] ?? null;
}

export function getWindowById(state: WindowManagerState, id: WindowId): WindowEntity | null {
  return state.windows[id] ?? null;
}

export function getDesktopById(state: WindowManagerState, id: DesktopId): DesktopWorkspace | null {
  return getDesktopWorkspace(state, id);
}

export function getActiveDesktop(state: WindowManagerState): DesktopWorkspace | null {
  return getDesktopWorkspace(state, state.activeDesktopId);
}

export function getDesktops(state: WindowManagerState): DesktopWorkspace[] {
  return Object.values(state.desktops);
}

export function getActiveWindow(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
): WindowEntity | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace?.activeWindowId) {
    return null;
  }

  return getWindowById(state, workspace.activeWindowId);
}

export function getVisibleWindows(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
): WindowEntity[] {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return [];
  }

  return workspace.orderedWindowIds
    .map((id) => state.windows[id])
    .filter((windowEntity): windowEntity is WindowEntity => {
      return (
        !!windowEntity &&
        windowEntity.desktopId === desktopId &&
        !windowEntity.state.closed &&
        !windowEntity.state.minimized
      );
    });
}

export function getTaskbarItems(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
): WindowEntity[] {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return [];
  }

  return workspace.orderedWindowIds
    .map((id) => state.windows[id])
    .filter(
      (windowEntity): windowEntity is WindowEntity =>
        !!windowEntity && windowEntity.desktopId === desktopId && !windowEntity.state.closed,
    );
}
