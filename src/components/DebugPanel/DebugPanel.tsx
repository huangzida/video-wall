import type { DebugInfo } from '../../types';

interface DebugPanelProps {
  info: DebugInfo;
}

export function DebugPanel({ info }: DebugPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        borderRadius: 4,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div>Scale: {info.scale.toFixed(4)}</div>
      <div>Viewport: {info.viewport.width} × {info.viewport.height}</div>
      <div>Windows: {info.totalWindows}</div>
      <div>Visible: {info.visibleWindows}</div>
    </div>
  );
}
