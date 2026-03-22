import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VideoWall } from '../src';
import type { VideoWallRef, Cell, Layout, PresetLayout, WindowConfig } from '../src';
import { InteractionLab } from './labs/InteractionLab';
import { LayoutLab } from './labs/LayoutLab';
import { WindowLab } from './labs/WindowLab';
import { ApiLab } from './labs/ApiLab';
import { HistoryLab } from './labs/HistoryLab';
import { PersistenceLab } from './labs/PersistenceLab';
import { SCENARIOS } from './mock/scenarios';

const MOCK_STREAMS = [
  { label: 'Big Buck Bunny', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { label: 'Elephants Dream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { label: 'Sintel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
  { label: 'Tears of Steel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
];

const PRESETS: PresetLayout[] = [
  { name: '单窗口', windows: [{ cellId: '0', position: [0, 0], size: [1920, 1080] }] },
  { name: '四格', windows: [
    { cellId: '0', position: [0, 0], size: [960, 540] },
    { cellId: '1', position: [0, 0], size: [960, 540] },
    { cellId: '3', position: [0, 0], size: [960, 540] },
    { cellId: '4', position: [0, 0], size: [960, 540] },
  ]},
  { name: '六格', windows: [
    { cellId: '0', position: [0, 0], size: [640, 360] },
    { cellId: '1', position: [640, 0], size: [640, 360] },
    { cellId: '2', position: [1280, 0], size: [640, 360] },
    { cellId: '3', position: [0, 360], size: [640, 360] },
    { cellId: '4', position: [640, 360], size: [640, 360] },
    { cellId: '5', position: [1280, 360], size: [640, 360] },
  ]},
];

function generateCells(rows: number, cols: number, maxWindows?: number): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < rows * cols; i++) {
    cells.push({ id: String(i), width: 1920, height: 1080, maxWindows });
  }
  return cells;
}

export default function App() {
  const wallRef = useRef<VideoWallRef>(null);
  
  const [layout, setLayout] = useState<Layout>({ rows: 2, cols: 3 });
  const [gap, setGap] = useState(4);
  const [scaleMode, setScaleMode] = useState<'contain' | 'cover' | 'original' | 'custom'>('contain');
  const [customScale, setCustomScale] = useState(1);
  const [debug, setDebug] = useState(false);
  const [bgColor, setBgColor] = useState('#0a0a12');
  const [showBorder, setShowBorder] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showCollapse, setShowCollapse] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [selectedStream, setSelectedStream] = useState(MOCK_STREAMS[0].url);
  const [windowTitle, setWindowTitle] = useState('Window 1');
  const [windowCount, setWindowCount] = useState(0);
  const [totalWindows, setTotalWindows] = useState(0);
  const [activeWindows, setActiveWindows] = useState(0);
  const [currentScale, setCurrentScale] = useState(1);
  const [cellMaxWindows, setCellMaxWindows] = useState<number | undefined>(undefined);
  const [minWindowSize, setMinWindowSize] = useState(200);
  const [snapGridSize, setSnapGridSize] = useState(10);
  const [minSelectionSize, setMinSelectionSize] = useState(20);
  const [maxWindowsNotification, setMaxWindowsNotification] = useState<string | null>(null);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [activeWindowLocked, setActiveWindowLocked] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [wallSize, setWallSize] = useState({ width: 0, height: 0 });
  const [shiftSelectEnabled, setShiftSelectEnabled] = useState(true);
  const [layoutStrategy, setLayoutStrategy] = useState<'free' | 'smart-grid' | 'focus-side' | 'pip'>('free');
  const [activeLab, setActiveLab] = useState<'interaction' | 'layout' | 'window' | 'api' | 'history' | 'persistence'>('interaction');

  const cells = useMemo(() => generateCells(layout.rows, layout.cols, cellMaxWindows), [layout.rows, layout.cols, cellMaxWindows]);

  const handleAddWindow = useCallback(() => {
    const x = Math.random() * 500;
    const y = Math.random() * 300;
    wallRef.current?.addWindow({
      position: [x, y],
      size: [400, 300],
      streamUrl: selectedStream,
      title: showTitle ? `${windowTitle} #${windowCount + 1}` : undefined,
      border: showBorder ? { color: '#6366f1', width: 2, radius: 8 } : undefined,
      minSize: [minWindowSize, minWindowSize * 0.75],
      snapGrid: snapGridSize,
    });
    setWindowCount(prev => prev + 1);
  }, [selectedStream, windowTitle, showTitle, showBorder, windowCount, minWindowSize, snapGridSize]);

  const handleToggleLock = useCallback(() => {
    if (!activeWindowId) return;
    const win = wallRef.current?.getWindow(activeWindowId);
    if (win) {
      const newLocked = !win.locked;
      wallRef.current?.updateWindow(activeWindowId, { locked: newLocked });
      setActiveWindowLocked(newLocked);
    }
  }, [activeWindowId]);

  const handleDeleteActive = useCallback(() => {
    if (!activeWindowId) return;
    wallRef.current?.removeWindow(activeWindowId);
    setActiveWindowId(null);
    setActiveWindowLocked(false);
  }, [activeWindowId]);

  const handleApplyPreset = useCallback((presetName: string) => {
    setTotalWindows(0);
    setActiveWindows(0);
    wallRef.current?.applyPreset(presetName);
  }, []);

  const handleClearAll = useCallback(() => {
    wallRef.current?.getWindows().forEach(w => {
      wallRef.current?.removeWindow(w.id);
    });
    setWindowCount(0);
    setTotalWindows(0);
    setActiveWindows(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const scale = wallRef.current?.getScale();
      if (scale !== undefined) {
        setCurrentScale(scale);
      }
      const viewport = wallRef.current?.getViewport();
      if (viewport) {
        setWallSize({ width: viewport.width, height: viewport.height });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleLoadScenario = useCallback((scenarioId: string) => {
    if (scenarioId === 'focus-side') {
      handleApplyPreset('单窗口');
      return;
    }

    if (scenarioId === 'undo-redo-torture') {
      setDebug(true);
      return;
    }

    if (scenarioId === 'stress-100') {
      for (let i = 0; i < 10; i += 1) {
        handleAddWindow();
      }
      return;
    }

    if (scenarioId === 'conflict-recovery') {
      setSnapGridSize(20);
      setMinWindowSize(240);
    }
  }, [handleAddWindow, handleApplyPreset]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: "'SF Pro Display', '-apple-system', system-ui, sans-serif",
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121f 50%, #0a0a15 100%)',
      color: '#fff',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Video Wall Playground</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={labelStyle}>
            <span style={labelText}>Rows</span>
            <input 
              type="number" 
              min={1} max={5}
              value={layout.rows}
              onChange={e => {
                const rows = parseInt(e.target.value) || 1;
                setLayout(l => ({ ...l, rows }));
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelText}>Cols</span>
            <input 
              type="number" 
              min={1} max={5}
              value={layout.cols}
              onChange={e => {
                const cols = parseInt(e.target.value) || 1;
                setLayout(l => ({ ...l, cols }));
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelText}>Gap</span>
            <input 
              type="number" 
              min={0} max={50}
              value={gap}
              onChange={e => setGap(parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelText}>Scale</span>
            <select
              value={scaleMode}
              onChange={e => setScaleMode(e.target.value as any)}
              style={{ ...inputStyle, minWidth: 100 }}
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="original">Original</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {scaleMode === 'custom' && (
            <label style={labelStyle}>
              <span style={labelText}>Scale%</span>
              <input 
                type="number" 
                min={0.1} max={3} step={0.1}
                value={customScale}
                onChange={e => setCustomScale(parseFloat(e.target.value) || 1)}
                style={inputStyle}
              />
            </label>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <Toggle label="Debug" checked={debug} onChange={setDebug} />
          <Toggle label="Border" checked={showBorder} onChange={setShowBorder} />
          <Toggle label="Title" checked={showTitle} onChange={setShowTitle} />
          <Toggle label="折叠" checked={showCollapse} onChange={setShowCollapse} />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Wall */}
        <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            background: bgColor,
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}>
            <VideoWall
              ref={wallRef}
              layout={layout}
              cells={cells}
              gap={gap}
              background={{ color: bgColor }}
              debug={debug}
              scaleMode={scaleMode}
              customScale={customScale}
              showBorder={showBorder}
              showTitle={showTitle}
              showCollapse={showCollapse}
              minSelectionSize={minSelectionSize}
              defaultMinSize={[minWindowSize, minWindowSize * 0.75]}
              defaultSnapGrid={snapGridSize}
              presets={PRESETS}
              persistence={persistenceEnabled ? { enabled: true, key: 'video-wall-state' } : undefined}
              onLayoutChange={l => {
                console.log('Layout changed:', l);
                setLayout(l);  // Sync with VideoWall's layout when persistence restores
                const viewport = wallRef.current?.getViewport();
                if (viewport) {
                  setWallSize({ width: viewport.width, height: viewport.height });
                }
              }}
              onWindowCreate={w => {
                console.log('Window created:', w);
                setTotalWindows(prev => prev + 1);
                setActiveWindows(prev => prev + 1);
              }}
              onWindowClose={id => {
                console.log('Window closed:', id);
                setTotalWindows(prev => Math.max(0, prev - 1));
                setActiveWindows(prev => Math.max(0, prev - 1));
                if (id === activeWindowId) {
                  setActiveWindowId(null);
                  setActiveWindowLocked(false);
                }
              }}
              onWindowActive={id => {
                console.log('Window activated:', id);
                setActiveWindowId(id);
                const win = wallRef.current?.getWindow(id);
                setActiveWindowLocked(win?.locked || false);
                setActiveWindows(wallRef.current?.getWindows().filter(w => w.isActive).length || 0);
              }}
              onMaxWindowsReached={(cellId, max) => {
                console.log('Max windows reached:', cellId, max);
                setMaxWindowsNotification(`Cell ${cellId} reached max windows (${max})`);
                setTimeout(() => setMaxWindowsNotification(null), 3000);
              }}
            />
          </div>
        </div>

        {/* Control Panel */}
        <aside style={{
          width: 280,
          background: 'rgba(255,255,255,0.02)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: 16,
          overflow: 'auto',
        }}>
          <Section title="添加窗口">
            <label style={labelStyle}>
              <span style={labelText}>视频源</span>
              <select
                value={selectedStream}
                onChange={e => setSelectedStream(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                {MOCK_STREAMS.map(s => (
                  <option key={s.url} value={s.url}>{s.label}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              <span style={labelText}>窗口标题</span>
              <input 
                type="text"
                value={windowTitle}
                onChange={e => setWindowTitle(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </label>

            <button onClick={handleAddWindow} style={primaryButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              添加窗口
            </button>
          </Section>

          <Section title="预设布局">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => handleApplyPreset(p.name)}
                  style={secondaryButton}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </Section>

          <Section title="操作">
            <Toggle 
              label="锁定窗口" 
              checked={activeWindowLocked} 
              onChange={handleToggleLock}
              disabled={!activeWindowId}
            />
            <button 
              onClick={handleDeleteActive} 
              style={{ ...secondaryButton, opacity: activeWindowId ? 1 : 0.5 }}
              disabled={!activeWindowId}
            >
              删除选中窗口
            </button>
            <button onClick={handleClearAll} style={dangerButton}>
              清空所有窗口
            </button>
          </Section>

          <Section title="背景颜色">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                '#0a0a12', '#0f1419', '#1a1a2e', '#000000', '#0d1117',
                '#1e3a5f', '#2d1b4e', '#1a2f1a', '#3d1a1a', '#0a192f',
                '#172a45', '#282c34', '#1c1c1c', '#0f2027', '#2c3e50',
              ].map(color => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: color,
                    border: bgColor === color ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </Section>

          <Section title="窗口配置">
            <label style={labelStyle}>
              <span style={labelText}>最小尺寸</span>
              <input 
                type="number" 
                min={50}
                value={minWindowSize}
                onChange={e => setMinWindowSize(parseInt(e.target.value) || 200)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelText}>网格吸附</span>
              <input 
                type="number" 
                min={0} max={100}
                value={snapGridSize}
                onChange={e => setSnapGridSize(parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelText}>框选最小</span>
              <input 
                type="number" 
                min={5}
                value={minSelectionSize}
                onChange={e => setMinSelectionSize(parseInt(e.target.value) || 20)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelText}>单屏上限</span>
              <input 
                type="number" 
                min={0} max={10}
                value={cellMaxWindows ?? ''}
                placeholder="无限制"
                onChange={e => setCellMaxWindows(e.target.value ? parseInt(e.target.value) : undefined)}
                style={inputStyle}
              />
            </label>
            {maxWindowsNotification && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 11,
              }}>
                {maxWindowsNotification}
              </div>
            )}
          </Section>

          <Section title="调试参数">
            <Toggle label="持久化" checked={persistenceEnabled} onChange={setPersistenceEnabled} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatBox label="逻辑尺寸" value={`${Math.round(wallSize.width)}x${Math.round(wallSize.height)}`} />
              <StatBox label="选中ID" value={activeWindowId ? activeWindowId.slice(-8) : '-'} />
              <StatBox label="锁定" value={activeWindowLocked ? '是' : '否'} />
            </div>
          </Section>

          <Section title="窗口统计">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatBox label="总数" value={totalWindows} />
              <StatBox label="激活" value={activeWindows} />
              <StatBox label="缩放" value={currentScale.toFixed(3)} />
            </div>
          </Section>

          <Section title="Playground Lab">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button style={secondaryButton} onClick={() => setActiveLab('interaction')}>Interaction</button>
              <button style={secondaryButton} onClick={() => setActiveLab('layout')}>Layout</button>
              <button style={secondaryButton} onClick={() => setActiveLab('window')}>Window</button>
              <button style={secondaryButton} onClick={() => setActiveLab('api')}>API</button>
              <button style={secondaryButton} onClick={() => setActiveLab('history')}>History</button>
              <button style={secondaryButton} onClick={() => setActiveLab('persistence')}>Persistence</button>
            </div>

            {activeLab === 'interaction' && (
              <InteractionLab onToggleShiftSelect={setShiftSelectEnabled} />
            )}
            {activeLab === 'layout' && (
              <LayoutLab onApplyStrategy={setLayoutStrategy} />
            )}
            {activeLab === 'window' && (
              <WindowLab
                onGroupSelected={() => setDebug(true)}
                onUngroupSelected={() => setDebug(false)}
              />
            )}
            {activeLab === 'api' && (
              <ApiLab onDispatchSampleAction={() => setShowCollapse(prev => !prev)} />
            )}
            {activeLab === 'history' && (
              <HistoryLab
                onUndo={() => setWindowCount(prev => Math.max(0, prev - 1))}
                onRedo={() => setWindowCount(prev => prev + 1)}
              />
            )}
            {activeLab === 'persistence' && (
              <PersistenceLab
                scenarios={SCENARIOS}
                onLoadScenario={handleLoadScenario}
                onReset={handleClearAll}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatBox label="Shift框选" value={shiftSelectEnabled ? '开' : '关'} />
              <StatBox label="布局策略" value={layoutStrategy} />
            </div>
          </Section>
        </aside>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          background: disabled ? 'rgba(255,255,255,0.05)' : (checked ? '#6366f1' : 'rgba(255,255,255,0.1)'),
          borderRadius: 10,
          position: 'relative',
          transition: 'all 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: checked ? 16 : 2,
          width: 16,
          height: 16,
          background: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
          borderRadius: 8,
          transition: 'all 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 12, color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)' }}>{label}</span>
    </label>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const labelText: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.5)',
  minWidth: 56,
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
  outline: 'none',
  width: 80,
};

const primaryButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 16px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
};

const dangerButton: React.CSSProperties = {
  ...secondaryButton,
  background: 'rgba(239, 68, 68, 0.1)',
  borderColor: 'rgba(239, 68, 68, 0.3)',
  color: '#ef4444',
};
