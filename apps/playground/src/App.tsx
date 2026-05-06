import {
  useActiveMonitorId,
  useMonitor,
  useTopModalWindow,
  WindowManagerProvider,
  useActiveDesktopId,
  useDesktops,
  useTaskbar,
  useVisibleWindows,
  useWindowManager,
} from '@window-manager/react';
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  MonitorState,
  ResizeEdge,
  WindowManager,
} from '@window-manager/core';

const RESIZE_EDGES: ResizeEdge[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

function resizeMonitorBounds(
  monitor: MonitorState,
  width: number,
  height: number,
): MonitorState {
  return {
    ...monitor,
    size: { width, height },
    bounds: {
      ...monitor.bounds,
      maxX: monitor.bounds.minX + width,
      maxY: monitor.bounds.minY + height,
    },
  };
}

function removeMonitorSnap(monitor: MonitorState): MonitorState {
  return {
    size: monitor.size,
    bounds: monitor.bounds,
  };
}

export function PlaygroundApp(): React.JSX.Element {
  const manager = useWindowManager();
  const activeDesktopId = useActiveDesktopId();
  const activeMonitorId = useActiveMonitorId();
  const activeMonitor = useMonitor();
  const desktops = useDesktops();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();
  const topModalWindow = useTopModalWindow();
  const state = manager.getState();
  const activeDesktop =
    desktops.find((desktop) => desktop.id === activeDesktopId) ??
    desktops[0] ??
    null;
  const activeWindow = manager.selectors.getActiveWindow(manager.getState());
  const monitors = activeDesktop ? Object.entries(activeDesktop.monitors) : [];
  const topModalIndex = topModalWindow
    ? windows.findIndex((windowEntity) => windowEntity.id === topModalWindow.id)
    : -1;
  const visibleWindowCount = windows.length;
  const snapEnabled = (activeMonitor.snap?.threshold ?? 0) > 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!event.altKey || !event.shiftKey) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        manager.focusNextWindow();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        manager.focusPreviousWindow();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [manager]);

  return (
    <main
      className="desktop-shell"
      role="application"
      aria-label="Window manager playground"
      aria-describedby="desktop-help"
    >
      <aside className="control-panel">
        <header className="panel-header">
          <span className="eyebrow">Window Manager Core</span>
          <h1>Playground</h1>
        </header>

        <section className="panel-section" aria-labelledby="create-heading">
          <h2 id="create-heading">Create</h2>
          <div className="button-grid">
            <button
              aria-label="Create a new window"
              onClick={() => {
                const id = crypto.randomUUID().slice(0, 8);
                manager.createWindow({ id, title: `Window ${id}` });
              }}
            >
              Window
            </button>
            <button
              aria-label="Create a fixed window"
              onClick={() => {
                const id = crypto.randomUUID().slice(0, 8);
                manager.createWindow({
                  id,
                  title: `Fixed ${id}`,
                  rect: { x: 120, y: 110, width: 360, height: 220 },
                  flags: {
                    movable: false,
                    resizable: false,
                    minimizable: false,
                    maximizable: false,
                  },
                });
              }}
            >
              Fixed
            </button>
            <button
              aria-label="Create a modal window"
              disabled={!activeWindow}
              onClick={() => {
                if (!activeWindow) {
                  return;
                }

                const id = crypto.randomUUID().slice(0, 8);
                manager.createWindow({
                  id,
                  ownerWindowId: activeWindow.id,
                  title: `Modal ${id}`,
                  rect: {
                    x: activeWindow.rect.x + 40,
                    y: activeWindow.rect.y + 40,
                    width: Math.min(activeWindow.rect.width, 360),
                    height: Math.min(activeWindow.rect.height, 220),
                  },
                });
              }}
            >
              Modal
            </button>
            <button
              aria-label="Create a new desktop"
              onClick={() => {
                const id = `desktop-${crypto.randomUUID().slice(0, 4)}`;
                manager.createDesktop(id);
                manager.switchDesktop(id);
              }}
            >
              Desktop
            </button>
            <button
              aria-label="Create a new monitor"
              onClick={() => {
                const id = `monitor-${crypto.randomUUID().slice(0, 4)}`;
                manager.createMonitor(
                  id,
                  {
                    size: { width: 1280, height: 720 },
                    bounds: { minX: 1320, minY: 0, maxX: 2600, maxY: 720 },
                  },
                  activeDesktopId,
                );
                manager.switchMonitor(id, activeDesktopId);
              }}
            >
              Monitor
            </button>
          </div>
        </section>

        <section className="panel-section" aria-labelledby="desktop-heading">
          <h2 id="desktop-heading">Desktops</h2>
          <div className="tab-strip" role="tablist" aria-label="Desktops">
            {desktops.map((desktop) => (
              <button
                key={desktop.id}
                role="tab"
                aria-selected={desktop.id === activeDesktopId}
                aria-label={`Switch to desktop ${desktop.id}`}
                onClick={() => manager.switchDesktop(desktop.id)}
              >
                {desktop.id}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section" aria-labelledby="monitor-heading">
          <h2 id="monitor-heading">Monitors</h2>
          <div className="tab-strip" role="tablist" aria-label="Monitors">
            {monitors.map(([monitorId]) => (
              <button
                key={monitorId}
                role="tab"
                aria-selected={monitorId === activeMonitorId}
                aria-label={`Switch to monitor ${monitorId}`}
                onClick={() =>
                  manager.switchMonitor(monitorId, activeDesktopId)
                }
              >
                {monitorId}
              </button>
            ))}
          </div>
          <div className="button-grid">
            <button
              aria-label={
                snapEnabled
                  ? 'Disable snapping on the active monitor'
                  : 'Enable snapping on the active monitor'
              }
              onClick={() => {
                manager.setMonitor(
                  snapEnabled
                    ? removeMonitorSnap(activeMonitor)
                    : { ...activeMonitor, snap: { threshold: 24 } },
                  activeDesktopId,
                  activeMonitorId,
                );
              }}
            >
              {snapEnabled ? 'Snap off' : 'Snap on'}
            </button>
            <button
              aria-label="Resize active monitor to compact bounds"
              onClick={() =>
                manager.setMonitor(
                  resizeMonitorBounds(activeMonitor, 900, 560),
                  activeDesktopId,
                  activeMonitorId,
                )
              }
            >
              Compact
            </button>
            <button
              aria-label="Resize active monitor to default bounds"
              onClick={() =>
                manager.setMonitor(
                  resizeMonitorBounds(activeMonitor, 1280, 720),
                  activeDesktopId,
                  activeMonitorId,
                )
              }
            >
              Reset
            </button>
          </div>
        </section>

        <section className="panel-section" aria-labelledby="focus-heading">
          <h2 id="focus-heading">Focus</h2>
          <div className="button-grid">
            <button
              aria-label="Focus the previous window"
              onClick={() => manager.focusPreviousWindow()}
            >
              Previous
            </button>
            <button
              aria-label="Focus the next window"
              onClick={() => manager.focusNextWindow()}
            >
              Next
            </button>
          </div>
        </section>

        <section className="panel-section metrics" aria-label="Active state">
          <dl>
            <div>
              <dt>Desktop</dt>
              <dd>{activeDesktopId}</dd>
            </div>
            <div>
              <dt>Monitor</dt>
              <dd>{activeMonitorId}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd>{activeWindow?.title ?? activeWindow?.id ?? 'None'}</dd>
            </div>
            <div>
              <dt>Visible</dt>
              <dd>{visibleWindowCount}</dd>
            </div>
            <div>
              <dt>Taskbar</dt>
              <dd>{taskbar.length}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{state.version}</dd>
            </div>
          </dl>
        </section>
      </aside>

      <section className="workspace">
        <p id="desktop-help" className="sr-only">
          Use Alt+Shift+Left or Alt+Shift+Right to move keyboard focus between
          visible windows.
        </p>
        {topModalWindow && (
          <div
            className="modal-backdrop"
            aria-hidden="true"
            style={{ zIndex: Math.max(99, 99 + topModalIndex) }}
          />
        )}
        {windows.map((windowEntity, index) => (
          <WindowView
            key={windowEntity.id}
            id={windowEntity.id}
            zIndex={100 + index}
            isModal={!!windowEntity.ownerWindowId}
          />
        ))}
        <div className="taskbar" role="toolbar" aria-label="Taskbar">
          {taskbar.map((item) => (
            <button
              key={item.id}
              className={
                item.state.minimized ? 'task-item minimized' : 'task-item'
              }
              aria-label={
                item.state.minimized
                  ? `Restore window ${item.title ?? item.id}`
                  : `Focus window ${item.title ?? item.id}`
              }
              onClick={() => {
                if (item.state.closed) {
                  return;
                }
                if (item.state.minimized) {
                  manager.restoreWindow(item.id);
                } else {
                  manager.focusWindow(item.id);
                }
              }}
            >
              {item.title ?? item.id}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function WindowView({
  id,
  zIndex,
  isModal,
}: {
  id: string;
  zIndex: number;
  isModal: boolean;
}) {
  const manager = useWindowManager();
  const windows = useVisibleWindows();
  const windowEntity = windows.find((item) => item.id === id) ?? null;
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; edge: ResizeEdge } | null>(
    null,
  );
  const titleId = `window-title-${id}`;

  if (!windowEntity) {
    return null;
  }

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!windowEntity.flags.movable) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
    manager.focusWindow(windowEntity.id);
  };

  const onDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) {
      return;
    }
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    manager.moveWindow(windowEntity.id, deltaX, deltaY);
  };

  const stopDrag = (): void => {
    dragRef.current = null;
  };

  const startResize =
    (edge: ResizeEdge) =>
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (!windowEntity.flags.resizable) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      resizeRef.current = { x: event.clientX, y: event.clientY, edge };
    };

  const onResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!resizeRef.current) {
      return;
    }
    const deltaX = event.clientX - resizeRef.current.x;
    const deltaY = event.clientY - resizeRef.current.y;
    const { edge } = resizeRef.current;
    resizeRef.current = { x: event.clientX, y: event.clientY, edge };
    manager.resizeWindow(windowEntity.id, edge, deltaX, deltaY);
  };

  const stopResize = (): void => {
    resizeRef.current = null;
  };

  const stopWindowChromePointer = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    event.stopPropagation();
  };

  return (
    <div
      className="window"
      role="dialog"
      aria-modal={isModal ? 'true' : 'false'}
      aria-labelledby={titleId}
      tabIndex={0}
      style={{
        transform: `translate(${windowEntity.rect.x}px, ${windowEntity.rect.y}px)`,
        width: `${windowEntity.rect.width}px`,
        height: `${windowEntity.rect.height}px`,
        zIndex,
      }}
      onPointerDown={() => manager.focusWindow(windowEntity.id)}
      onFocus={() => manager.focusWindow(windowEntity.id)}
    >
      <div
        className="titlebar"
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={stopDrag}
      >
        <span id={titleId}>{windowEntity.title ?? windowEntity.id}</span>
        <div
          className="actions"
          onPointerDown={stopWindowChromePointer}
          onPointerUp={stopWindowChromePointer}
        >
          <button
            aria-label={`Minimize ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.minimizable}
            onClick={(event) => {
              event.stopPropagation();
              manager.minimizeWindow(windowEntity.id);
            }}
          >
            -
          </button>
          <button
            aria-label={
              windowEntity.state.maximized
                ? `Restore size ${windowEntity.title ?? windowEntity.id}`
                : `Maximize ${windowEntity.title ?? windowEntity.id}`
            }
            disabled={!windowEntity.flags.maximizable}
            onClick={(event) => {
              event.stopPropagation();
              if (windowEntity.state.maximized) {
                manager.restoreWindow(windowEntity.id);
              } else {
                manager.maximizeWindow(windowEntity.id);
              }
            }}
          >
            {windowEntity.state.maximized ? '[]' : '+'}
          </button>
          <button
            aria-label={`Close ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.closable}
            onClick={(event) => {
              event.stopPropagation();
              manager.closeWindow(windowEntity.id);
            }}
          >
            x
          </button>
        </div>
      </div>
      <div className="content">Headless core + React adapter demo</div>
      {RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`resize-handle ${edge}`}
          data-resize-edge={edge}
          aria-hidden="true"
          onPointerDown={startResize(edge)}
          onPointerMove={onResize}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
        />
      ))}
    </div>
  );
}

export function PlaygroundRoot({
  manager,
}: {
  manager: WindowManager;
}): React.JSX.Element {
  return (
    <WindowManagerProvider manager={manager}>
      <PlaygroundApp />
    </WindowManagerProvider>
  );
}
