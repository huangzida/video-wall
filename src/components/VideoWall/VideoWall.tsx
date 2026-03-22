import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { VideoWindow } from '../VideoWindow';
import { DebugPanel } from '../DebugPanel';
import { useVideoWall } from '../../hooks/useVideoWall';
import type { VideoWallProps, VideoWallRef } from '../../types';
import { getRectCenter } from '../../utils/coordinate';
import { calculateCellPositions, findCellAtPosition } from '../../utils/layout';

function snapToGrid(value: number, gridSize: number, threshold: number = 5): number {
  if (!gridSize || gridSize <= 0) return value;
  const snapped = Math.round(value / gridSize) * gridSize;
  if (Math.abs(snapped - value) <= threshold) {
    return snapped;
  }
  return value;
}

export const VideoWall = forwardRef<VideoWallRef, VideoWallProps>((props, ref) => {
  const {
    layout,
    cells,
    gap = 0,
    background,
    debug = false,
    showBorder = true,
    showTitle = true,
    showCollapse = false,
    minSelectionSize = 20,
    defaultMinSize = [100, 75],
    defaultSnapGrid = 10,
    onLayoutChange,
    onWindowCreate,
    onWindowBeforeCreate,
    onWindowClose,
    onWindowActive,
    onMaxWindowsReached,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const dragStateRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    target: HTMLElement | null;
    windowId: string | null;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    initialWidth: number;
    initialHeight: number;
    resizeDir: string | null;
    snapGrid: number;
    minWidth: number;
    minHeight: number;
  }>({
    isDragging: false,
    isResizing: false,
    target: null,
    windowId: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    initialWidth: 0,
    initialHeight: 0,
    resizeDir: null,
    snapGrid: 10,
    minWidth: 100,
    minHeight: 75,
  });

  const selectionRef = useRef<{
    isSelecting: boolean;
    startX: number;
    startY: number;
  }>({
    isSelecting: false,
    startX: 0,
    startY: 0,
  });

  const {
    windows,
    setWindows,
    addWindow,
    removeWindow,
    updateWindow,
    activateWindow,
    setLayout,
    applyPreset,
    scale,
    wallSize,
    handleContainerResize,
  } = useVideoWall(props, containerRef);

  useImperativeHandle(ref, () => ({
    addWindow: (config) => {
      const id = addWindow(config);
      if (id) {
        onWindowCreate?.({ ...config, id } as any);
        onWindowActive?.(id);
      }
      return id;
    },
    removeWindow: (id) => {
      removeWindow(id);
      onWindowClose?.(id);
    },
    updateWindow,
    getWindows: () => windows,
    getWindow: (id) => windows.find(w => w.id === id),
    setLayout: (newLayout) => {
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    },
    applyPreset,
    getScale: () => scale,
    getViewport: () => ({ width: wallSize.width, height: wallSize.height }),
  }));

  const scaledWidth = wallSize.width * scale;
  const scaledHeight = wallSize.height * scale;

  useEffect(() => {
    if (!wallRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      const selection = selectionRef.current;

      if (drag.isResizing && drag.target) {
        e.preventDefault();
        const dx = (e.clientX - drag.startX) / scale;
        const dy = (e.clientY - drag.startY) / scale;

        let newLeft = drag.initialLeft;
        let newTop = drag.initialTop;
        let newWidth = drag.initialWidth;
        let newHeight = drag.initialHeight;

        const dir = drag.resizeDir;

        if (dir?.includes('e')) newWidth = Math.max(drag.minWidth, drag.initialWidth + dx);
        if (dir?.includes('w')) {
          newWidth = Math.max(drag.minWidth, drag.initialWidth - dx);
          newLeft = drag.initialLeft + dx;
        }
        if (dir?.includes('s')) newHeight = Math.max(drag.minHeight, drag.initialHeight + dy);
        if (dir?.includes('n')) {
          newHeight = Math.max(drag.minHeight, drag.initialHeight - dy);
          newTop = drag.initialTop + dy;
        }

        newLeft = snapToGrid(newLeft, drag.snapGrid);
        newTop = snapToGrid(newTop, drag.snapGrid);
        newWidth = snapToGrid(newWidth, drag.snapGrid);
        newHeight = snapToGrid(newHeight, drag.snapGrid);

        drag.target.style.left = `${newLeft * scale}px`;
        drag.target.style.top = `${newTop * scale}px`;
        drag.target.style.width = `${newWidth * scale}px`;
        drag.target.style.height = `${newHeight * scale}px`;
        return;
      }

      if (drag.isDragging && drag.target) {
        const dx = (e.clientX - drag.startX) / scale;
        const dy = (e.clientY - drag.startY) / scale;

        let newLeft = drag.initialLeft + dx;
        let newTop = drag.initialTop + dy;

        newLeft = snapToGrid(newLeft, drag.snapGrid);
        newTop = snapToGrid(newTop, drag.snapGrid);

        newLeft = Math.max(0, Math.min(newLeft, wallSize.width - (drag.target.offsetWidth / scale)));
        newTop = Math.max(0, Math.min(newTop, wallSize.height - (drag.target.offsetHeight / scale)));

        drag.target.style.left = `${newLeft * scale}px`;
        drag.target.style.top = `${newTop * scale}px`;
        return;
      }

      if (selection.isSelecting) {
        const selEl = wallRef.current?.querySelector('.selection-box') as HTMLElement;
        if (selEl) {
          const wallRect = wallRef.current?.getBoundingClientRect();
          if (!wallRect) return;
          
          const endX = e.clientX - wallRect.left;
          const endY = e.clientY - wallRect.top;
          const left = Math.min(selection.startX, endX);
          const top = Math.min(selection.startY, endY);
          const width = Math.abs(endX - selection.startX);
          const height = Math.abs(endY - selection.startY);
          selEl.style.left = `${left}px`;
          selEl.style.top = `${top}px`;
          selEl.style.width = `${width}px`;
          selEl.style.height = `${height}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      const selection = selectionRef.current;

      if (drag.isResizing && drag.target) {
        drag.isResizing = false;
        if (drag.windowId) {
          const newLeft = parseFloat(drag.target.style.left || '0') / scale;
          const newTop = parseFloat(drag.target.style.top || '0') / scale;
          const newWidth = parseFloat(drag.target.style.width || '0') / scale;
          const newHeight = parseFloat(drag.target.style.height || '0') / scale;
          updateWindow(drag.windowId, { position: [newLeft, newTop], size: [newWidth, newHeight] });
        }
        drag.target = null;
        drag.windowId = null;
        drag.resizeDir = null;
        return;
      }

      if (drag.isDragging) {
        drag.isDragging = false;

        if (drag.windowId && drag.target) {
          const newLeft = parseFloat(drag.target.style.left || '0') / scale;
          const newTop = parseFloat(drag.target.style.top || '0') / scale;
          updateWindow(drag.windowId, { position: [newLeft, newTop] });

          const rect = drag.target.getBoundingClientRect();
          const center = getRectCenter({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
          const wallRect = wallRef.current?.getBoundingClientRect();
          if (wallRect) {
            const relativeX = (center.x - wallRect.left) / scale;
            const relativeY = (center.y - wallRect.top) / scale;
            if (
              relativeX < 0 || relativeX > wallSize.width ||
              relativeY < 0 || relativeY > wallSize.height
            ) {
              removeWindow(drag.windowId);
              onWindowClose?.(drag.windowId);
            }
          }
        }
        drag.target = null;
        drag.windowId = null;
        return;
      }

      if (selection.isSelecting) {
        selection.isSelecting = false;
        const selEl = wallRef.current?.querySelector('.selection-box') as HTMLElement;
        if (selEl) {
          const left = parseFloat(selEl.style.left);
          const top = parseFloat(selEl.style.top);
          const width = parseFloat(selEl.style.width);
          const height = parseFloat(selEl.style.height);

          const x = left / scale;
          const y = top / scale;
          const w = width / scale;
          const h = height / scale;

          if (w >= minSelectionSize && h >= minSelectionSize) {
            const isOccupied = windows.some(win => {
              return x >= win.position[0] && x <= win.position[0] + win.size[0] &&
                     y >= win.position[1] && y <= win.position[1] + win.size[1];
            });

            if (!isOccupied) {
              const cellPositions = calculateCellPositions(cells, layout, gap);
              const cell = findCellAtPosition(x, y, cellPositions);
              
              if (cell) {
                const cellId = cell.cellId;
                const cellConfig = cells.find(c => c.id === cellId);
                const maxWindows = cellConfig?.maxWindows;
                
                if (maxWindows !== undefined) {
                  const windowsInCell = windows.filter(w => w.cellId === cellId).length;
                  if (windowsInCell >= maxWindows) {
                    onMaxWindowsReached?.(cellId, maxWindows);
                    selEl.remove();
                    selection.isSelecting = false;
                    selection.startX = 0;
                    selection.startY = 0;
                    return;
                  }
                }
              }

              const config: any = {
                position: [x, y],
                size: [w, h],
                streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                title: `Window ${windows.length + 1}`,
                cellId: cell?.cellId ?? '',
                minSize: defaultMinSize,
                snapGrid: defaultSnapGrid,
              };

              const finalConfig = onWindowBeforeCreate?.(config) ?? config;
              if (finalConfig) {
                const id = addWindow(finalConfig);
                if (id) {
                  onWindowCreate?.(finalConfig);
                }
              }
            }
          }
          selEl.remove();
        }
        selection.startX = 0;
        selection.startY = 0;
      }
    };

    const handleMousedown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const resizeHandle = target.closest('[data-resize-dir]') as HTMLElement | null;
      if (resizeHandle) {
        const windowEl = resizeHandle.closest('[data-window-id]') as HTMLElement | null;
        if (!windowEl) return;

        const windowId = windowEl.getAttribute('data-window-id');
        if (!windowId) return;

        const win = windows.find(w => w.id === windowId);
        if (win?.locked) {
          setSelectedTarget(windowId);
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        activateWindow(windowId);
        setSelectedTarget(windowId);

        dragStateRef.current = {
          isDragging: false,
          isResizing: true,
          target: windowEl,
          windowId,
          startX: e.clientX,
          startY: e.clientY,
          initialLeft: parseFloat(windowEl.style.left || '0') / scale,
          initialTop: parseFloat(windowEl.style.top || '0') / scale,
          initialWidth: parseFloat(windowEl.style.width || '0') / scale,
          initialHeight: parseFloat(windowEl.style.height || '0') / scale,
          resizeDir: resizeHandle.getAttribute('data-resize-dir'),
          snapGrid: win?.snapGrid ?? 10,
          minWidth: win?.minSize?.[0] ?? 100,
          minHeight: win?.minSize?.[1] ?? 75,
        };
        return;
      }

      const windowEl = target.closest('[data-window-id]') as HTMLElement | null;

      if (!windowEl) {
        e.preventDefault();
        
        const wallRect = wallRef.current?.getBoundingClientRect();
        if (!wallRect) return;

        const relativeX = e.clientX - wallRect.left;
        const relativeY = e.clientY - wallRect.top;

        selectionRef.current = {
          isSelecting: true,
          startX: relativeX,
          startY: relativeY,
        };

        const selEl = document.createElement('div');
        selEl.className = 'selection-box';
        selEl.style.cssText = `
          position: absolute;
          left: ${relativeX}px;
          top: ${relativeY}px;
          width: 0;
          height: 0;
          border: 2px dashed rgba(99, 102, 241, 0.8);
          background: rgba(99, 102, 241, 0.1);
          pointer-events: none;
          z-index: 9999;
        `;
        wallRef.current?.appendChild(selEl);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const windowId = windowEl.getAttribute('data-window-id');
      if (!windowId) return;

      const win = windows.find(w => w.id === windowId);

      activateWindow(windowId);
      setSelectedTarget(windowId);

      if (win?.locked) return;

      dragStateRef.current = {
        isDragging: true,
        isResizing: false,
        target: windowEl,
        windowId,
        startX: e.clientX,
        startY: e.clientY,
        initialLeft: parseFloat(windowEl.style.left || '0') / scale,
        initialTop: parseFloat(windowEl.style.top || '0') / scale,
        initialWidth: 0,
        initialHeight: 0,
        resizeDir: null,
        snapGrid: win?.snapGrid ?? 10,
        minWidth: win?.minSize?.[0] ?? 100,
        minHeight: win?.minSize?.[1] ?? 75,
      };
    };

    wallRef.current?.addEventListener('mousedown', handleMousedown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      wallRef.current?.removeEventListener('mousedown', handleMousedown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [wallSize.width, wallSize.height, scale, activateWindow, removeWindow, updateWindow, onWindowClose, addWindow, onWindowBeforeCreate, onWindowCreate, windows, cells, layout, gap, onMaxWindowsReached]);

  useEffect(() => {
    if (containerRef.current) {
      handleContainerResize();
    }
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        handleContainerResize();
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [handleContainerResize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedTarget) {
        removeWindow(selectedTarget);
        onWindowClose?.(selectedTarget);
        setSelectedTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTarget, removeWindow, onWindowClose]);

  const cellPositionsCalc = calculateCellPositions(cells, layout, gap);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: background?.color ?? '#0a0a12',
        backgroundImage: background?.image ? `url(${background.image})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div
        ref={wallRef}
        style={{
          position: 'relative',
          width: scaledWidth,
          height: scaledHeight,
          background: background?.color 
            ? background.color 
            : 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
          backgroundImage: background?.image ? `url(${background.image})` : undefined,
          backgroundSize: 'cover',
          borderRadius: 12,
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
        }}
      >
        {cellPositionsCalc.map((cell, index) => (
          <div
            key={cell.cellId}
            data-cell-id={cell.cellId}
            style={{
              position: 'absolute',
              left: cell.x * scale,
              top: cell.y * scale,
              width: cell.width * scale,
              height: cell.height * scale,
              border: '1px solid rgba(99, 102, 241, 0.12)',
              background: index % 2 === 0 
                ? 'rgba(99, 102, 241, 0.02)' 
                : 'rgba(168, 85, 247, 0.015)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              padding: '2px 6px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 4,
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'ui-monospace, monospace',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}>
              {index + 1}
            </div>
          </div>
        ))}

        {windows.map((win) => (
          <VideoWindow
            key={win.id}
            window={{
              ...win,
              position: [win.position[0] * scale, win.position[1] * scale],
              size: [win.size[0] * scale, win.size[1] * scale],
            }}
            showBorder={showBorder}
            showTitle={showTitle}
            showCollapse={showCollapse}
            onMove={(id, pos) => updateWindow(id, { position: pos })}
            onResize={(id, size) => updateWindow(id, { size })}
            onClose={(id) => {
              removeWindow(id);
              onWindowClose?.(id);
            }}
            onActivate={(id) => {
              activateWindow(id);
              onWindowActive?.(id);
            }}
            onCollapse={(id, collapsed) => {
              updateWindow(id, { collapsed });
            }}
          />
        ))}
      </div>

      {debug && (
        <DebugPanel
          info={{
            scale,
            viewport: { width: wallSize.width, height: wallSize.height },
            totalWindows: windows.length,
            visibleWindows: windows.filter(w => w.isActive).length,
          }}
        />
      )}
    </div>
  );
});

VideoWall.displayName = 'VideoWall';
