// @vitest-environment jsdom

import { createWindowManager } from '@window-manager/core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { WindowManagerProvider, useTaskbar, useVisibleWindows } from '../src';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Counts(): React.JSX.Element {
  const visibleWindows = useVisibleWindows();
  const taskbar = useTaskbar();

  return (
    <div
      data-taskbar-count={String(taskbar.length)}
      data-visible-count={String(visibleWindows.length)}
    />
  );
}

let activeContainer: HTMLDivElement | null = null;
let activeRoot: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (activeRoot) {
    act(() => {
      activeRoot?.unmount();
    });
    activeRoot = null;
  }

  activeContainer?.remove();
  activeContainer = null;
});

describe('@window-manager/react subscriptions', () => {
  it('rerenders hook consumers when manager state changes', () => {
    const manager = createWindowManager();
    activeContainer = document.createElement('div');
    document.body.appendChild(activeContainer);
    activeRoot = createRoot(activeContainer);

    act(() => {
      activeRoot?.render(
        <WindowManagerProvider manager={manager}>
          <Counts />
        </WindowManagerProvider>,
      );
    });

    const snapshot = activeContainer.firstElementChild;
    expect(snapshot?.getAttribute('data-taskbar-count')).toBe('0');
    expect(snapshot?.getAttribute('data-visible-count')).toBe('0');

    act(() => {
      manager.createWindow({ id: 'alpha', title: 'Alpha' });
    });

    expect(snapshot?.getAttribute('data-taskbar-count')).toBe('1');
    expect(snapshot?.getAttribute('data-visible-count')).toBe('1');

    act(() => {
      manager.minimizeWindow('alpha');
    });

    expect(snapshot?.getAttribute('data-taskbar-count')).toBe('1');
    expect(snapshot?.getAttribute('data-visible-count')).toBe('0');
  });
});
