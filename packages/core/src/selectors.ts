import type {
  DesktopId,
  DesktopWorkspace,
  MonitorId,
  MonitorState,
  WindowEntity,
  WindowId,
  WindowManagerState,
} from './types';

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

export function getMonitorById(
  state: WindowManagerState,
  id: MonitorId,
  desktopId: DesktopId = state.activeDesktopId,
): MonitorState | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  return workspace.monitors[id] ?? null;
}

export function getActiveMonitor(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
): MonitorState | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  return workspace.monitors[workspace.activeMonitorId] ?? null;
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

export function getTopModalWindow(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
): WindowEntity | null {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return null;
  }

  for (let index = workspace.orderedWindowIds.length - 1; index >= 0; index -= 1) {
    const id = workspace.orderedWindowIds[index];
    const windowEntity = state.windows[id];
    if (
      windowEntity &&
      windowEntity.desktopId === desktopId &&
      !!windowEntity.ownerWindowId &&
      !windowEntity.state.closed &&
      !windowEntity.state.minimized
    ) {
      return windowEntity;
    }
  }

  return null;
}

export function getVisibleWindows(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
  monitorId?: MonitorId,
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
        !windowEntity.state.minimized &&
        (monitorId === undefined || windowEntity.monitorId === monitorId)
      );
    });
}

export function getTaskbarItems(
  state: WindowManagerState,
  desktopId: DesktopId = state.activeDesktopId,
  monitorId?: MonitorId,
): WindowEntity[] {
  const workspace = getDesktopWorkspace(state, desktopId);
  if (!workspace) {
    return [];
  }

  return workspace.orderedWindowIds
    .map((id) => state.windows[id])
    .filter(
      (windowEntity): windowEntity is WindowEntity =>
        !!windowEntity &&
        windowEntity.desktopId === desktopId &&
        !windowEntity.state.closed &&
        (monitorId === undefined || windowEntity.monitorId === monitorId),
    );
}
