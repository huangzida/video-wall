import { useMemo } from 'react';
import { FlvPlayer } from '../FlvPlayer';
import { Mp4Player } from '../Mp4Player';
import type { PlayerState, WindowState } from '../../types';

interface VideoWindowProps {
  window: WindowState;
  scale: number;
  onMove?: (id: string, position: [number, number]) => void;
  onResize?: (id: string, size: [number, number]) => void;
  onClose?: (id: string) => void;
  onActivate?: (id: string) => void;
}

function detectStreamType(url: string): 'flv' | 'mp4' {
  if (url.endsWith('.mp4')) return 'mp4';
  if (url.endsWith('.flv') || url.startsWith('ws://') || url.startsWith('wss://')) return 'flv';
  return 'mp4';
}

export function VideoWindow({
  window,
  scale,
  onMove,
  onResize,
  onClose,
  onActivate,
}: VideoWindowProps) {
  const streamType = useMemo(() => detectStreamType(window.streamUrl), [window.streamUrl]);

  const handleStateChange = (state: PlayerState) => {
    // Handle state changes if needed
  };

  return (
    <div
      data-window-id={window.id}
      style={{
        position: 'absolute',
        left: window.position[0] * scale,
        top: window.position[1] * scale,
        width: window.size[0] * scale,
        height: window.size[1] * scale,
        zIndex: window.zIndex,
        border: window.border?.width ? `${window.border.width}px solid ${window.border.color ?? '#fff'}` : 'none',
        borderRadius: window.border?.radius ?? 0,
        overflow: 'hidden',
        background: '#000',
        boxShadow: window.isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
      }}
      onClick={() => onActivate?.(window.id)}
    >
      {streamType === 'flv' ? (
        <FlvPlayer url={window.streamUrl} onStateChange={handleStateChange} />
      ) : (
        <Mp4Player url={window.streamUrl} onStateChange={handleStateChange} />
      )}
      
      {window.title && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {window.title}
        </div>
      )}

      {!window.locked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.(window.id);
          }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            padding: 0,
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
