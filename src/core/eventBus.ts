export interface EventBus<T> {
  subscribe(handler: (event: T) => void): () => void;
  publish(event: T): void;
}

export function createEventBus<T>(): EventBus<T> {
  const handlers = new Set<(event: T) => void>();

  return {
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    publish(event) {
      handlers.forEach(handler => handler(event));
    },
  };
}
