import { describe, expect, it } from 'vitest';
import { commands, createInitialState, createWindowManager, hydrateState, serializeState, windowManagerReducer } from '../src';
import { resizeRect } from '../src/math';

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
    expect(state.orderedWindowIds.at(-1)).toBe('1');
    expect(state.activeWindowId).toBe('1');
  });

  it('minimize and restore window', () => {
    let state = createInitialState();
    state = windowManagerReducer(state, commands.createWindow({ id: '1' }));
    state = windowManagerReducer(state, commands.minimizeWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(true);
    state = windowManagerReducer(state, commands.restoreWindow('1'));
    expect(state.windows['1'].state.minimized).toBe(false);
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

});
