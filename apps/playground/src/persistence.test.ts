import { createWindowManager, hydrateState } from '@window-manager/core';
import { describe, expect, it, vi } from 'vitest';

import { createPersistedWindowManager, PLAYGROUND_STORAGE_KEY } from './persistence';

function createStorage(seed?: string) {
  const data = new Map<string, string>();

  if (seed) {
    data.set(PLAYGROUND_STORAGE_KEY, seed);
  }

  return {
    data,
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
  };
}

describe('playground persistence', () => {
  it('hydrates the manager from persisted state', () => {
    const seededManager = createWindowManager();
    seededManager.createWindow({ id: 'saved', title: 'Saved window' });
    const storage = createStorage(seededManager.serialize());

    const manager = createPersistedWindowManager(storage);

    expect(storage.getItem).toHaveBeenCalledWith(PLAYGROUND_STORAGE_KEY);
    expect(manager.getState().windows.saved?.title).toBe('Saved window');
  });

  it('persists manager updates back to storage', () => {
    const storage = createStorage();
    const manager = createPersistedWindowManager(storage);

    manager.createWindow({ id: 'live', title: 'Live window' });

    expect(storage.setItem).toHaveBeenCalledWith(PLAYGROUND_STORAGE_KEY, expect.any(String));

    const persisted = storage.data.get(PLAYGROUND_STORAGE_KEY);
    const hydrated = persisted ? hydrateState(persisted) : null;

    expect(hydrated?.windows.live?.title).toBe('Live window');
  });
});
