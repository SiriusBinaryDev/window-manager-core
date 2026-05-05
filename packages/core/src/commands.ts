import type {
  CreateWindowPayload,
  DesktopId,
  DesktopState,
  MonitorId,
  MonitorState,
  ResizeEdge,
  WindowId,
  WindowManagerCommand,
  WindowManagerState,
} from './types';

export const commands = {
  createWindow: (payload: CreateWindowPayload): WindowManagerCommand => ({
    type: 'CREATE_WINDOW',
    payload,
  }),
  createDesktop: (id: DesktopId, desktop?: DesktopState): WindowManagerCommand => ({
    type: 'CREATE_DESKTOP',
    payload: { id, ...(desktop ? { desktop } : {}) },
  }),
  switchDesktop: (id: DesktopId): WindowManagerCommand => ({
    type: 'SWITCH_DESKTOP',
    payload: { id },
  }),
  createMonitor: (id: MonitorId, monitor?: MonitorState, desktopId?: DesktopId): WindowManagerCommand => ({
    type: 'CREATE_MONITOR',
    payload: { id, ...(monitor ? { monitor } : {}), ...(desktopId ? { desktopId } : {}) },
  }),
  switchMonitor: (id: MonitorId, desktopId?: DesktopId): WindowManagerCommand => ({
    type: 'SWITCH_MONITOR',
    payload: { id, ...(desktopId ? { desktopId } : {}) },
  }),
  focusWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'FOCUS_WINDOW',
    payload: { id },
  }),
  focusNextWindow: (): WindowManagerCommand => ({
    type: 'FOCUS_NEXT_WINDOW',
  }),
  focusPreviousWindow: (): WindowManagerCommand => ({
    type: 'FOCUS_PREVIOUS_WINDOW',
  }),
  moveWindow: (id: WindowId, deltaX: number, deltaY: number): WindowManagerCommand => ({
    type: 'MOVE_WINDOW',
    payload: { id, deltaX, deltaY },
  }),
  resizeWindow: (id: WindowId, edge: ResizeEdge, deltaX: number, deltaY: number): WindowManagerCommand => ({
    type: 'RESIZE_WINDOW',
    payload: { id, edge, deltaX, deltaY },
  }),
  maximizeWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'MAXIMIZE_WINDOW',
    payload: { id },
  }),
  minimizeWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'MINIMIZE_WINDOW',
    payload: { id },
  }),
  restoreWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'RESTORE_WINDOW',
    payload: { id },
  }),
  closeWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'CLOSE_WINDOW',
    payload: { id },
  }),
  setMonitor: (monitor: MonitorState, desktopId?: DesktopId, monitorId?: MonitorId): WindowManagerCommand => ({
    type: 'SET_MONITOR',
    payload: { monitor, ...(desktopId ? { desktopId } : {}), ...(monitorId ? { monitorId } : {}) },
  }),
  setDesktop: (desktop: DesktopState, desktopId?: DesktopId, monitorId?: MonitorId): WindowManagerCommand => ({
    type: 'SET_DESKTOP',
    payload: { desktop, ...(desktopId ? { desktopId } : {}), ...(monitorId ? { monitorId } : {}) },
  }),
  hydrateState: (payload: WindowManagerState): WindowManagerCommand => ({
    type: 'HYDRATE_STATE',
    payload,
  }),
};
