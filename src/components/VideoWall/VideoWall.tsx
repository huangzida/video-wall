import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Moveable from 'moveable';
import Selecto from 'selecto';
import { VideoWindow } from '../VideoWindow';
import { DebugPanel } from '../DebugPanel';
import { useVideoWall } from '../../hooks/useVideoWall';
import type { VideoWallProps, VideoWallRef } from '../../types';
import { getRectCenter } from '../../utils/coordinate';
import { calculateCellPositions } from '../../utils/layout';

const MIN_SELECTION_SIZE = 20;

export const VideoWall = forwardRef<VideoWallRef, VideoWallProps>((props, ref) => {
  const {
    layout,
    cells,
    gap = 0,
    background,
    scaleMode = 'contain',
    customScale,
    debug = false,
    presets,
    onLayoutChange,
    onWindowCreate,
    onWindowBeforeCreate,
    onWindowClose,
    onWindowActive,
    onMaxWindowsReached,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

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
      if (id) onWindowCreate?.({ ...config, id } as any);
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

  useEffect(() => {
    if (!wallRef.current) return;

    const moveable = new Moveable(wallRef.current, {
      draggable: true,
      resizable: true,
      snappable: true,
      snapThreshold: 10,
      bounds: {
        left: 0,
        top: 0,
        right: wallSize.width,
        bottom: wallSize.height,
      },
    });

    moveable.on('dragStart', (e: any) => {
      isDraggingRef.current = true;
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        activateWindow(windowId);
      }
    });

    moveable.on('drag', (e: any) => {
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        updateWindow(windowId, { position: [e.left, e.top] });
      }
    });

    moveable.on('dragEnd', (e: any) => {
      isDraggingRef.current = false;
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        const rect = e.target.getBoundingClientRect();
        const center = getRectCenter({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const relativeX = (center.x - containerRect.left) / scale;
          const relativeY = (center.y - containerRect.top) / scale;
          if (
            relativeX < 0 || relativeX > wallSize.width ||
            relativeY < 0 || relativeY > wallSize.height
          ) {
            removeWindow(windowId);
            onWindowClose?.(windowId);
          }
        }
      }
    });

    moveable.on('resize', (e: any) => {
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        updateWindow(windowId, { size: [e.width, e.height] });
        e.target.style.width = `${e.width}px`;
        e.target.style.height = `${e.height}px`;
      }
    });

    moveableRef.current = moveable;

    const selecto = new Selecto({
      container: wallRef.current,
      selectableTargets: ['[data-window-id]'],
      selectByClick: false,
    });

    selecto.on('selectStart', (e: any) => {
      if (e.target && e.target.getAttribute('data-window-id')) {
        e.stop();
      } else {
        selectionStartRef.current = { x: e.clientX, y: e.clientY };
      }
    });

    selecto.on('selectEnd', (e: any) => {
      if (isDraggingRef.current) return;
      
      selectionStartRef.current = null;
      
      if (e.selected.length === 0 && e.inputEvent) {
        const rect = e.inputEvent.target?.getBoundingClientRect?.();
        if (rect) {
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const startX = (rect.left - containerRect.left) / scale;
            const startY = (rect.top - containerRect.top) / scale;
            
            const isStartOccupied = windows.some(win => {
              return startX >= win.position[0] && startX <= win.position[0] + win.size[0] &&
                     startY >= win.position[1] && startY <= win.position[1] + win.size[1];
            });
            
            if (isStartOccupied) {
              return;
            }
            
            const width = rect.width / scale;
            const height = rect.height / scale;

            if (width < MIN_SELECTION_SIZE / scale || height < MIN_SELECTION_SIZE / scale) {
              return;
            }

            const config: any = {
              position: [startX, startY],
              size: [width, height],
              streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
      }
    });

    selectoRef.current = selecto;

    return () => {
      moveable.destroy();
      selecto.destroy();
    };
  }, [wallSize.width, wallSize.height]);

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
          width: wallSize.width,
          height: wallSize.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
          borderRadius: 12,
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        {cellPositionsCalc.map((cell, index) => (
          <div
            key={cell.cellId}
            style={{
              position: 'absolute',
              left: cell.x,
              top: cell.y,
              width: cell.width,
              height: cell.height,
              border: '1px solid rgba(99, 102, 241, 0.12)',
              background: index % 2 === 0 
                ? 'rgba(99, 102, 241, 0.02)' 
                : 'rgba(168, 85, 247, 0.015)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 6,
              left: 6,
              padding: '3px 8px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 6,
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              backdropFilter: 'blur(4px)',
            }}>
              {index + 1}
            </div>
          </div>
        ))}

        {windows.map((win) => (
          <VideoWindow
            key={win.id}
            window={win}
            scale={1}
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
