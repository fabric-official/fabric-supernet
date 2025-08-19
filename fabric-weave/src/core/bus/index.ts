import mitt, { Emitter } from 'mitt';

export type EventBus = Emitter<Record<string, any>>;

export function createBus(): EventBus {
  return mitt();
}