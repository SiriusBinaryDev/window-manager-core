import {
  createWindowManager,
  selectors,
  type DesktopId,
  type DesktopWorkspace,
  type WindowEntity,
  type WindowId,
  type WindowManager,
  type WindowManagerState,
} from '@window-manager/core';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

const WindowManagerContext = createContext<WindowManager | null>(null);

export function WindowManagerProvider({
  children,
  manager,
}: PropsWithChildren<{ manager?: WindowManager }>): React.JSX.Element {
  const value = useMemo(() => manager ?? createWindowManager(), [manager]);

  return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}

function useManagerContext(): WindowManager {
  const manager = useContext(WindowManagerContext);
  if (!manager) {
    throw new Error('WindowManagerProvider is required');
  }

  return manager;
}

function useStore<T>(selector: (state: WindowManagerState) => T): T {
  const manager = useManagerContext();
  const state = useSyncExternalStore(
    manager.subscribe,
    manager.getState,
    manager.getState,
  );

  return selector(state);
}

export function useWindowManager(): WindowManager {
  return useManagerContext();
}

export function useWindow(id: WindowId): WindowEntity | null {
  return useStore((state) => selectors.getWindowById(state, id));
}

export function useDesktop(): DesktopWorkspace['desktop'] {
  return useStore((state) => selectors.getActiveDesktop(state)?.desktop ?? selectors.getDesktops(state)[0]!.desktop);
}

export function useDesktops(): DesktopWorkspace[] {
  return useStore((state) => selectors.getDesktops(state));
}

export function useActiveDesktopId(): DesktopId {
  return useStore((state) => state.activeDesktopId);
}

export function useTaskbar(): WindowEntity[] {
  return useStore((state) => selectors.getTaskbarItems(state));
}

export function useVisibleWindows(): WindowEntity[] {
  return useStore((state) => selectors.getVisibleWindows(state));
}
