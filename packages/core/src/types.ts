export const WINDOW_MANAGER_STATE_VERSION = 2;
export const DEFAULT_DESKTOP_ID = 'default';

export type WindowId = string;
export type DesktopId = string;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface DesktopState {
  size: {
    width: number;
    height: number;
  };
  bounds: Bounds;
  snap?: DesktopSnapSettings;
}

export interface DesktopSnapSettings {
  threshold: number;
}

export interface WindowFlags {
  resizable: boolean;
  movable: boolean;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

export interface WindowStateFlags {
  minimized: boolean;
  maximized: boolean;
  closed: boolean;
}

export interface WindowEntity {
  id: WindowId;
  desktopId: DesktopId;
  title?: string;
  state: WindowStateFlags;
  rect: Rect;
  restoreRect: Rect;
  flags: WindowFlags;
}

export interface DesktopWorkspace {
  id: DesktopId;
  desktop: DesktopState;
  orderedWindowIds: WindowId[];
  activeWindowId: WindowId | null;
}

export interface WindowManagerState {
  version: number;
  windows: Record<WindowId, WindowEntity>;
  desktops: Record<DesktopId, DesktopWorkspace>;
  activeDesktopId: DesktopId;
}

export interface CreateWindowPayload {
  id: WindowId;
  desktopId?: DesktopId;
  title?: string;
  rect?: Partial<Rect>;
  flags?: Partial<WindowFlags>;
  focus?: boolean;
}

export type ResizeEdge =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type WindowManagerCommand =
  | { type: 'CREATE_WINDOW'; payload: CreateWindowPayload }
  | { type: 'CREATE_DESKTOP'; payload: { id: DesktopId; desktop?: DesktopState } }
  | { type: 'SWITCH_DESKTOP'; payload: { id: DesktopId } }
  | { type: 'FOCUS_WINDOW'; payload: { id: WindowId } }
  | { type: 'FOCUS_NEXT_WINDOW' }
  | { type: 'FOCUS_PREVIOUS_WINDOW' }
  | { type: 'MOVE_WINDOW'; payload: { id: WindowId; deltaX: number; deltaY: number } }
  | {
      type: 'RESIZE_WINDOW';
      payload: { id: WindowId; edge: ResizeEdge; deltaX: number; deltaY: number };
    }
  | { type: 'MAXIMIZE_WINDOW'; payload: { id: WindowId } }
  | { type: 'MINIMIZE_WINDOW'; payload: { id: WindowId } }
  | { type: 'RESTORE_WINDOW'; payload: { id: WindowId } }
  | { type: 'CLOSE_WINDOW'; payload: { id: WindowId } }
  | { type: 'SET_DESKTOP'; payload: { desktop: DesktopState; desktopId?: DesktopId } }
  | { type: 'HYDRATE_STATE'; payload: WindowManagerState };

export interface SerializationEnvelope {
  version: number;
  state: WindowManagerState;
}
