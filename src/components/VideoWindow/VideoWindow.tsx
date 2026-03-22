import { useMemo } from 'react';
import { FlvPlayer } from '../FlvPlayer';
import { Mp4Player } from '../Mp4Player';
import type { PlayerState, WindowState } from '../../types';

interface VideoWindowProps {
  window: WindowState;
  showBorder?: boolean;
  showTitle?: boolean;
  showCollapse?: boolean;
  onMove?: (id: string, position: [number, number]) => void;
  onResize?: (id: string, size: [number, number]) => void;
  onClose?: (id: string) => void;
  onActivate?: (id: string) => void;
  onCollapse?: (id: string, collapsed: boolean) => void;
}

function detectStreamType(url: string): 'flv' | 'mp4' {
  if (url.endsWith('.mp4')) return 'mp4';
  if (url.endsWith('.flv') || url.startsWith('ws://') || url.startsWith('wss://')) return 'flv';
  return 'mp4';
}

export function VideoWindow({
  window,
  showBorder = true,
  showTitle = true,
  showCollapse = false,
  onMove,
  onResize,
  onClose,
  onActivate,
  onCollapse,
}: VideoWindowProps) {
  const streamType = useMemo(() => detectStreamType(window.streamUrl), [window.streamUrl]);

  const handleStateChange = (state: PlayerState) => {
    // Handle state changes if needed
  };

  const isActive = window.isActive;
  const isCollapsed = showCollapse && window.collapsed;

  const handleTitleClick = (e: React.MouseEvent) => {
    if (!showCollapse) return;
    e.stopPropagation();
    const newCollapsed = !isCollapsed;
    onCollapse?.(window.id, newCollapsed);
  };

  return (
    <div
      data-window-id={window.id}
      style={{
        position: 'absolute',
        left: window.position[0],
        top: window.position[1],
        width: window.size[0],
        height: isCollapsed ? 40 : window.size[1],
        zIndex: window.zIndex,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0a0a0f',
        border: showBorder ? (isActive ? '2px solid rgba(99, 102, 241, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)') : 'none',
        boxShadow: isActive 
          ? '0 0 0 1px rgba(99, 102, 241, 0.3), 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(99, 102, 241, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'box-shadow 0.2s ease, border 0.2s ease, height 0.2s ease',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={() => onActivate?.(window.id)}
    >
      {!isCollapsed && (
        streamType === 'flv' ? (
          <FlvPlayer url={window.streamUrl} onStateChange={handleStateChange} />
        ) : (
          <Mp4Player url={window.streamUrl} onStateChange={handleStateChange} />
        )
      )}
      
      {showTitle && window.title && (
        <div
          onClick={showCollapse ? handleTitleClick : undefined}
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
            cursor: showCollapse ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: showCollapse ? 'auto' : 'none',
          }}
        >
          <span>{window.title}</span>
          {showCollapse && (
            <span style={{ 
              fontSize: 10, 
              transform: isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>▼</span>
          )}
        </div>
      )}

      {false && !window.locked && (
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
          <div data-resize-dir="n" style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 48,
            height: 6,
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.9) 0%, rgba(99, 102, 241, 0.4) 100%)',
            borderRadius: '0 0 6px 6px',
            cursor: 'ns-resize',
            opacity: 0.8,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3), 0 0 1px rgba(99, 102, 241, 0.5) inset',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }} 
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(-50%) scaleX(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateX(-50%) scaleX(1)'; }}
          />
          <div data-resize-dir="s" style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 48,
            height: 6,
            background: 'linear-gradient(0deg, rgba(99, 102, 241, 0.9) 0%, rgba(99, 102, 241, 0.4) 100%)',
            borderRadius: '6px 6px 0 0',
            cursor: 'ns-resize',
            opacity: 0.8,
            boxShadow: '0 -2px 8px rgba(99, 102, 241, 0.3), 0 0 1px rgba(99, 102, 241, 0.5) inset',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(-50%) scaleX(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateX(-50%) scaleX(1)'; }}
          />
          <div data-resize-dir="e" style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 48,
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.9) 0%, rgba(99, 102, 241, 0.4) 100%)',
            borderRadius: '6px 0 0 6px',
            cursor: 'ew-resize',
            opacity: 0.8,
            boxShadow: '-2px 0 8px rgba(99, 102, 241, 0.3), 0 0 1px rgba(99, 102, 241, 0.5) inset',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-50%) scaleY(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-50%) scaleY(1)'; }}
          />
          <div data-resize-dir="w" style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 48,
            background: 'linear-gradient(270deg, rgba(99, 102, 241, 0.9) 0%, rgba(99, 102, 241, 0.4) 100%)',
            borderRadius: '0 6px 6px 0',
            cursor: 'ew-resize',
            opacity: 0.8,
            boxShadow: '2px 0 8px rgba(99, 102, 241, 0.3), 0 0 1px rgba(99, 102, 241, 0.5) inset',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-50%) scaleY(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-50%) scaleY(1)'; }}
          />
          <div data-resize-dir="nw" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 16,
            height: 16,
            background: 'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 1) 0%, rgba(99, 102, 241, 0.6) 50%, rgba(99, 102, 241, 0.2) 100%)',
            borderRadius: '4px 0 0 0',
            cursor: 'nw-resize',
            opacity: 0.9,
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
          <div data-resize-dir="ne" style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 16,
            height: 16,
            background: 'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 1) 0%, rgba(99, 102, 241, 0.6) 50%, rgba(99, 102, 241, 0.2) 100%)',
            borderRadius: '0 4px 0 0',
            cursor: 'ne-resize',
            opacity: 0.9,
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
          <div data-resize-dir="sw" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 16,
            height: 16,
            background: 'radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 1) 0%, rgba(99, 102, 241, 0.6) 50%, rgba(99, 102, 241, 0.2) 100%)',
            borderRadius: '0 0 0 4px',
            cursor: 'sw-resize',
            opacity: 0.9,
            boxShadow: '0 -2px 6px rgba(99, 102, 241, 0.4)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
          <div data-resize-dir="se" style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            background: 'radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 1) 0%, rgba(99, 102, 241, 0.6) 50%, rgba(99, 102, 241, 0.2) 100%)',
            borderRadius: '0 0 4px 0',
            cursor: 'se-resize',
            opacity: 0.9,
            boxShadow: '0 -2px 6px rgba(99, 102, 241, 0.4)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
        </>
      )}
    </div>
  );
}
