import { createWindowManager, type WindowManager } from '@window-manager/core';

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const PLAYGROUND_STORAGE_KEY = 'window-manager-core:playground-state';

export function createPersistedWindowManager(
  storage: StorageLike,
  storageKey: string = PLAYGROUND_STORAGE_KEY,
): WindowManager {
  const instance = createWindowManager();
  const serialized = storage.getItem(storageKey);

  if (serialized) {
    instance.hydrate(serialized);
  }

  instance.subscribe(() => {
    storage.setItem(storageKey, instance.serialize());
  });

  return instance;
}
