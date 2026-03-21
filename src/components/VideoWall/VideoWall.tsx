import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Moveable from 'moveable';
import Selecto from 'selecto';
import { VideoWindow } from '../VideoWindow';
import { DebugPanel } from '../DebugPanel';
import { useVideoWall } from '../../hooks/useVideoWall';
import type { VideoWallProps, VideoWallRef, WindowState } from '../../types';
import { getRectCenter } from '../../utils/coordinate';
import './VideoWall.module.css';

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
    cellPositions,
    containerRef: videoWallContainerRef,
    handleContainerResize,
  } = useVideoWall(props);

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
        right: wallSize.width * scale,
        bottom: wallSize.height * scale,
      },
    });

    moveable.on('dragStart', (e: any) => {
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        activateWindow(windowId);
      }
    });

    moveable.on('drag', (e: any) => {
      const windowId = e.target.getAttribute('data-window-id');
      if (windowId) {
        const newX = e.left / scale;
        const newY = e.top / scale;
        updateWindow(windowId, { position: [newX, newY] });
      }
    });

    moveable.on('dragEnd', (e: any) => {
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
        const newWidth = e.width / scale;
        const newHeight = e.height / scale;
        updateWindow(windowId, { size: [newWidth, newHeight] });
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
      if (e.target.getAttribute('data-window-id')) {
        e.stop();
      }
    });

    selecto.on('selectEnd', (e: any) => {
      if (e.selected.length === 0) {
        const rect = e.inputEvent.target?.getBoundingClientRect?.();
        if (rect) {
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const startX = (rect.left - containerRect.left) / scale;
            const startY = (rect.top - containerRect.top) / scale;
            
            const isStartOccupied = windows.some(win => {
              const winRight = win.position[0] + win.size[0];
              const winBottom = win.position[1] + win.size[1];
              return startX >= win.position[0] && startX <= winRight &&
                     startY >= win.position[1] && startY <= winBottom;
            });
            
            if (isStartOccupied) {
              return;
            }
            
            const width = rect.width / scale;
            const height = rect.height / scale;

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
  }, [wallSize, scale, windows, cells]);

  useEffect(() => {
    handleContainerResize();
    const observer = new ResizeObserver(handleContainerResize);
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

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: background?.color ?? '#000',
        backgroundImage: background?.image ? `url(${background.image})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div
        ref={wallRef}
        style={{
          position: 'relative',
          width: wallSize.width * scale,
          height: wallSize.height * scale,
          transformOrigin: 'top left',
        }}
      >
        {windows.map((win) => (
          <VideoWindow
            key={win.id}
            window={win}
            scale={scale}
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