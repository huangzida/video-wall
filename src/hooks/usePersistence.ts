import { useEffect, useRef } from 'react';
import type { WindowState, Layout } from '../types';
import { restoreWithFallback, type SnapshotPayload } from '../engines/persistenceEngine';

interface PersistenceConfig {
  enabled: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  key?: string;
}

interface PersistenceData {
  schemaVersion?: number;
  layout: Layout;
  windows: WindowState[];
}

export function usePersistence(
  config: PersistenceConfig | undefined,
  windows: WindowState[],
  layout: Layout,
  setWindows: (windows: WindowState[]) => void,
  setLayout: (layout: Layout) => void
) {
  const storage = config?.storage ?? 'localStorage';
  const key = config?.key ?? 'video-wall-state';
  
  const loadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  const setWindowsRef = useRef(setWindows);
  setWindowsRef.current = setWindows;
  
  const setLayoutRef = useRef(setLayout);
  setLayoutRef.current = setLayout;

  // Load from storage when persistence is enabled
  useEffect(() => {
    if (!config?.enabled) return;
    if (loadedRef.current) return;
    
    isLoadingRef.current = true;
    loadedRef.current = true;
    
    try {
      const data = window[storage].getItem(key);
      if (data) {
        const parsed: PersistenceData = JSON.parse(data);
        const restored = restoreWithFallback(
          {
            schemaVersion: parsed.schemaVersion ?? 1,
            layout: parsed.layout,
            windows: parsed.windows,
          } as SnapshotPayload,
          3
        );

        const effective = restored.ok ? restored.data : (restored.error.detail as any).fallback;

        if (effective.windows?.length > 0) {
          setWindowsRef.current(effective.windows);
        }
        if (effective.layout) {
          setLayoutRef.current(effective.layout);
        }
      }
    } catch (e) {}
    
    isLoadingRef.current = false;
  }, [config?.enabled, storage, key]);

  // Save when state changes (only after loading completes)
  useEffect(() => {
    if (!config?.enabled) return;
    if (isLoadingRef.current) return;  // Skip save while loading
    
    try {
      window[storage].setItem(key, JSON.stringify({ layout, windows }));
    } catch (e) {}
  }, [config?.enabled, layout, windows, storage, key]);
}
