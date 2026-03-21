import { useEffect, useCallback } from 'react';
import type { WindowState } from '../types';

interface PersistenceConfig {
  enabled: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  key?: string;
}

export function usePersistence(
  config: PersistenceConfig | undefined,
  windows: WindowState[],
  setWindows: (windows: WindowState[]) => void
) {
  const storage = config?.storage ?? 'localStorage';
  const key = config?.key ?? 'video-wall-state';

  const save = useCallback(() => {
    if (!config?.enabled) return;
    try {
      const data = JSON.stringify(windows);
      window[storage].setItem(key, data);
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [config?.enabled, windows, storage, key]);

  const load = useCallback(() => {
    if (!config?.enabled) return;
    try {
      const data = window[storage].getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as WindowState[];
        setWindows(parsed);
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }, [config?.enabled, storage, key, setWindows]);

  const clear = useCallback(() => {
    if (!config?.enabled) return;
    try {
      window[storage].removeItem(key);
    } catch (e) {
      console.warn('Failed to clear state:', e);
    }
  }, [config?.enabled, storage, key]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    save();
  }, [windows]);

  return { save, load, clear };
}
