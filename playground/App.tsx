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
      title: `Window ${windowCount + 1}`,
    });
    setWindowCount(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        padding: '12px 16px',
        background: '#1a1a1a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Video Wall Playground</h2>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Layout:
          <select
            value={`${layout.rows}x${layout.cols}`}
            onChange={(e) => {
              const [rows, cols] = e.target.value.split('x').map(Number);
              setLayout({ rows, cols });
              wallRef.current?.setLayout({ rows, cols });
            }}
            style={{ padding: '4px 8px', borderRadius: 4, border: 'none' }}
          >
            <option value="1x1">1×1</option>
            <option value="2x2">2×2</option>
            <option value="2x3">2×3</option>
            <option value="3x3">3×3</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Stream:
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: 'none' }}
          >
            {Object.keys(MOCK_STREAMS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <button
          onClick={handleAddWindow}
          style={{
            padding: '8px 16px',
            background: '#4a9eff',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Add Window
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Debug:
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
          />
        </label>
      </div>

      <div style={{ flex: 1, background: '#000' }}>
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
      </div>
    </div>
  );
}
