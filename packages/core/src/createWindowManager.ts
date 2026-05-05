import { commands } from './commands';
import { createInitialState, windowManagerReducer } from './reducer';
import { hydrateState, serializeState } from './serialization';
import * as selectors from './selectors';
import type {
  CreateWindowPayload,
  DesktopId,
  DesktopState,
  ResizeEdge,
  WindowId,
  WindowManagerCommand,
  WindowManagerState,
} from './types';

type Listener = (state: WindowManagerState) => void;

export interface WindowManager {
  getState: () => WindowManagerState;
  dispatch: (command: WindowManagerCommand) => WindowManagerState;
  subscribe: (listener: Listener) => () => void;
  createWindow: (payload: CreateWindowPayload) => WindowManagerState;
  createDesktop: (id: DesktopId, desktop?: DesktopState) => WindowManagerState;
  switchDesktop: (id: DesktopId) => WindowManagerState;
  focusWindow: (id: WindowId) => WindowManagerState;
  focusNextWindow: () => WindowManagerState;
  focusPreviousWindow: () => WindowManagerState;
  moveWindow: (id: WindowId, deltaX: number, deltaY: number) => WindowManagerState;
  resizeWindow: (id: WindowId, edge: ResizeEdge, deltaX: number, deltaY: number) => WindowManagerState;
  maximizeWindow: (id: WindowId) => WindowManagerState;
  minimizeWindow: (id: WindowId) => WindowManagerState;
  restoreWindow: (id: WindowId) => WindowManagerState;
  closeWindow: (id: WindowId) => WindowManagerState;
  setDesktop: (payload: DesktopState, desktopId?: DesktopId) => WindowManagerState;
  serialize: () => string;
  hydrate: (serialized: string) => WindowManagerState | null;
  selectors: typeof selectors;
}

export function createWindowManager(initialState: WindowManagerState = createInitialState()): WindowManager {
  let state = initialState;
  const listeners = new Set<Listener>();

  const notify = (): void => {
    listeners.forEach((listener) => listener(state));
  };

  const dispatch = (command: WindowManagerCommand): WindowManagerState => {
    const nextState = windowManagerReducer(state, command);
    if (nextState !== state) {
      state = nextState;
      notify();
    }

    return state;
  };

  return {
    getState: () => state,
    dispatch,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    createWindow: (payload) => dispatch(commands.createWindow(payload)),
    createDesktop: (id, desktop) => dispatch(commands.createDesktop(id, desktop)),
    switchDesktop: (id) => dispatch(commands.switchDesktop(id)),
    focusWindow: (id) => dispatch(commands.focusWindow(id)),
    focusNextWindow: () => dispatch(commands.focusNextWindow()),
    focusPreviousWindow: () => dispatch(commands.focusPreviousWindow()),
    moveWindow: (id, deltaX, deltaY) => dispatch(commands.moveWindow(id, deltaX, deltaY)),
    resizeWindow: (id, edge, deltaX, deltaY) =>
      dispatch(commands.resizeWindow(id, edge, deltaX, deltaY)),
    maximizeWindow: (id) => dispatch(commands.maximizeWindow(id)),
    minimizeWindow: (id) => dispatch(commands.minimizeWindow(id)),
    restoreWindow: (id) => dispatch(commands.restoreWindow(id)),
    closeWindow: (id) => dispatch(commands.closeWindow(id)),
    setDesktop: (payload, desktopId) => dispatch(commands.setDesktop(payload, desktopId)),
    serialize: () => serializeState(state),
    hydrate: (serialized) => {
      const hydrated = hydrateState(serialized);
      if (hydrated) {
        state = hydrated;
        notify();
      }

      return hydrated;
    },
    selectors,
  };
}
