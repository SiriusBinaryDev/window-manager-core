import {
  createWindowManager,
  selectors,
  type DesktopId,
  type DesktopWorkspace,
  type MonitorId,
  type MonitorState,
  type Workspace,
  type WorkspaceId,
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

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
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

export function useTopModalWindow(): WindowEntity | null {
  return useStore((state) => selectors.getTopModalWindow(state));
}

export function useMonitor(): MonitorState {
  return useStore((state) => {
    const activeMonitor = selectors.getActiveMonitor(state);
    if (activeMonitor) {
      return activeMonitor;
    }

    const firstWorkspace = selectors.getWorkspaces(state)[0]!;
    return (
      firstWorkspace.monitors[firstWorkspace.activeMonitorId] ??
      Object.values(firstWorkspace.monitors)[0]!
    );
  });
}

export function useDesktop(): MonitorState {
  return useMonitor();
}

export function useWorkspace(): Workspace {
  return useStore((state) => {
    const activeWorkspace = selectors.getActiveWorkspace(state);
    if (activeWorkspace) {
      return activeWorkspace;
    }

    return selectors.getWorkspaces(state)[0]!;
  });
}

export function useDesktops(): DesktopWorkspace[] {
  return useStore((state) => selectors.getDesktops(state));
}

export function useWorkspaces(): Workspace[] {
  return useStore((state) => selectors.getWorkspaces(state));
}

export function useActiveDesktopId(): DesktopId {
  return useStore((state) => state.activeDesktopId);
}

export function useActiveWorkspaceId(): WorkspaceId {
  return useActiveDesktopId();
}

export function useActiveMonitorId(): MonitorId {
  return useStore((state) => {
    const activeWorkspace = selectors.getActiveWorkspace(state);
    if (activeWorkspace) {
      return activeWorkspace.activeMonitorId;
    }

    return Object.values(state.desktops)[0]!.activeMonitorId;
  });
}

export function useTaskbar(): WindowEntity[] {
  return useStore((state) => selectors.getTaskbarItems(state));
}

export function useVisibleWindows(): WindowEntity[] {
  return useStore((state) => selectors.getVisibleWindows(state));
}
