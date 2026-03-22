import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './eventBus';

describe('event bus', () => {
  it('subscribes, publishes, and unsubscribes handlers', () => {
    const bus = createEventBus<{ type: 'x'; payload: number }>();
    const fn = vi.fn();

    const unsubscribe = bus.subscribe(fn);
    bus.publish({ type: 'x', payload: 1 });
    expect(fn).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.publish({ type: 'x', payload: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
