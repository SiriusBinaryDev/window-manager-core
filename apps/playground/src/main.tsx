import { createWindowManager } from '@window-manager/core';
import { WindowManagerProvider, useTaskbar, useVisibleWindows, useWindowManager } from '@window-manager/react';
import { StrictMode, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

const STORAGE_KEY = 'window-manager-core:playground-state';

function App() {
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
    <div className="desktop">
      <div className="toolbar">
        <button
          onClick={() => {
            const id = crypto.randomUUID().slice(0, 8);
            manager.createWindow({ id, title: `Window ${id}` });
          }}
        >
          New window
        </button>
        <button onClick={() => manager.focusPreviousWindow()}>Previous window</button>
        <button onClick={() => manager.focusNextWindow()}>Next window</button>
        <span>Alt+Shift+Left / Alt+Shift+Right</span>
      </div>
      {windows.map((windowEntity, index) => (
        <WindowView key={windowEntity.id} id={windowEntity.id} zIndex={100 + index} />
      ))}
      <div className="taskbar">
        {taskbar.map((item) => (
          <button
            key={item.id}
            className={item.state.minimized ? 'task-item minimized' : 'task-item'}
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
    </div>
  );
}

function WindowView({ id, zIndex }: { id: string; zIndex: number }) {
  const manager = useWindowManager();
  const windows = useVisibleWindows();
  const windowEntity = windows.find((item) => item.id === id) ?? null;
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number } | null>(null);

  if (!windowEntity) {
    return null;
  }

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
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
      style={{
        transform: `translate(${windowEntity.rect.x}px, ${windowEntity.rect.y}px)`,
        width: `${windowEntity.rect.width}px`,
        height: `${windowEntity.rect.height}px`,
        zIndex,
      }}
      onPointerDown={() => manager.focusWindow(windowEntity.id)}
    >
      <div className="titlebar" onPointerDown={startDrag} onPointerMove={onDrag} onPointerUp={stopDrag}>
        <span>{windowEntity.title ?? windowEntity.id}</span>
        <div className="actions">
          <button onClick={() => manager.minimizeWindow(windowEntity.id)}>-</button>
          <button onClick={() => manager.maximizeWindow(windowEntity.id)}>+</button>
          <button onClick={() => manager.closeWindow(windowEntity.id)}>x</button>
        </div>
      </div>
      <div className="content">Headless core + React adapter demo</div>
      <div className="resize-handle" onPointerDown={startResize} onPointerMove={onResize} onPointerUp={stopResize} />
    </div>
  );
}

function Root() {
  const manager = useMemo(() => {
    const instance = createWindowManager();
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      instance.hydrate(serialized);
    }
    instance.subscribe(() => {
      localStorage.setItem(STORAGE_KEY, instance.serialize());
    });
    return instance;
  }, []);

  return (
    <WindowManagerProvider manager={manager}>
      <App />
    </WindowManagerProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
