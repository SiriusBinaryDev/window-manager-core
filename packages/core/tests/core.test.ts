import { describe, expect, it } from 'vitest';
import {
  commands,
  createInitialState,
  createWindowManager,
  DEFAULT_DESKTOP_ID,
  hydrateState,
  serializeState,
  type WindowManagerState,
  windowManagerReducer,
} from '../src';
import { resizeRect, snapRectToBounds, snapResizedRectToBounds } from '../src/math';

function getWorkspace(
  state: WindowManagerState,
  desktopId: string = state.activeDesktopId,
) {
  return state.desktops[desktopId]!;
}

describe('window manager core', () => {
  it('creates windows in the active desktop', () => {
    const state = windowManagerReducer(createInitialState(), commands.createWindow({ id: '1' }));

    expect(state.windows['1']).toBeDefined();
    expect(state.windows['1'].desktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(getWorkspace(state).activeWindowId).toBe('1');
  });

  it('creates and switches desktops', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(state, commands.switchDesktop('secondary'));

    expect(state.desktops.secondary).toBeDefined();
    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state).orderedWindowIds).toEqual([]);
  });

  it('creates windows in an explicit desktop and switches to it when focused', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '2', desktopId: 'secondary' }),
    );

    expect(state.windows['2'].desktopId).toBe('secondary');
    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state, DEFAULT_DESKTOP_ID).orderedWindowIds).toEqual([]);
    expect(getWorkspace(state, 'secondary').orderedWindowIds).toEqual(['2']);
  });

  it('focus updates z-order within a desktop workspace', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.focusWindow('1'));

    expect(getWorkspace(state).orderedWindowIds[getWorkspace(state).orderedWindowIds.length - 1]).toBe('1');
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
    state = windowManagerReducer(state, commands.switchDesktop(DEFAULT_DESKTOP_ID));

    state = windowManagerReducer(state, commands.focusWindow('2'));

    expect(state.activeDesktopId).toBe('secondary');
    expect(getWorkspace(state, 'secondary').activeWindowId).toBe('2');
    const secondaryWorkspace = getWorkspace(state, 'secondary');
    expect(secondaryWorkspace.orderedWindowIds[secondaryWorkspace.orderedWindowIds.length - 1]).toBe('2');
  });

  it('minimize and restore window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(true);
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(false);
  });

  it('restore auto-switches to a different desktop', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createDesktop('secondary'));
    state = windowManagerReducer(
      state,
      commands.createWindow({ id: '2', desktopId: 'secondary' }),
    );
    state = windowManagerReducer(state, commands.minimizeWindow('2'));
    state = windowManagerReducer(state, commands.switchDesktop(DEFAULT_DESKTOP_ID));

    state = windowManagerReducer(state, commands.restoreWindow('2'));

    expect(state.activeDesktopId).toBe('secondary');
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

  it('minimizing the active window promotes the topmost remaining visible window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));

    state = windowManagerReducer(state, commands.minimizeWindow('3'));

    expect(getWorkspace(state).activeWindowId).toBe('2');
  });

  it('closing the active window skips minimized windows when choosing the next active window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));
    state = windowManagerReducer(state, commands.minimizeWindow('2'));

    state = windowManagerReducer(state, commands.closeWindow('3'));

    expect(getWorkspace(state).activeWindowId).toBe('1');
  });

  it('restore brings a window to front and makes it active', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));

    state = windowManagerReducer(state, commands.restoreWindow('1'));

    expect(getWorkspace(state).activeWindowId).toBe('1');
    expect(getWorkspace(state).orderedWindowIds[getWorkspace(state).orderedWindowIds.length - 1]).toBe('1');
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

  it('snaps moved windows to desktop edges when configured', () => {
    const snapped = snapRectToBounds(
      { x: 285, y: 50, width: 200, height: 120 },
      { minX: 0, minY: 0, maxX: 500, maxY: 300 },
      20,
    );

    expect(snapped.x).toBe(300);
    expect(snapped.y).toBe(50);
  });

  it('snaps resized edges to desktop bounds when configured', () => {
    const snapped = snapResizedRectToBounds(
      { x: 50, y: 40, width: 435, height: 120 },
      { minX: 0, minY: 0, maxX: 500, maxY: 300 },
      'right',
      20,
    );

    expect(snapped.width).toBe(450);
  });

  it('serializes and hydrates multi-desktop state', () => {
    const wm = createWindowManager();
    wm.createDesktop('secondary');
    wm.createWindow({ id: '1' });
    wm.createWindow({ id: '2', desktopId: 'secondary' });

    const raw = serializeState(wm.getState());
    const hydrated = hydrateState(raw);

    expect(hydrated?.windows['1']).toBeDefined();
    expect(hydrated?.windows['2'].desktopId).toBe('secondary');
    expect(hydrated?.desktops.secondary.orderedWindowIds).toEqual(['2']);
  });

  it('returns null for malformed hydration payloads', () => {
    expect(hydrateState('{invalid json')).toBeNull();
  });

  it('returns null for structurally invalid hydration payloads', () => {
    const raw = JSON.stringify({
      version: 2,
      state: {
        version: 2,
        windows: [],
        desktops: null,
        activeDesktopId: null,
      },
    });

    expect(hydrateState(raw)).toBeNull();
  });

  it('migrates legacy single-desktop payloads into the default desktop workspace', () => {
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
            flags: { resizable: 'yes', movable: false, closable: true, minimizable: false, maximizable: 0 },
          },
          two: {
            state: { minimized: true, maximized: true, closed: false },
            rect: { x: 500, y: 500, width: 50, height: 50 },
            restoreRect: { x: 500, y: 500, width: 10, height: 10 },
            flags: { resizable: true, movable: true, closable: true, minimizable: true, maximizable: true },
          },
        },
        orderedWindowIds: ['ghost', 'one', 'one'],
        activeWindowId: 'ghost',
      },
    });

    const hydrated = hydrateState(raw);
    const workspace = hydrated ? getWorkspace(hydrated, DEFAULT_DESKTOP_ID) : null;

    expect(hydrated).not.toBeNull();
    expect(hydrated?.version).toBe(2);
    expect(hydrated?.activeDesktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(workspace?.orderedWindowIds).toEqual(['two', 'one']);
    expect(workspace?.activeWindowId).toBe('one');
    expect(hydrated?.windows.one.id).toBe('one');
    expect(hydrated?.windows.one.desktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(hydrated?.windows.one.rect).toEqual({ x: 0, y: 0, width: 300, height: 200 });
    expect(hydrated?.windows.one.restoreRect).toEqual({ x: 0, y: 0, width: 300, height: 200 });
    expect(hydrated?.windows.one.flags).toEqual({
      resizable: true,
      movable: false,
      closable: true,
      minimizable: false,
      maximizable: true,
    });
    expect(hydrated?.windows.two.state).toEqual({ minimized: true, maximized: false, closed: false });
    expect(hydrated?.windows.two.rect).toEqual({ x: 140, y: 80, width: 160, height: 120 });
    expect(hydrated?.windows.two.restoreRect).toEqual({ x: 140, y: 80, width: 160, height: 120 });
  });

  it('sanitizes minimized and maximized state when capabilities are disabled', () => {
    const raw = JSON.stringify({
      version: 1,
      state: {
        version: 1,
        desktop: {
          size: { width: 640, height: 480 },
          bounds: { minX: 0, minY: 0, maxX: 640, maxY: 480 },
        },
        windows: {
          one: {
            id: 'one',
            state: { minimized: true, maximized: false, closed: false },
            rect: { x: 40, y: 40, width: 200, height: 120 },
            restoreRect: { x: 40, y: 40, width: 200, height: 120 },
            flags: { minimizable: false, maximizable: true },
          },
          two: {
            id: 'two',
            state: { minimized: false, maximized: true, closed: false },
            rect: { x: 80, y: 80, width: 200, height: 120 },
            restoreRect: { x: 80, y: 80, width: 200, height: 120 },
            flags: { minimizable: true, maximizable: false },
          },
        },
        orderedWindowIds: ['one', 'two'],
        activeWindowId: 'two',
      },
    });

    const hydrated = hydrateState(raw);

    expect(hydrated?.windows.one.state.minimized).toBe(false);
    expect(hydrated?.windows.two.state.maximized).toBe(false);
  });

  it('sanitizes reducer hydrate command payloads in the multi-desktop state shape', () => {
    const hydrated = windowManagerReducer(
      createInitialState(),
      commands.hydrateState({
        version: 2,
        activeDesktopId: DEFAULT_DESKTOP_ID,
        desktops: {
          [DEFAULT_DESKTOP_ID]: {
            id: DEFAULT_DESKTOP_ID,
            desktop: {
              size: { width: 320, height: 240 },
              bounds: { minX: 0, minY: 0, maxX: 320, maxY: 240 },
            },
            orderedWindowIds: ['missing', 'one'],
            activeWindowId: 'missing',
          },
        },
        windows: {
          one: {
            id: 'one',
            desktopId: DEFAULT_DESKTOP_ID,
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
    expect(hydrated.windows.one.rect).toEqual({ x: 120, y: 40, width: 200, height: 200 });
  });

  it('does not restore closed windows', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.closeWindow('1'));
    state = windowManagerReducer(state, commands.restoreWindow('1'));

    expect(state.windows['1'].state.closed).toBe(true);
    expect(getWorkspace(state).activeWindowId).toBeNull();
  });

  it('maximizes using desktop bounds extents', () => {
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

    expect(state.windows['1'].rect).toEqual({ x: 20, y: 10, width: 1160, height: 680 });
  });

  it('moves windows with desktop snapping when enabled', () => {
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

    expect(state.windows['1'].rect).toEqual({ x: 300, y: 40, width: 200, height: 120 });
  });

  it('does not recreate state for no-op move commands', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));

    const nextState = windowManagerReducer(state, commands.moveWindow('1', 0, 0));

    expect(nextState).toBe(state);
  });

  it('resizes windows with desktop snapping when enabled', () => {
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
    state = windowManagerReducer(state, commands.resizeWindow('1', 'right', 235, 0));

    expect(state.windows['1'].rect).toEqual({ x: 50, y: 40, width: 450, height: 120 });
  });

  it('updates only the targeted desktop when setDesktop receives an explicit desktop id', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.createDesktop('secondary', {
        size: { width: 600, height: 400 },
        bounds: { minX: 0, minY: 0, maxX: 600, maxY: 400 },
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
        id: 'secondary-window',
        desktopId: 'secondary',
        rect: { x: 400, y: 100, width: 240, height: 150 },
        focus: false,
      }),
    );

    const nextState = windowManagerReducer(
      state,
      commands.setDesktop(
        {
          size: { width: 300, height: 200 },
          bounds: { minX: 0, minY: 0, maxX: 300, maxY: 200 },
        },
        'secondary',
      ),
    );

    expect(nextState.activeDesktopId).toBe(DEFAULT_DESKTOP_ID);
    expect(getWorkspace(nextState, DEFAULT_DESKTOP_ID).desktop.size.width).toBe(1280);
    expect(getWorkspace(nextState, 'secondary').desktop.size.width).toBe(300);
    expect(nextState.windows['default-window'].rect).toEqual(state.windows['default-window'].rect);
    expect(nextState.windows['secondary-window'].rect).toEqual({
      x: 60,
      y: 50,
      width: 240,
      height: 150,
    });
  });

  it('does not recreate state when desktop values and clamped rects are unchanged', () => {
    let state = createInitialState();
    state = windowManagerReducer(
      state,
      commands.setDesktop({
        size: { width: 800, height: 600 },
        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
      }),
    );
    state = windowManagerReducer(
      state,
      commands.createWindow({
        id: '1',
        rect: { x: 100, y: 100, width: 200, height: 150 },
      }),
    );

    const nextState = windowManagerReducer(
      state,
      commands.setDesktop({
        size: { width: 800, height: 600 },
        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
      }),
    );

    expect(nextState).toBe(state);
  });
});
