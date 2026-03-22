export interface HistoryState<T> {
  past: T[];
  future: T[];
  current?: T;
  capacity: number;
}

export function createHistory<T>(capacity: number): HistoryState<T> {
  return {
    past: [],
    future: [],
    capacity,
    current: undefined,
  };
}

export function pushHistory<T>(history: HistoryState<T>, entry: T): HistoryState<T> {
  const nextPast = [...history.past, entry];
  const cappedPast = nextPast.slice(Math.max(0, nextPast.length - history.capacity));
  return {
    ...history,
    past: cappedPast,
    current: entry,
    future: [],
  };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length <= 1) {
    return history;
  }

  const nextFuture = history.current === undefined
    ? history.future
    : [history.current, ...history.future];
  const nextPast = history.past.slice(0, -1);
  const nextCurrent = nextPast[nextPast.length - 1];

  return {
    ...history,
    past: nextPast,
    future: nextFuture,
    current: nextCurrent,
  };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history;
  }

  const [next, ...rest] = history.future;
  const nextPast = [...history.past, next].slice(Math.max(0, history.past.length + 1 - history.capacity));

  return {
    ...history,
    past: nextPast,
    future: rest,
    current: next,
  };
}
