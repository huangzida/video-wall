import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  VideoWallRef,
  VideoWallProps,
  WindowState,
  WindowConfig,
  Layout,
} from '../types';
import { usePersistence } from './usePersistence';
import { getWallSize, calculateCellPositions, calculateScale } from '../utils/layout';

export function useVideoWall(props: Omit<VideoWallProps, 'ref'>, containerRef: React.RefObject<HTMLDivElement | null>) {
  const {
    layout: propLayout,
    cells,
    gap = 0,
    scaleMode = 'contain',
    customScale,
    persistence,
    defaultMinSize,
    onLayoutChange,
  } = props;

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [layout, setLayout] = useState<Layout>(propLayout);
  const propLayoutRef = useRef(propLayout);
  propLayoutRef.current = propLayout;
  const pendingLayoutRef = useRef<Layout | null>(null);
  const isFromInternalRef = useRef(false);

  // Sync layout from props when it changes
  useEffect(() => {
    if (!isFromInternalRef.current) {
      setLayout(propLayout);
    }
    isFromInternalRef.current = false;
  }, [propLayout]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  usePersistence(persistence, windows, layout, setWindows, setLayout);

  const cellPositions = useMemo(
    () => calculateCellPositions(cells, layout, gap),
    [cells, layout, gap]
  );

  const wallSize = useMemo(
    () => getWallSize(cells, layout, gap),
    [cells, layout, gap]
  );

  const scale = useMemo(
    () => calculateScale(wallSize, containerSize, scaleMode, customScale),
    [wallSize, containerSize, scaleMode, customScale]
  );

  const getMaxZIndex = useCallback(() => {
    if (windows.length === 0) return 0;
    return Math.max(...windows.map(w => w.zIndex));
  }, [windows]);

  const addWindow = useCallback((config: Partial<WindowConfig>): string | null => {
    const id = `window-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const maxZ = getMaxZIndex();
    
    const newWindow: WindowState = {
      id,
      cellId: config.cellId ?? cells[0]?.id ?? '',
      position: config.position ?? [0, 0],
      size: config.size ?? [400, 300],
      streamUrl: config.streamUrl ?? '',
      title: config.title,
      locked: config.locked ?? false,
      border: config.border,
      minSize: config.minSize ?? defaultMinSize ?? [200, 150],
      snapGrid: config.snapGrid ?? 10,
      zIndex: maxZ + 1,
      isActive: true,
      collapsed: false,
    };

    setWindows(prev => [...prev.map(w => ({ ...w, isActive: false })), newWindow]);
    return id;
  }, [cells, getMaxZIndex]);

  const removeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const activateWindow = useCallback((id: string) => {
    const maxZ = getMaxZIndex();
    setWindows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, zIndex: maxZ + 1, isActive: true }
        : { ...w, isActive: false }
    ));
  }, [getMaxZIndex]);

  const handleSetLayout = useCallback((newLayout: Layout) => {
    isFromInternalRef.current = true;
    pendingLayoutRef.current = newLayout;
    setLayout(newLayout);
    const currentPropLayout = propLayoutRef.current;
    if (currentPropLayout.rows !== newLayout.rows || currentPropLayout.cols !== newLayout.cols) {
      onLayoutChange?.(newLayout);
    }
  }, [onLayoutChange]);

  const applyPreset = useCallback((presetName: string) => {
    const preset = props.presets?.find(p => p.name === presetName);
    if (!preset) return;

    setWindows([]);
    
    const positions = calculateCellPositions(cells, layout, gap);
    if (positions.length === 0) return;
    
    const defaultStreamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    preset.windows.forEach((winConfig, index) => {
      const cellIndex = parseInt(winConfig.cellId) || index;
      const cellPos = positions[cellIndex] || positions[0];
      
      if (!cellPos) return;
      
      const position: [number, number] = [
        cellPos.x,
        cellPos.y,
      ];
      const size: [number, number] = [
        cellPos.width,
        cellPos.height,
      ];
      
      addWindow({
        ...winConfig,
        position,
        size,
        cellId: winConfig.cellId || String(cellIndex),
        streamUrl: winConfig.streamUrl || defaultStreamUrl,
      });
    });
  }, [props.presets, addWindow, cells, layout, wallSize, gap]);

  const handleContainerResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, [containerRef]);

  return {
    windows,
    setWindows,
    addWindow,
    removeWindow,
    updateWindow,
    activateWindow,
    setLayout: handleSetLayout,
    applyPreset,
    scale,
    wallSize,
    cellPositions,
    containerRef,
    handleContainerResize,
    layout,
  };
}