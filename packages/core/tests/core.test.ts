import { describe, expect, it } from 'vitest';
import {
  commands,
  createInitialState,
  createWindowManager,
  DEFAULT_DESKTOP_ID,
  DEFAULT_MONITOR_ID,
  hydrateState,
  serializeState,
  type WindowManagerState,
  windowManagerReducer,
} from '../src';
import {
  resizeRect,
  snapRectToBounds,
  snapResizedRectToBounds,
} from '../src/math';

function getWorkspace(
  state: WindowManagerState,
  desktopId: string = state.activeDesktopId,
) {
  return state.desktops[desktopId]!;
}

function getMonitor(
  state: WindowManagerState,
  desktopId: string = state.activeDesktopId,
  monitorId: string = getWorkspace(state, desktopId).activeMonitorId,
) {
  return getWorkspace(state, desktopId).monitors[monitorId]!;
}

describe('window manager core', () => {
  it('creates windows in the active desktop and active monitor', () => {
    const state = windowManagerReducer(
      createInitialState(),
      commands.createWindow({ id: '1' }),
    );

    expect(state.windows['1']).toBeDefined();
    expect(state.windows['1'].desktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(state.windows['1'].monitorId).toBe(DEFAULT_MONITOR_ID);
    expect(getWorkspace(state).activeWindowId).toBe('1');
    expect(getWorkspace(state).activeMonitorId).toBe(DEFAULT_MONITOR_ID);
  });

  it('creates and switches desktops', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(state, commands.switchDesktop('secondary'));

    expect(state.desktops.secondary).toBeDefined();
    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state).orderedWindowIds).toEqual([]);
    expect(getWorkspace(state).activeMonitorId).toBe(DEFAULT_MONITOR_ID);
  });

  it('creates and switches monitors inside a desktop', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 1280, height: 720 },
        bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
      }),
    );
    state = windowManagerReducer(state, commands.switchMonitor('right'));

    expect(getWorkspace(state).monitors.right).toBeDefined();
    expect(getWorkspace(state).activeMonitorId).toBe('right');
  });

  it('creates windows on an explicit monitor and focuses that monitor', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 1280, height: 720 },
        bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '2', monitorId: 'right' }),
    );

    expect(state.windows['2'].monitorId).toBe('right');
    expect(getWorkspace(state).activeMonitorId).toBe('right');
    expect(state.windows['2'].rect.x).toBeGreaterThanOrEqual(1280);
  });

  it('fits oversized created windows inside monitor bounds', () => {
    const state = windowManagerReducer(
      createInitialState(),
      commands.createWindow({
        id: 'oversized',
        rect: { x: -100, y: -100, width: 2000, height: 1000 },
      }),
    );

    expect(state.windows.oversized.rect).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
  });

  it('normalizes non-positive created window dimensions', () => {
    const state = windowManagerReducer(
      createInitialState(),
      commands.createWindow({
        id: 'invalid-size',
        rect: { x: 40, y: 40, width: -10, height: 0 },
      }),
    );

    expect(state.windows['invalid-size'].rect).toEqual({
      x: 40,
      y: 40,
      width: 160,
      height: 120,
    });
  });

  it('focus updates z-order within a desktop workspace', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.focusWindow('1'));

    expect(
      getWorkspace(state).orderedWindowIds[
        getWorkspace(state).orderedWindowIds.length - 1
      ],
    ).toBe('1');
    expect(getWorkspace(state).activeWindowId).toBe('1');
  });

  it('does not recreate state when focusing the already active front window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));

    const nextState = windowManagerReducer(state, commands.focusWindow('1'));

    expect(nextState).toBe(state);
  });

  it('focus next window cycles through visible windows in the active desktop', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(getWorkspace(state).activeWindowId).toBe('1');

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(getWorkspace(state).activeWindowId).toBe('2');

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(getWorkspace(state).activeWindowId).toBe('3');
  });

  it('focus previous window cycles through visible windows in reverse', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(getWorkspace(state).activeWindowId).toBe('2');

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(getWorkspace(state).activeWindowId).toBe('1');

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(getWorkspace(state).activeWindowId).toBe('3');
  });

  it('focus traversal skips minimized and closed windows', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));
    state = windowManagerReducer(state, commands.minimizeWindow('2'));
    state = windowManagerReducer(state, commands.closeWindow('3'));

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(getWorkspace(state).activeWindowId).toBe('1');

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(getWorkspace(state).activeWindowId).toBe('1');
  });

  it('does not focus minimized windows directly', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));

    const nextState = windowManagerReducer(state, commands.focusWindow('1'));

    expect(nextState).toBe(state);
    expect(getWorkspace(nextState).activeWindowId).toBe('2');
  });

  it('focusing a window on another desktop auto-switches to that desktop', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '2', desktopId: 'secondary' }),
    );
    state = windowManagerReducer(
      state,
      commands.switchDesktop(DEFAULT_DESKTOP_ID),
    );

    state = windowManagerReducer(state, commands.focusWindow('2'));

    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state, 'secondary').activeWindowId).toBe('2');
  });

  it('focusing a window on another monitor updates the active monitor', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 1280, height: 720 },
        bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
      }),
    );
    state = windowManagerReducer(state, commands.createWindow({ id: 'left' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: 'right', monitorId: 'right' }),
    );
    state = windowManagerReducer(state, commands.focusWindow('left'));

    expect(getWorkspace(state).activeMonitorId).toBe(DEFAULT_MONITOR_ID);

    state = windowManagerReducer(state, commands.focusWindow('right'));

    expect(getWorkspace(state).activeMonitorId).toBe('right');
    expect(getWorkspace(state).activeWindowId).toBe('right');
  });

  it('creates a modal on the owner desktop and monitor', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 1280, height: 720 },
        bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: 'owner', monitorId: 'right' }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'modal',
        ownerWindowId: 'owner',
      }),
    );

    expect(state.windows.modal.desktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(state.windows.modal.monitorId).toBe('right');
    expect(state.windows.modal.ownerWindowId).toBe('owner');
    expect(getWorkspace(state).activeWindowId).toBe('modal');
    expect(getWorkspace(state).activeMonitorId).toBe('right');
    expect(getWorkspace(state).orderedWindowIds.slice(-2)).toEqual([
      'owner',
      'modal',
    ]);
  });

  it('blocks background window focus while a modal is open', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: 'owner' }));
    state = windowManagerReducer(state, commands.createWindow({ id: 'other' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'modal',
        ownerWindowId: 'owner',
      }),
    );

    const nextState = windowManagerReducer(
      state,
      commands.focusWindow('other'),
    );

    expect(nextState).toBe(state);
    expect(getWorkspace(nextState).activeWindowId).toBe('modal');
  });

  it('limits focus traversal to the topmost modal while one is open', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: 'owner' }));
    state = windowManagerReducer(state, commands.createWindow({ id: 'other' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'modal',
        ownerWindowId: 'owner',
      }),
    );

    const nextState = windowManagerReducer(state, commands.focusNextWindow());

    expect(nextState).toBe(state);
    expect(getWorkspace(nextState).activeWindowId).toBe('modal');
  });

  it('minimize and restore window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(true);
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(false);
  });

  it('restore auto-switches to a different desktop and monitor', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(
      state,
      commands.createMonitor(
        'right',
        {
          size: { width: 1280, height: 720 },
          bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
        },
        'secondary',
      ),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '2',
        desktopId: 'secondary',
        monitorId: 'right',
      }),
    );
    state = windowManagerReducer(state, commands.minimizeWindow('2'));
    state = windowManagerReducer(
      state,
      commands.switchDesktop(DEFAULT_DESKTOP_ID),
    );

    state = windowManagerReducer(state, commands.restoreWindow('2'));

    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state, 'secondary').activeMonitorId).toBe('right');
    expect(state.windows['2'].state.minimized).toBe(false);
    expect(getWorkspace(state, 'secondary').activeWindowId).toBe('2');
  });

  it('does not minimize windows when the capability is disabled', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '1', flags: { minimizable: false } }),
    );

    const nextState = windowManagerReducer(state, commands.minimizeWindow('1'));

    expect(nextState).toBe(state);
    expect(nextState.windows['1'].state.minimized).toBe(false);
  });

  it('maximize and restore window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    const before = state.windows['1'].rect;
    state = windowManagerReducer(state, commands.maximizeWindow('1'));
    expect(state.windows['1'].state.maximized).toBe(true);
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].rect).toEqual(before);
  });

  it('maximizes using monitor bounds extents', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.setDesktop({
        size: { width: 1200, height: 700 },
        bounds: { minX: 20, minY: 10, maxX: 1180, maxY: 690 },
      }),
    );
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.maximizeWindow('1'));

    expect(state.windows['1'].rect).toEqual({
      x: 20,
      y: 10,
      width: 1160,
      height: 680,
    });
  });

  it('does not maximize windows when the capability is disabled', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '1', flags: { maximizable: false } }),
    );

    const nextState = windowManagerReducer(state, commands.maximizeWindow('1'));

    expect(nextState).toBe(state);
    expect(nextState.windows['1'].state.maximized).toBe(false);
  });

  it('closes window and updates the active window in its workspace', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.closeWindow('2'));

    expect(state.windows['2'].state.closed).toBe(true);
    expect(getWorkspace(state).activeWindowId).toBe('1');
  });

  it('closing an owner window also closes its modal descendants', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: 'owner' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'modal',
        ownerWindowId: 'owner',
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'child-modal',
        ownerWindowId: 'modal',
      }),
    );

    state = windowManagerReducer(state, commands.closeWindow('owner'));

    expect(state.windows.owner.state.closed).toBe(true);
    expect(state.windows.modal.state.closed).toBe(true);
    expect(state.windows['child-modal'].state.closed).toBe(true);
    expect(getWorkspace(state).activeWindowId).toBeNull();
  });

  it('minimizing the active window promotes the topmost remaining visible window and its monitor', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 1280, height: 720 },
        bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
      }),
    );
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '2', monitorId: 'right' }),
    );

    state = windowManagerReducer(state, commands.minimizeWindow('2'));

    expect(getWorkspace(state).activeWindowId).toBe('1');
    expect(getWorkspace(state).activeMonitorId).toBe(DEFAULT_MONITOR_ID);
  });

  it('restore brings a window to front and makes it active', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));

    state = windowManagerReducer(state, commands.restoreWindow('1'));

    expect(getWorkspace(state).activeWindowId).toBe('1');
    expect(
      getWorkspace(state).orderedWindowIds[
        getWorkspace(state).orderedWindowIds.length - 1
      ],
    ).toBe('1');
  });

  it('clears the active window when no visible windows remain', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));

    state = windowManagerReducer(state, commands.minimizeWindow('1'));
    expect(getWorkspace(state).activeWindowId).toBeNull();

    state = windowManagerReducer(state, commands.restoreWindow('1'));
    state = windowManagerReducer(state, commands.closeWindow('1'));
    expect(getWorkspace(state).activeWindowId).toBeNull();
  });

  it('resizes with min size enforcement', () => {
    const resized = resizeRect(
      { x: 0, y: 0, width: 200, height: 200 },
      'left',
      1000,
      0,
    );
    expect(resized.width).toBeGreaterThanOrEqual(160);
  });

  it('snaps moved windows to monitor edges when configured', () => {
    const snapped = snapRectToBounds(
      { x: 285, y: 50, width: 200, height: 120 },
      { minX: 0, minY: 0, maxX: 500, maxY: 300 },
      20,
    );

    expect(snapped.x).toBe(300);
    expect(snapped.y).toBe(50);
  });

  it('snaps resized edges to monitor bounds when configured', () => {
    const snapped = snapResizedRectToBounds(
      { x: 50, y: 40, width: 435, height: 120 },
      { minX: 0, minY: 0, maxX: 500, maxY: 300 },
      'right',
      20,
    );

    expect(snapped.width).toBe(450);
  });

  it('serializes and hydrates multi-monitor state', () => {
    const wm = createWindowManager();
    wm.createMonitor('right', {
      size: { width: 1280, height: 720 },
      bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
    });
    wm.createWindow({ id: '1' });
    wm.createWindow({ id: '2', monitorId: 'right' });
    wm.createWindow({ id: '3', ownerWindowId: '2' });

    const raw = serializeState(wm.getState());
    const hydrated = hydrateState(raw);

    expect(hydrated?.windows['1']).toBeDefined();
    expect(hydrated?.windows['2'].monitorId).toBe('right');
    expect(hydrated?.windows['3'].ownerWindowId).toBe('2');
    expect(hydrated?.windows['3'].monitorId).toBe('right');
    expect(hydrated?.desktops.default.monitors.right).toBeDefined();
  });

  it('returns null for malformed hydration payloads', () => {
    expect(hydrateState('{invalid json')).toBeNull();
  });

  it('returns null for structurally invalid hydration payloads', () => {
    const raw = JSON.stringify({
      version: 4,
      state: {
        version: 4,
        windows: [],
        desktops: null,
        activeDesktopId: null,
      },
    });

    expect(hydrateState(raw)).toBeNull();
  });

  it('migrates legacy single-desktop payloads into the default desktop workspace and monitor', () => {
    const raw = JSON.stringify({
      version: 1,
      state: {
        version: 1,
        desktop: {
          size: { width: 300, height: 200 },
          bounds: { minX: 0, minY: 0, maxX: 300, maxY: 200 },
        },
        windows: {
          one: {
            id: 'mismatched-id',
            title: 'One',
            state: { minimized: false, maximized: false, closed: false },
            rect: { x: 250, y: 150, width: 500, height: 500 },
            restoreRect: { x: -50, y: -20, width: 999, height: 999 },
            flags: {
              resizable: 'yes',
              movable: false,
              closable: true,
              minimizable: false,
              maximizable: 0,
            },
          },
          two: {
            state: { minimized: true, maximized: true, closed: false },
            rect: { x: 500, y: 500, width: 50, height: 50 },
            restoreRect: { x: 500, y: 500, width: 10, height: 10 },
            flags: {
              resizable: true,
              movable: true,
              closable: true,
              minimizable: true,
              maximizable: true,
            },
          },
        },
        orderedWindowIds: ['ghost', 'one', 'one'],
        activeWindowId: 'ghost',
      },
    });

    const hydrated = hydrateState(raw);
    const workspace = hydrated
      ? getWorkspace(hydrated, DEFAULT_DESKTOP_ID)
      : null;

    expect(hydrated).not.toBeNull();
    expect(hydrated?.version).toBe(4);
    expect(hydrated?.activeDesktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(workspace?.orderedWindowIds).toEqual(['two', 'one']);
    expect(workspace?.activeWindowId).toBe('one');
    expect(workspace?.activeMonitorId).toBe(DEFAULT_MONITOR_ID);
    expect(hydrated?.windows.one.id).toBe('one');
    expect(hydrated?.windows.one.desktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(hydrated?.windows.one.monitorId).toBe(DEFAULT_MONITOR_ID);
    expect(hydrated?.windows.one.rect).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 200,
    });
    expect(hydrated?.windows.one.restoreRect).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 200,
    });
  });

  it('migrates version 2 multi-desktop payloads into default monitors per desktop', () => {
    const raw = JSON.stringify({
      version: 2,
      state: {
        version: 2,
        activeDesktopId: 'secondary',
        desktops: {
          default: {
            id: 'default',
            desktop: {
              size: { width: 640, height: 480 },
              bounds: { minX: 0, minY: 0, maxX: 640, maxY: 480 },
            },
            orderedWindowIds: ['one'],
            activeWindowId: 'one',
          },
          secondary: {
            id: 'secondary',
            desktop: {
              size: { width: 800, height: 600 },
              bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
            },
            orderedWindowIds: ['two'],
            activeWindowId: 'two',
          },
        },
        windows: {
          one: {
            id: 'one',
            desktopId: 'default',
            state: { minimized: false, maximized: false, closed: false },
            rect: { x: 10, y: 10, width: 200, height: 120 },
            restoreRect: { x: 10, y: 10, width: 200, height: 120 },
            flags: {
              resizable: true,
              movable: true,
              closable: true,
              minimizable: true,
              maximizable: true,
            },
          },
          two: {
            id: 'two',
            desktopId: 'secondary',
            state: { minimized: false, maximized: false, closed: false },
            rect: { x: 20, y: 20, width: 240, height: 160 },
            restoreRect: { x: 20, y: 20, width: 240, height: 160 },
            flags: {
              resizable: true,
              movable: true,
              closable: true,
              minimizable: true,
              maximizable: true,
            },
          },
        },
      },
    });

    const hydrated = hydrateState(raw);

    expect(hydrated?.version).toBe(4);
    expect(hydrated?.activeDesktopId).toBe('secondary');
    expect(hydrated?.windows.one.monitorId).toBe(DEFAULT_MONITOR_ID);
    expect(hydrated?.windows.two.monitorId).toBe(DEFAULT_MONITOR_ID);
    expect(hydrated?.desktops.default.monitors.default).toBeDefined();
    expect(hydrated?.desktops.secondary.monitors.default).toBeDefined();
  });

  it('sanitizes reducer hydrate command payloads in the multi-monitor state shape', () => {
    const hydrated = windowManagerReducer(
      createInitialState(),
      commands.hydrateState({
        version: 4,
        activeDesktopId: DEFAULT_DESKTOP_ID,
        desktops: {
          [DEFAULT_DESKTOP_ID]: {
            id: DEFAULT_DESKTOP_ID,
            monitors: {
              [DEFAULT_MONITOR_ID]: {
                size: { width: 320, height: 240 },
                bounds: { minX: 0, minY: 0, maxX: 320, maxY: 240 },
              },
            },
            activeMonitorId: DEFAULT_MONITOR_ID,
            orderedWindowIds: ['missing', 'one'],
            activeWindowId: 'missing',
          },
        },
        windows: {
          one: {
            id: 'one',
            desktopId: DEFAULT_DESKTOP_ID,
            monitorId: DEFAULT_MONITOR_ID,
            title: 'One',
            state: { minimized: false, maximized: false, closed: false },
            rect: { x: 400, y: 400, width: 200, height: 200 },
            restoreRect: { x: 400, y: 400, width: 200, height: 200 },
            flags: {
              resizable: true,
              movable: true,
              closable: true,
              minimizable: true,
              maximizable: true,
            },
          },
        },
      }),
    );

    expect(getWorkspace(hydrated).orderedWindowIds).toEqual(['one']);
    expect(getWorkspace(hydrated).activeWindowId).toBe('one');
    expect(hydrated.windows.one.rect).toEqual({
      x: 120,
      y: 40,
      width: 200,
      height: 200,
    });
  });

  it('does not restore closed windows', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.closeWindow('1'));
    state = windowManagerReducer(state, commands.restoreWindow('1'));

    expect(state.windows['1'].state.closed).toBe(true);
    expect(getWorkspace(state).activeWindowId).toBeNull();
  });

  it('moves windows with monitor snapping when enabled', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.setDesktop({
        size: { width: 500, height: 300 },
        bounds: { minX: 0, minY: 0, maxX: 500, maxY: 300 },
        snap: { threshold: 20 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '1',
        rect: { x: 100, y: 40, width: 200, height: 120 },
      }),
    );
    state = windowManagerReducer(state, commands.moveWindow('1', 185, 0));

    expect(state.windows['1'].rect).toEqual({
      x: 300,
      y: 40,
      width: 200,
      height: 120,
    });
  });

  it('does not recreate state for no-op move commands', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));

    const nextState = windowManagerReducer(
      state,
      commands.moveWindow('1', 0, 0),
    );

    expect(nextState).toBe(state);
  });

  it('resizes windows with monitor snapping when enabled', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.setDesktop({
        size: { width: 500, height: 300 },
        bounds: { minX: 0, minY: 0, maxX: 500, maxY: 300 },
        snap: { threshold: 20 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '1',
        rect: { x: 50, y: 40, width: 200, height: 120 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.resizeWindow('1', 'right', 235, 0),
    );

    expect(state.windows['1'].rect).toEqual({
      x: 50,
      y: 40,
      width: 450,
      height: 120,
    });
  });

  it('fits right-edge resize to monitor bounds', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '1',
        rect: { x: 100, y: 40, width: 200, height: 120 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.resizeWindow('1', 'right', 2000, 0),
    );

    expect(state.windows['1'].rect).toEqual({
      x: 100,
      y: 40,
      width: 1180,
      height: 120,
    });
  });

  it('keeps the opposite edge stable when a left-edge resize reaches monitor bounds', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '1',
        rect: { x: 100, y: 40, width: 200, height: 120 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.resizeWindow('1', 'left', -200, 0),
    );

    expect(state.windows['1'].rect).toEqual({
      x: 0,
      y: 40,
      width: 300,
      height: 120,
    });
  });

  it('updates only the targeted monitor when setMonitor receives an explicit monitor id', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createMonitor('right', {
        size: { width: 600, height: 400 },
        bounds: { minX: 600, minY: 0, maxX: 1200, maxY: 400 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'default-window',
        rect: { x: 700, y: 100, width: 200, height: 150 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: 'right-window',
        monitorId: 'right',
        rect: { x: 1000, y: 100, width: 240, height: 150 },
        focus: false,
      }),
    );

    const nextState = windowManagerReducer(
      state,
      commands.setMonitor(
        {
          size: { width: 300, height: 200 },
          bounds: { minX: 600, minY: 0, maxX: 900, maxY: 200 },
        },
        DEFAULT_DESKTOP_ID,
        'right',
      ),
    );

    expect(nextState.activeDesktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(getMonitor(nextState).size.width).toBe(1280);
    expect(getMonitor(nextState, DEFAULT_DESKTOP_ID, 'right').size.width).toBe(
      300,
    );
    expect(nextState.windows['default-window'].rect).toEqual(
      state.windows['default-window'].rect,
    );
    expect(nextState.windows['right-window'].rect).toEqual({
      x: 660,
      y: 50,
      width: 240,
      height: 150,
    });
  });
});
