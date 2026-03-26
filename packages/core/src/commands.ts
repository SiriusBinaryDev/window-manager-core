import type {
  CreateWindowPayload,
  DesktopState,
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
  focusWindow: (id: WindowId): WindowManagerCommand => ({
    type: 'FOCUS_WINDOW',
    payload: { id },
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
  setDesktop: (payload: DesktopState): WindowManagerCommand => ({
    type: 'SET_DESKTOP',
    payload,
  }),
  hydrateState: (payload: WindowManagerState): WindowManagerCommand => ({
    type: 'HYDRATE_STATE',
    payload,
  }),
};
