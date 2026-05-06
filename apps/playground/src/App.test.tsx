// @vitest-environment jsdom

import { createWindowManager } from '@window-manager/core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlaygroundRoot } from './App';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let activeContainer: HTMLDivElement | null = null;
let activeRoot: ReturnType<typeof createRoot> | null = null;
const originalSetPointerCapture = HTMLElement.prototype.setPointerCapture;

function click(element: Element): void {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function pointer(
  element: Element,
  type: string,
  clientX: number,
  clientY: number,
): void {
  act(() => {
    const event = new MouseEvent(type, { bubbles: true, clientX, clientY });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    element.dispatchEvent(event);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();

  if (originalSetPointerCapture) {
    HTMLElement.prototype.setPointerCapture = originalSetPointerCapture;
  } else {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
  }

  if (activeRoot) {
    act(() => {
      activeRoot?.unmount();
    });
    activeRoot = null;
  }

  activeContainer?.remove();
  activeContainer = null;
});

describe('playground interactions', () => {
  it('creates a window from the toolbar and reflects it in the taskbar', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);
    vi.stubGlobal('crypto', { randomUUID: () => 'window-1234' });

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const createButton = activeContainer.querySelector(
      '[aria-label="Create a new window"]',
    );
    expect(createButton).not.toBeNull();

    click(createButton as Element);

    expect(manager.getState().windows['window-1']).toBeDefined();
    expect(activeContainer.textContent).toContain('Window window-1');
  });

  it('creates and switches desktops from the toolbar', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);
    vi.stubGlobal('crypto', { randomUUID: () => 'wind-1234' });

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const createDesktopButton = activeContainer.querySelector(
      '[aria-label="Create a new desktop"]',
    );
    expect(createDesktopButton).not.toBeNull();

    click(createDesktopButton as Element);

    expect(manager.getState().desktops['desktop-wind']).toBeDefined();
    expect(manager.getState().activeDesktopId).toBe('desktop-wind');

    const defaultTab = activeContainer.querySelector(
      '[aria-label="Switch to desktop default"]',
    );
    expect(defaultTab).not.toBeNull();

    click(defaultTab as Element);

    expect(manager.getState().activeDesktopId).toBe('default');
  });

  it('creates and switches monitors from the toolbar', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);
    vi.stubGlobal('crypto', { randomUUID: () => 'moni-1234' });

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const createMonitorButton = activeContainer.querySelector(
      '[aria-label="Create a new monitor"]',
    );
    expect(createMonitorButton).not.toBeNull();

    click(createMonitorButton as Element);

    expect(
      manager.getState().desktops.default.monitors['monitor-moni'],
    ).toBeDefined();
    expect(manager.getState().desktops.default.activeMonitorId).toBe(
      'monitor-moni',
    );

    const defaultTab = activeContainer.querySelector(
      '[aria-label="Switch to monitor default"]',
    );
    expect(defaultTab).not.toBeNull();

    click(defaultTab as Element);

    expect(manager.getState().desktops.default.activeMonitorId).toBe('default');
  });

  it('creates a fixed capability window from the controls', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);
    vi.stubGlobal('crypto', { randomUUID: () => 'fixed-1234' });

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const fixedButton = activeContainer.querySelector(
      '[aria-label="Create a fixed window"]',
    );
    expect(fixedButton).not.toBeNull();

    click(fixedButton as Element);

    const fixedWindow = Object.values(manager.getState().windows).find(
      (windowEntity) => windowEntity.title?.startsWith('Fixed '),
    );

    expect(fixedWindow?.flags).toMatchObject({
      movable: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
    });
  });

  it('toggles snapping on the active monitor from the controls', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const enableSnapButton = activeContainer.querySelector(
      '[aria-label="Enable snapping on the active monitor"]',
    );
    expect(enableSnapButton).not.toBeNull();

    click(enableSnapButton as Element);

    expect(
      manager.getState().desktops.default.monitors.default.snap?.threshold,
    ).toBe(24);

    const disableSnapButton = activeContainer.querySelector(
      '[aria-label="Disable snapping on the active monitor"]',
    );
    expect(disableSnapButton).not.toBeNull();

    click(disableSnapButton as Element);

    expect(
      manager.getState().desktops.default.monitors.default.snap,
    ).toBeUndefined();
  });

  it('restores a minimized window from the taskbar', () => {
    const manager = createWindowManager();
    manager.createWindow({ id: 'alpha', title: 'Alpha' });
    manager.minimizeWindow('alpha');
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const restoreButton = activeContainer.querySelector(
      '[aria-label="Restore window Alpha"]',
    );
    expect(restoreButton).not.toBeNull();

    click(restoreButton as Element);

    expect(manager.getState().windows.alpha.state.minimized).toBe(false);
    expect(manager.getState().desktops.default.activeWindowId).toBe('alpha');
  });

  it('minimizes a window from the titlebar controls', () => {
    const manager = createWindowManager();
    manager.createWindow({ id: 'alpha', title: 'Alpha' });
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const minimizeButton = activeContainer.querySelector(
      '[aria-label="Minimize Alpha"]',
    );
    expect(minimizeButton).not.toBeNull();

    click(minimizeButton as Element);

    expect(manager.getState().windows.alpha.state.minimized).toBe(true);
  });

  it('toggles a window between maximized and restored from the titlebar controls', () => {
    const manager = createWindowManager();
    manager.createWindow({
      id: 'alpha',
      title: 'Alpha',
      rect: { x: 80, y: 90, width: 320, height: 220 },
    });
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const maximizeButton = activeContainer.querySelector(
      '[aria-label="Maximize Alpha"]',
    );
    expect(maximizeButton).not.toBeNull();

    click(maximizeButton as Element);

    expect(manager.getState().windows.alpha.state.maximized).toBe(true);
    expect(manager.getState().windows.alpha.rect).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });

    const restoreButton = activeContainer.querySelector(
      '[aria-label="Restore size Alpha"]',
    );
    expect(restoreButton).not.toBeNull();

    click(restoreButton as Element);

    expect(manager.getState().windows.alpha.state.maximized).toBe(false);
    expect(manager.getState().windows.alpha.rect).toEqual({
      x: 80,
      y: 90,
      width: 320,
      height: 220,
    });
  });

  it('closes a window from the titlebar controls', () => {
    const manager = createWindowManager();
    manager.createWindow({ id: 'alpha', title: 'Alpha' });
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const closeButton = activeContainer.querySelector(
      '[aria-label="Close Alpha"]',
    );
    expect(closeButton).not.toBeNull();

    click(closeButton as Element);

    expect(manager.getState().windows.alpha.state.closed).toBe(true);
  });

  it('resizes a window from the left edge handle', () => {
    const manager = createWindowManager();
    manager.createWindow({
      id: 'alpha',
      title: 'Alpha',
      rect: { x: 100, y: 100, width: 300, height: 200 },
    });
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);
    HTMLElement.prototype.setPointerCapture = vi.fn();

    act(() => {
      activeRoot?.render(<PlaygroundRoot manager={manager} />);
    });

    const resizeHandle = activeContainer.querySelector(
      '[data-resize-edge="left"]',
    );
    expect(resizeHandle).not.toBeNull();

    pointer(resizeHandle as Element, 'pointerdown', 100, 150);
    pointer(resizeHandle as Element, 'pointermove', 80, 150);
    pointer(resizeHandle as Element, 'pointerup', 80, 150);

    expect(manager.getState().windows.alpha.rect).toMatchObject({
      x: 80,
      y: 100,
      width: 320,
      height: 200,
    });
  });
});
