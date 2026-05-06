import {
  useActiveMonitorId,
  useTopModalWindow,
  WindowManagerProvider,
  useActiveDesktopId,
  useDesktops,
  useTaskbar,
  useVisibleWindows,
  useWindowManager,
} from '@window-manager/react';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { ResizeEdge, WindowManager } from '@window-manager/core';

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

export function PlaygroundApp(): React.JSX.Element {
  const manager = useWindowManager();
  const activeDesktopId = useActiveDesktopId();
  const activeMonitorId = useActiveMonitorId();
  const desktops = useDesktops();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();
  const topModalWindow = useTopModalWindow();
  const activeDesktop = desktops.find((desktop) => desktop.id === activeDesktopId) ?? desktops[0] ?? null;
  const activeWindow = manager.selectors.getActiveWindow(manager.getState());
  const monitors = activeDesktop ? Object.entries(activeDesktop.monitors) : [];
  const topModalIndex = topModalWindow ? windows.findIndex((windowEntity) => windowEntity.id === topModalWindow.id) : -1;

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
    <main className="desktop" role="application" aria-label="Window manager playground" aria-describedby="desktop-help">
      <div className="toolbar" role="toolbar" aria-label="Desktop controls">
        <button
          aria-label="Create a new desktop"
          onClick={() => {
            const id = `desktop-${crypto.randomUUID().slice(0, 4)}`;
            manager.createDesktop(id);
            manager.switchDesktop(id);
          }}
        >
          New desktop
        </button>
        <button
          aria-label="Create a new window"
          onClick={() => {
            const id = crypto.randomUUID().slice(0, 8);
            manager.createWindow({ id, title: `Window ${id}` });
          }}
        >
          New window
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
          New modal
        </button>
        <button aria-label="Focus the previous window" onClick={() => manager.focusPreviousWindow()}>
          Previous window
        </button>
        <button aria-label="Focus the next window" onClick={() => manager.focusNextWindow()}>
          Next window
        </button>
        <span aria-hidden="true">Alt+Shift+Left / Alt+Shift+Right</span>
      </div>
      <div className="toolbar" role="tablist" aria-label="Desktops">
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
      <div className="toolbar" role="tablist" aria-label="Monitors">
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
          New monitor
        </button>
        {monitors.map(([monitorId]) => (
          <button
            key={monitorId}
            role="tab"
            aria-selected={monitorId === activeMonitorId}
            aria-label={`Switch to monitor ${monitorId}`}
            onClick={() => manager.switchMonitor(monitorId, activeDesktopId)}
          >
            {monitorId}
          </button>
        ))}
      </div>
      <p id="desktop-help" className="sr-only">
        Use Alt+Shift+Left or Alt+Shift+Right to move keyboard focus between visible windows.
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
            className={item.state.minimized ? 'task-item minimized' : 'task-item'}
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
    </main>
  );
}

function WindowView({ id, zIndex, isModal }: { id: string; zIndex: number; isModal: boolean }) {
  const manager = useWindowManager();
  const windows = useVisibleWindows();
  const windowEntity = windows.find((item) => item.id === id) ?? null;
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; edge: ResizeEdge } | null>(null);
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

  const stopWindowChromePointer = (event: ReactPointerEvent<HTMLElement>): void => {
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
      <div className="titlebar" onPointerDown={startDrag} onPointerMove={onDrag} onPointerUp={stopDrag}>
        <span id={titleId}>{windowEntity.title ?? windowEntity.id}</span>
        <div className="actions" onPointerDown={stopWindowChromePointer} onPointerUp={stopWindowChromePointer}>
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
            aria-label={`Maximize ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.maximizable}
            onClick={(event) => {
              event.stopPropagation();
              manager.maximizeWindow(windowEntity.id);
            }}
          >
            +
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

export function PlaygroundRoot({ manager }: { manager: WindowManager }): React.JSX.Element {
  return (
    <WindowManagerProvider manager={manager}>
      <PlaygroundApp />
    </WindowManagerProvider>
  );
}
