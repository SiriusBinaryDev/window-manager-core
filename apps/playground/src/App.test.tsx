// @vitest-environment jsdom

import { createWindowManager } from '@window-manager/core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlaygroundRoot } from './App';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let activeContainer: HTMLDivElement | null = null;
let activeRoot: ReturnType<typeof createRoot> | null = null;

function click(element: Element): void {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

afterEach(() => {
  vi.unstubAllGlobals();

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

    const createButton = activeContainer.querySelector('[aria-label="Create a new window"]');
    expect(createButton).not.toBeNull();

    click(createButton as Element);

    expect(manager.getState().windows['window-1']).toBeDefined();
    expect(activeContainer.textContent).toContain('Window window-1');
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

    const restoreButton = activeContainer.querySelector('[aria-label="Restore window Alpha"]');
    expect(restoreButton).not.toBeNull();

    click(restoreButton as Element);

    expect(manager.getState().windows.alpha.state.minimized).toBe(false);
    expect(manager.getState().activeWindowId).toBe('alpha');
  });
});
