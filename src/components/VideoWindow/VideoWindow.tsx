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

  const isActive = window.isActive;

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
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0a0a0f',
        border: isActive ? '2px solid rgba(99, 102, 241, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isActive 
          ? '0 0 0 1px rgba(99, 102, 241, 0.3), 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(99, 102, 241, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'box-shadow 0.2s ease, border 0.2s ease',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
            padding: '10px 14px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.02em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
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
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            padding: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ×
        </button>
      )}

      {/* Resize handles */}
      {isActive && (
        <>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 4,
            background: 'rgba(99, 102, 241, 0.5)',
            borderRadius: '4px 4px 0 0',
            cursor: 'ns-resize',
            opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 40,
            background: 'rgba(99, 102, 241, 0.5)',
            borderRadius: '0 4px 4px 0',
            cursor: 'ew-resize',
            opacity: 0.6,
          }} />
        </>
      )}
    </div>
  );
}
