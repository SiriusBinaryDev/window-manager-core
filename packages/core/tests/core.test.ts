import { describe, expect, it } from 'vitest';
import { commands, createInitialState, createWindowManager, hydrateState, serializeState, windowManagerReducer } from '../src';
import { resizeRect, snapRectToBounds, snapResizedRectToBounds } from '../src/math';

describe('window manager core', () => {
  it('creates windows', () => {
    const state = windowManagerReducer(createInitialState(), commands.createWindow({ id: '1' }));
    expect(state.windows['1']).toBeDefined();
    expect(state.activeWindowId).toBe('1');
  });

  it('focus updates z-order', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.focusWindow('1'));
    expect(state.orderedWindowIds[state.orderedWindowIds.length - 1]).toBe('1');
    expect(state.activeWindowId).toBe('1');
  });

  it('does not recreate state when focusing the already active front window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));

    const nextState = windowManagerReducer(state, commands.focusWindow('1'));

    expect(nextState).toBe(state);
  });

  it('focus next window cycles through visible windows', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(state.activeWindowId).toBe('1');

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(state.activeWindowId).toBe('2');

    state = windowManagerReducer(state, commands.focusNextWindow());
    expect(state.activeWindowId).toBe('3');
  });

  it('focus previous window cycles through visible windows in reverse', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '3' }));

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(state.activeWindowId).toBe('2');

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(state.activeWindowId).toBe('1');

    state = windowManagerReducer(state, commands.focusPreviousWindow());
    expect(state.activeWindowId).toBe('3');
  });

  it('minimize and restore window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(true);
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(false);
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

  it('closes window and updates active', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.createWindow({ id: '2' }));
    state = windowManagerReducer(state, commands.closeWindow('2'));
    expect(state.windows['2'].state.closed).toBe(true);
    expect(state.activeWindowId).toBe('1');
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

  it('serializes and hydrates state', () => {
    const wm = createWindowManager();
    wm.createWindow({ id: '1' });
    const raw = serializeState(wm.getState());
    const hydrated = hydrateState(raw);
    expect(hydrated?.windows['1']).toBeDefined();
  });


  it('returns null for malformed hydration payloads', () => {
    expect(hydrateState('{invalid json')).toBeNull();
  });

  it('returns null for structurally invalid hydration payloads', () => {
    const raw = JSON.stringify({
      version: 1,
      state: {
        version: 1,
        windows: [],
        orderedWindowIds: [],
        activeWindowId: null,
        desktop: null,
      },
    });

    expect(hydrateState(raw)).toBeNull();
  });

  it('does not restore closed windows', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.closeWindow('1'));
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].state.closed).toBe(true);
    expect(state.activeWindowId).toBeNull();
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

  it('sanitizes hydrated state geometry and focus ordering', () => {
    const raw = JSON.stringify({
      version: 1,
      state: {
        version: 999,
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

    expect(hydrated).not.toBeNull();
    expect(hydrated?.version).toBe(1);
    expect(hydrated?.orderedWindowIds).toEqual(['two', 'one']);
    expect(hydrated?.activeWindowId).toBe('one');
    expect(hydrated?.windows.one.id).toBe('one');
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

  it('sanitizes reducer hydrate command payloads', () => {
    const hydrated = windowManagerReducer(
      createInitialState(),
      commands.hydrateState({
        version: 1,
        desktop: {
          size: { width: 320, height: 240 },
          bounds: { minX: 0, minY: 0, maxX: 320, maxY: 240 },
        },
        windows: {
          one: {
            id: 'one',
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
        orderedWindowIds: ['missing', 'one'],
        activeWindowId: 'missing',
      }),
    );

    expect(hydrated.orderedWindowIds).toEqual(['one']);
    expect(hydrated.activeWindowId).toBe('one');
    expect(hydrated.windows.one.rect).toEqual({ x: 120, y: 40, width: 200, height: 200 });
  });

});
