import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { VideoWindow } from '../VideoWindow';
import { DebugPanel } from '../DebugPanel';
import { useVideoWall } from '../../hooks/useVideoWall';
import type { VideoWallProps, VideoWallRef } from '../../types';
import { getRectCenter } from '../../utils/coordinate';
import { calculateCellPositions, findCellAtPosition } from '../../utils/layout';
import { applyResizePointerAnchor, computeDragPosition, computeResizeRect, resolveEmptyAreaDragMode } from '../../engines/interactionEngine';

export const VideoWall = forwardRef<VideoWallRef, VideoWallProps>((props, ref) => {
  const {
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
    persistence,
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
    pointerOffsetX: number;
    pointerOffsetY: number;
    initialLeft: number;
    initialTop: number;
    initialWidth: number;
    initialHeight: number;
    currentLeft: number;
    currentTop: number;
    currentWidth: number;
    currentHeight: number;
    resizeOffsetX: number;
    resizeOffsetY: number;
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
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    initialLeft: 0,
    initialTop: 0,
    initialWidth: 0,
    initialHeight: 0,
    currentLeft: 0,
    currentTop: 0,
    currentWidth: 0,
    currentHeight: 0,
    resizeOffsetX: 0,
    resizeOffsetY: 0,
    resizeDir: null,
    snapGrid: 10,
    minWidth: 100,
    minHeight: 75,
  });

  const selectionRef = useRef<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    startScale: number;
    mode: 'create' | 'select';
  }>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    startScale: 1,
    mode: 'create',
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
    layout,
  } = useVideoWall({ ...props, persistence }, containerRef);

  const windowsRef = useRef(windows);
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

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

  const logInteraction = (event: string, payload: Record<string, unknown>) => {
    if (!debug) return;
    console.debug(`[VideoWall:${event}]`, payload);
  };

  useEffect(() => {
    if (!wallRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      const selection = selectionRef.current;

      if (drag.isResizing && drag.target) {
        e.preventDefault();
        const wallRect = wallRef.current?.getBoundingClientRect();
        if (!wallRect) {
          logInteraction('resize-move-skip', { reason: 'wallRect-missing' });
          return;
        }

        const pointerX = (e.clientX - wallRect.left) / scale;
        const pointerY = (e.clientY - wallRect.top) / scale;
        const anchoredPointer = applyResizePointerAnchor({
          pointerX,
          pointerY,
          offsetX: drag.resizeOffsetX,
          offsetY: drag.resizeOffsetY,
          resizeDir: drag.resizeDir ?? 'se',
        });
        const next = computeResizeRect({
          pointerX: anchoredPointer.pointerX,
          pointerY: anchoredPointer.pointerY,
          resizeDir: drag.resizeDir ?? 'se',
          initialLeft: drag.initialLeft,
          initialTop: drag.initialTop,
          initialWidth: drag.initialWidth,
          initialHeight: drag.initialHeight,
          minWidth: drag.minWidth,
          minHeight: drag.minHeight,
          maxWidth: wallSize.width,
          maxHeight: wallSize.height,
          snapGrid: drag.snapGrid,
        });

        drag.currentLeft = next.left;
        drag.currentTop = next.top;
        drag.currentWidth = next.width;
        drag.currentHeight = next.height;

        if (drag.windowId) {
          logInteraction('resize-move', {
            windowId: drag.windowId,
            resizeDir: drag.resizeDir,
            pointer: { x: pointerX, y: pointerY },
            anchoredPointer,
            next,
            scale,
          });
          updateWindow(drag.windowId, {
            position: [next.left, next.top],
            size: [next.width, next.height],
          });
        }
        return;
      }

      if (drag.isDragging && drag.target) {
        const wallRect = wallRef.current?.getBoundingClientRect();
        if (!wallRect) {
          logInteraction('drag-move-skip', { reason: 'wallRect-missing' });
          return;
        }

        const pointerX = (e.clientX - wallRect.left) / scale;
        const pointerY = (e.clientY - wallRect.top) / scale;
        const next = computeDragPosition({
          pointerX,
          pointerY,
          pointerOffsetX: drag.pointerOffsetX,
          pointerOffsetY: drag.pointerOffsetY,
          maxLeft: wallSize.width - drag.initialWidth,
          maxTop: wallSize.height - drag.initialHeight,
          snapGrid: drag.snapGrid,
        });

        drag.currentLeft = next.left;
        drag.currentTop = next.top;

        if (drag.windowId) {
          logInteraction('drag-move', {
            windowId: drag.windowId,
            pointer: { x: pointerX, y: pointerY },
            next,
            scale,
          });
          updateWindow(drag.windowId, { position: [next.left, next.top] });
        }
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
          logInteraction('resize-end', {
            windowId: drag.windowId,
            final: {
              left: drag.currentLeft,
              top: drag.currentTop,
              width: drag.currentWidth,
              height: drag.currentHeight,
            },
            scale,
          });
          updateWindow(drag.windowId, {
            position: [drag.currentLeft, drag.currentTop],
            size: [drag.currentWidth, drag.currentHeight],
          });
        }
        drag.target = null;
        drag.windowId = null;
        drag.resizeOffsetX = 0;
        drag.resizeOffsetY = 0;
        drag.resizeDir = null;
        return;
      }

      if (drag.isDragging) {
        drag.isDragging = false;

        if (drag.windowId) {
          logInteraction('drag-end', {
            windowId: drag.windowId,
            final: {
              left: drag.currentLeft,
              top: drag.currentTop,
              width: drag.initialWidth,
              height: drag.initialHeight,
            },
            scale,
          });
          const center = getRectCenter({
            x: drag.currentLeft,
            y: drag.currentTop,
            width: drag.initialWidth,
            height: drag.initialHeight,
          });
          if (
            center.x < 0 || center.x > wallSize.width ||
            center.y < 0 || center.y > wallSize.height
          ) {
            removeWindow(drag.windowId);
            onWindowClose?.(drag.windowId);
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

          const selScale = selection.startScale;
          const x = left / selScale;
          const y = top / selScale;
          const w = width / selScale;
          const h = height / selScale;

          if (selection.mode === 'select') {
            const matched = windowsRef.current
              .filter(win => {
                const winLeft = win.position[0];
                const winTop = win.position[1];
                const winRight = winLeft + win.size[0];
                const winBottom = winTop + win.size[1];
                const selRight = x + w;
                const selBottom = y + h;
                return !(winRight < x || winLeft > selRight || winBottom < y || winTop > selBottom);
              })
              .sort((a, b) => b.zIndex - a.zIndex);

            if (matched[0]) {
              activateWindow(matched[0].id);
              setSelectedTarget(matched[0].id);
            }

            selEl.remove();
            selection.isSelecting = false;
            selection.startX = 0;
            selection.startY = 0;
            selection.startScale = 1;
            selection.mode = 'create';
            return;
          }

          if (w >= minSelectionSize && h >= minSelectionSize) {
            const cellPositions = calculateCellPositions(cells, layout, gap);
            const cell = findCellAtPosition(x, y, cellPositions);
            
            if (cell) {
              const cellId = cell.cellId;
              const cellConfig = cells.find(c => c.id === cellId);
              const maxWindows = cellConfig?.maxWindows;
              
              if (maxWindows !== undefined) {
                const windowsInCell = windowsRef.current.filter(w => w.cellId === cellId).length;
                if (windowsInCell >= maxWindows) {
                  onMaxWindowsReached?.(cellId, maxWindows);
                  selEl.remove();
                  selection.isSelecting = false;
                  selection.startX = 0;
                  selection.startY = 0;
                  selection.startScale = 1;
                  return;
                }
              }
            }

            const config: any = {
              position: [x, y],
              size: [w, h],
              streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              title: `Window ${windowsRef.current.length + 1}`,
              cellId: cell?.cellId ?? '',
              minSize: defaultMinSize,
              snapGrid: defaultSnapGrid,
            };

            const finalConfig = onWindowBeforeCreate?.(config) ?? config;
            if (finalConfig) {
              const id = addWindow(finalConfig);
              if (id) {
                activateWindow(id);
                onWindowCreate?.(finalConfig);
              }
            }
          }
          selEl.remove();
        }
        selection.startX = 0;
        selection.startY = 0;
        selection.startScale = 1;
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

        const win = windowsRef.current.find(w => w.id === windowId);
        if (!win) {
          logInteraction('resize-start-skip', { windowId, reason: 'window-missing' });
          return;
        }
        if (win.locked) {
          logInteraction('resize-start-skip', { windowId, reason: 'window-locked' });
          setSelectedTarget(windowId);
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        activateWindow(windowId);
        setSelectedTarget(windowId);

        const wallRect = wallRef.current?.getBoundingClientRect();
        if (!wallRect) {
          logInteraction('resize-start-skip', { windowId, reason: 'wallRect-missing' });
          return;
        }
        const pointerX = (e.clientX - wallRect.left) / scale;
        const pointerY = (e.clientY - wallRect.top) / scale;
        const initialLeft = win.position[0];
        const initialTop = win.position[1];
        const initialWidth = win.size[0];
        const initialHeight = win.size[1];
        const initialRight = initialLeft + initialWidth;
        const initialBottom = initialTop + initialHeight;
        const resizeDir = resizeHandle.getAttribute('data-resize-dir') ?? 'se';

        const resizeOffsetX = resizeDir.includes('w')
          ? initialLeft - pointerX
          : resizeDir.includes('e')
            ? initialRight - pointerX
            : 0;

        const resizeOffsetY = resizeDir.includes('n')
          ? initialTop - pointerY
          : resizeDir.includes('s')
            ? initialBottom - pointerY
            : 0;

        logInteraction('resize-start', {
          windowId,
          resizeDir,
          pointer: { x: pointerX, y: pointerY },
          initial: {
            left: initialLeft,
            top: initialTop,
            width: initialWidth,
            height: initialHeight,
          },
          offsets: { x: resizeOffsetX, y: resizeOffsetY },
          scale,
        });

        dragStateRef.current = {
          isDragging: false,
          isResizing: true,
          target: windowEl,
          windowId,
          startX: e.clientX,
          startY: e.clientY,
          pointerOffsetX: 0,
          pointerOffsetY: 0,
          initialLeft,
          initialTop,
          initialWidth,
          initialHeight,
          currentLeft: initialLeft,
          currentTop: initialTop,
          currentWidth: initialWidth,
          currentHeight: initialHeight,
          resizeOffsetX,
          resizeOffsetY,
          resizeDir,
          snapGrid: win.snapGrid ?? 10,
          minWidth: win.minSize?.[0] ?? defaultMinSize[0],
          minHeight: win.minSize?.[1] ?? defaultMinSize[1],
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
          startScale: scale,
          mode: resolveEmptyAreaDragMode(e.shiftKey),
        };

        const existingSel = wallRef.current?.querySelector('.selection-box');
        if (existingSel) existingSel.remove();

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

      const win = windowsRef.current.find(w => w.id === windowId);
      if (!win) {
        logInteraction('drag-start-skip', { windowId, reason: 'window-missing' });
        return;
      }

      activateWindow(windowId);
      setSelectedTarget(windowId);

      if (win.locked) {
        logInteraction('drag-start-skip', { windowId, reason: 'window-locked' });
        return;
      }

      const wallRect = wallRef.current?.getBoundingClientRect();
      if (!wallRect) {
        logInteraction('drag-start-skip', { windowId, reason: 'wallRect-missing' });
        return;
      }
      const pointerX = (e.clientX - wallRect.left) / scale;
      const pointerY = (e.clientY - wallRect.top) / scale;
      const initialLeft = win.position[0];
      const initialTop = win.position[1];
      const initialWidth = win.size[0];
      const initialHeight = win.size[1];

      logInteraction('drag-start', {
        windowId,
        pointer: { x: pointerX, y: pointerY },
        initial: {
          left: initialLeft,
          top: initialTop,
          width: initialWidth,
          height: initialHeight,
        },
        offsets: {
          x: pointerX - initialLeft,
          y: pointerY - initialTop,
        },
        scale,
      });

      dragStateRef.current = {
        isDragging: true,
        isResizing: false,
        target: windowEl,
        windowId,
        startX: e.clientX,
        startY: e.clientY,
        pointerOffsetX: pointerX - initialLeft,
        pointerOffsetY: pointerY - initialTop,
        initialLeft,
        initialTop,
        initialWidth,
        initialHeight,
        currentLeft: initialLeft,
        currentTop: initialTop,
        currentWidth: initialWidth,
        currentHeight: initialHeight,
        resizeOffsetX: 0,
        resizeOffsetY: 0,
        resizeDir: null,
        snapGrid: win.snapGrid ?? 10,
        minWidth: win.minSize?.[0] ?? defaultMinSize[0],
        minHeight: win.minSize?.[1] ?? defaultMinSize[1],
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
  }, [wallSize.width, wallSize.height, scale, activateWindow, removeWindow, updateWindow, onWindowClose, addWindow, onWindowBeforeCreate, onWindowCreate, cells, layout, gap, onMaxWindowsReached]);

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

  const cellPositionsCalc = useMemo(
    () => calculateCellPositions(cells, layout, gap),
    [cells, layout, gap]
  );

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
            {/* <div style={{
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
            </div> */}
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
            isResizing={dragStateRef.current.isResizing && dragStateRef.current.windowId === win.id}
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
            visibleWindows: windows.length,
          }}
        />
      )}
    </div>
  );
});

VideoWall.displayName = 'VideoWall';
