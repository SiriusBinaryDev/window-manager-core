import { WINDOW_MANAGER_STATE_VERSION, type SerializationEnvelope, type WindowManagerState } from './types';

export function serializeState(state: WindowManagerState): string {
  const envelope: SerializationEnvelope = {
    version: WINDOW_MANAGER_STATE_VERSION,
    state,
  };

  return JSON.stringify(envelope);
}

export function hydrateState(raw: string): WindowManagerState | null {
  const parsed = JSON.parse(raw) as SerializationEnvelope;

  if (parsed.version !== WINDOW_MANAGER_STATE_VERSION) {
    return null;
  }

  return parsed.state;
}
