import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, undoHistory, redoHistory } from './history';

describe('history', () => {
  it('pushes entries within capacity', () => {
    const history = createHistory<string>(2);
    const h1 = pushHistory(history, 'a');
    const h2 = pushHistory(h1, 'b');
    const h3 = pushHistory(h2, 'c');

    expect(h3.past).toEqual(['b', 'c']);
  });

  it('supports undo and redo', () => {
    const history = createHistory<string>(3);
    const h1 = pushHistory(history, 'a');
    const h2 = pushHistory(h1, 'b');
    const u1 = undoHistory(h2);

    expect(u1.current).toBe('a');

    const r1 = redoHistory(u1);
    expect(r1.current).toBe('b');
  });
});
