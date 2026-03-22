import { useEffect, useRef } from 'react';
import type { WindowState, Layout } from '../types';

interface PersistenceConfig {
  enabled: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  key?: string;
}

interface PersistenceData {
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
        if (parsed.windows?.length > 0) {
          setWindowsRef.current(parsed.windows);
        }
        if (parsed.layout) {
          setLayoutRef.current(parsed.layout);
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
