import { useState, useRef } from 'react';
import { VideoWall } from '../src';
import type { VideoWallRef, Cell, Layout } from '../src';

const DEFAULT_CELLS: Cell[] = [
  { id: '0', width: 1920, height: 1080 },
  { id: '1', width: 1920, height: 1080 },
  { id: '2', width: 1920, height: 1080 },
  { id: '3', width: 1920, height: 1080 },
  { id: '4', width: 1920, height: 1080 },
  { id: '5', width: 1920, height: 1080 },
];

const MOCK_STREAMS = {
  'Big Buck Bunny': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'Elephants Dream': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'Sintel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'Tears of Steel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
};

const STREAM_THUMBNAILS: Record<string, string> = {
  'Big Buck Bunny': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  'Elephants Dream': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
  'Sintel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
  'Tears of Steel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
};

const LAYOUTS: { label: string; value: string }[] = [
  { label: '1×1', value: '1x1' },
  { label: '2×2', value: '2x2' },
  { label: '2×3', value: '2x3' },
  { label: '3×3', value: '3x3' },
];

export default function App() {
  const wallRef = useRef<VideoWallRef>(null);
  const [layout, setLayout] = useState<Layout>({ rows: 2, cols: 3 });
  const [selectedStream, setSelectedStream] = useState('Big Buck Bunny');
  const [debug, setDebug] = useState(false);
  const [windowCount, setWindowCount] = useState(0);

  const handleAddWindow = () => {
    const x = Math.random() * 500;
    const y = Math.random() * 300;
    wallRef.current?.addWindow({
      position: [x, y],
      size: [400, 300],
      streamUrl: MOCK_STREAMS[selectedStream as keyof typeof MOCK_STREAMS],
      title: `${selectedStream} #${windowCount + 1}`,
    });
    setWindowCount(prev => prev + 1);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
        fontFamily: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
      color: '#fff',
      overflow: 'hidden',
    }}>
      {/* Ambient background effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 25s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 100,
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Video Wall
            </h1>
            <p style={{
              margin: 0,
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Playground
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          {/* Layout Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>Grid</span>
            <select
              value={`${layout.rows}x${layout.cols}`}
              onChange={(e) => {
                const [rows, cols] = e.target.value.split('x').map(Number);
                setLayout({ rows, cols });
                wallRef.current?.setLayout({ rows, cols });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {LAYOUTS.map(l => (
                <option key={l.value} value={l.value} style={{ background: '#1a1a2e' }}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Stream Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: `url(${STREAM_THUMBNAILS[selectedStream]}) center/cover`,
              border: '1px solid rgba(255,255,255,0.1)',
            }} />
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {Object.keys(MOCK_STREAMS).map(name => (
                <option key={name} value={name} style={{ background: '#1a1a2e' }}>{name}</option>
              ))}
            </select>
          </div>

          {/* Add Window Button */}
          <button
            onClick={handleAddWindow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.35)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Window
          </button>

          {/* Debug Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: debug ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            border: `1px solid ${debug ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Debug</span>
            <div style={{
              width: 32,
              height: 18,
              background: debug ? '#6366f1' : 'rgba(255,255,255,0.15)',
              borderRadius: 9,
              position: 'relative',
              transition: 'all 0.2s ease',
            }}>
              <div style={{
                position: 'absolute',
                top: 2,
                left: debug ? 14 : 2,
                width: 14,
                height: 14,
                background: '#fff',
                borderRadius: 7,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        position: 'relative',
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <VideoWall
          ref={wallRef}
          layout={layout}
          cells={DEFAULT_CELLS}
          gap={4}
          debug={debug}
          scaleMode="contain"
          onWindowCreate={(win) => console.log('Window created:', win)}
          onWindowClose={(id) => console.log('Window closed:', id)}
          onWindowActive={(id) => console.log('Window activated:', id)}
        />
      </main>

      {/* Footer Stats */}
      <footer style={{
        position: 'relative',
        zIndex: 100,
        padding: '12px 24px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}>
        <StatItem label="Windows" value={windowCount} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <StatItem label="Layout" value={`${layout.rows}×${layout.cols}`} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <StatItem label="Mode" value="Contain" />
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
        select option { background: #1a1a2e; }
      `}</style>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
        {value}
      </span>
    </div>
  );
}
