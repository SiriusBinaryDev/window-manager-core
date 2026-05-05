import { WindowManagerProvider, useTaskbar, useVisibleWindows, useWindowManager } from '@window-manager/react';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { WindowManager } from '@window-manager/core';

export function PlaygroundApp(): React.JSX.Element {
  const manager = useWindowManager();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();

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
          aria-label="Create a new window"
          onClick={() => {
            const id = crypto.randomUUID().slice(0, 8);
            manager.createWindow({ id, title: `Window ${id}` });
          }}
        >
          New window
        </button>
        <button aria-label="Focus the previous window" onClick={() => manager.focusPreviousWindow()}>
          Previous window
        </button>
        <button aria-label="Focus the next window" onClick={() => manager.focusNextWindow()}>
          Next window
        </button>
        <span aria-hidden="true">Alt+Shift+Left / Alt+Shift+Right</span>
      </div>
      <p id="desktop-help" className="sr-only">
        Use Alt+Shift+Left or Alt+Shift+Right to move keyboard focus between visible windows.
      </p>
      {windows.map((windowEntity, index) => (
        <WindowView key={windowEntity.id} id={windowEntity.id} zIndex={100 + index} />
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

function WindowView({ id, zIndex }: { id: string; zIndex: number }) {
  const manager = useWindowManager();
  const windows = useVisibleWindows();
  const windowEntity = windows.find((item) => item.id === id) ?? null;
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number } | null>(null);
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

  const startResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!windowEntity.flags.resizable) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { x: event.clientX, y: event.clientY };
  };

  const onResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!resizeRef.current) {
      return;
    }
    const deltaX = event.clientX - resizeRef.current.x;
    const deltaY = event.clientY - resizeRef.current.y;
    resizeRef.current = { x: event.clientX, y: event.clientY };
    manager.resizeWindow(windowEntity.id, 'bottom-right', deltaX, deltaY);
  };

  const stopResize = (): void => {
    resizeRef.current = null;
  };

  return (
    <div
      className="window"
      role="dialog"
      aria-modal="false"
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
        <div className="actions">
          <button
            aria-label={`Minimize ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.minimizable}
            onClick={() => manager.minimizeWindow(windowEntity.id)}
          >
            -
          </button>
          <button
            aria-label={`Maximize ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.maximizable}
            onClick={() => manager.maximizeWindow(windowEntity.id)}
          >
            +
          </button>
          <button
            aria-label={`Close ${windowEntity.title ?? windowEntity.id}`}
            disabled={!windowEntity.flags.closable}
            onClick={() => manager.closeWindow(windowEntity.id)}
          >
            x
          </button>
        </div>
      </div>
      <div className="content">Headless core + React adapter demo</div>
      <div
        className="resize-handle"
        aria-hidden="true"
        onPointerDown={startResize}
        onPointerMove={onResize}
        onPointerUp={stopResize}
      />
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
