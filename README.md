# Video Wall

React NPM package for video wall display and interaction with draggable windows, box selection, and multi-stream support.

[中文文档](./README_zh.md)

## Features

### Layout
- Multi-cell video wall layout with configurable rows and columns
- Gap support between cells
- Multiple scale modes: contain, cover, original, custom
- Background color and image support

### Interaction
- **Box selection**: Draw a rectangle on empty space to create new windows
- **Create-vs-select semantics**: Empty-area drag creates windows by default; hold `Shift` while dragging to use select-box mode
- **Drag & drop**: Move windows freely within the wall bounds
- **8-direction resize**: Resize windows via edge and corner handles
- **Snap-to-grid**: Optional alignment to grid during drag/resize
- **Click to activate**: Click a window to bring it to front
- **Delete key**: Press Delete to remove selected window
- **Drag out to delete**: Drag window outside wall bounds to remove it

### Window Management
- Window locking (prevents drag/resize)
- Title bar collapse/expand (optional, disabled by default)
- Max windows per cell limit
- Window z-index management

### Video Support
- ws-flv streams via flv.js
- mp4 streams via HTML5 Video
- Automatic stream type detection
- Visibility-based video pause ( IntersectionObserver)
- Loading, playing, paused, and error states

### State & Persistence
- localStorage persistence (optional)
- Debug panel showing scale, viewport, window count

### Developer Tools
- Comprehensive TypeScript support
- Debug panel for monitoring internal state

## Installation

```bash
npm install video-wall
```

## Usage

```tsx
import { VideoWall } from 'video-wall';

const cells = [
  { id: '0', width: 1920, height: 1080 },
  { id: '1', width: 1920, height: 1080 },
  { id: '2', width: 1920, height: 1080 },
  { id: '3', width: 1920, height: 1080 },
  { id: '4', width: 1920, height: 1080 },
  { id: '5', width: 1920, height: 1080 },
];

function App() {
  return (
    <VideoWall
      layout={{ rows: 2, cols: 3 }}
      cells={cells}
      gap={4}
      scaleMode="contain"
      debug
      onWindowCreate={(win) => console.log('Window created:', win)}
      onWindowClose={(id) => console.log('Window closed:', id)}
    />
  );
}
```

## API

### VideoWall Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `{ rows: number, cols: number }` | Required | Grid layout |
| `cells` | `Cell[]` | Required | Cell configurations |
| `gap` | `number` | `0` | Gap between cells |
| `background` | `{ color?: string, image?: string }` | - | Wall background |
| `scaleMode` | `'contain' \| 'cover' \| 'original' \| 'custom'` | `'contain'` | Scale mode |
| `customScale` | `number` | `1` | Custom scale value |
| `debug` | `boolean` | `false` | Show debug panel |
| `showBorder` | `boolean` | `true` | Show window borders |
| `showTitle` | `boolean` | `true` | Show window titles |
| `showCollapse` | `boolean` | `false` | Enable title bar collapse |
| `persistence` | `{ enabled: boolean, storage?: 'localStorage' \| 'sessionStorage', key?: string }` | - | Persistence config |
| `presets` | `PresetLayout[]` | - | Preset layouts |
| `onLayoutChange` | `(layout: Layout) => void` | - | Layout change callback |
| `onWindowCreate` | `(window: WindowConfig) => void` | - | Window create callback |
| `onWindowBeforeCreate` | `(config: Partial<WindowConfig>) => Partial<WindowConfig> \| null` | - | Pre-create hook |
| `onWindowClose` | `(id: string) => void` | - | Window close callback |
| `onWindowActive` | `(id: string) => void` | - | Window activate callback |
| `onMaxWindowsReached` | `(cellId: string, maxWindows: number) => void` | - | Max windows callback |

### VideoWallRef (Imperative API)

```tsx
const wallRef = useRef<VideoWallRef>(null);

// Add a window
wallRef.current?.addWindow({
  position: [100, 100],
  size: [400, 300],
  streamUrl: 'https://example.com/video.mp4',
  title: 'Camera 1',
});

// Remove a window
wallRef.current?.removeWindow(windowId);

// Update window properties
wallRef.current?.updateWindow(windowId, { locked: true });

// Get all windows
const windows = wallRef.current?.getWindows();

// Apply preset layout
wallRef.current?.applyPreset('Four Grid');

// Get current scale
const scale = wallRef.current?.getScale();

// V2 unified API (feature-flagged)
const result = wallRef.current?.dispatch?.({
  type: 'window.create',
  config: {
    id: 'w-1',
    bounds: { x: 0, y: 0, width: 320, height: 180 },
    zIndex: 1,
    locked: false,
    collapsed: false,
    lifecycle: 'idle',
    stream: { url: 'https://example.com/a.mp4', kind: 'mp4' },
    priority: 0,
  },
});

const state = wallRef.current?.getState?.();
const unsubscribe = wallRef.current?.subscribe?.((event) => {
  console.log(event);
});
```

## V2 PlaygroundLab

Playground includes six labs for realtime debugging and demo validation:
- Interaction Lab
- Layout Lab
- Window Lab
- API Lab
- History Lab
- Persistence Lab

Preset scenarios:
- Stress 100 Windows
- Focus + Side
- Conflict Recovery
- Undo/Redo Torture

## Feature Flags (V2)

V2 capabilities are gated by feature flags:
- `FF_HISTORY_STACK`
- `FF_ZONE_SUPPORT`
- `FF_GROUP_OPERATIONS`
- `FF_LAYOUT_STRATEGIES`
- `FF_PERSISTENCE_V2`
- `FF_UNIFIED_API`
- `FF_PLAYGROUND_LAB`

### Cell Interface

```tsx
interface Cell {
  id: string;
  width: number;    // Logical pixel width
  height: number;    // Logical pixel height
  maxWindows?: number; // Max windows per cell
}
```

### WindowConfig Interface

```tsx
interface WindowConfig {
  id: string;
  cellId: string;
  position: [number, number];  // x, y in logical pixels
  size: [number, number];     // width, height in logical pixels
  streamUrl: string;
  title?: string;
  locked?: boolean;
  border?: {
    color?: string;
    width?: number;
    radius?: number;
  };
  minSize?: [number, number];
  snapGrid?: number;
}
```

## Architecture

```
VideoWall (main container)
├── Layout layer - renders cells grid
├── Window layer - native mouse events for drag/resize
├── Selection layer - native mouse events for box selection
└── Video layer - FlvPlayer / Mp4Player instances

VideoWindow - display layer, driven by native events
FlvPlayer - flv.js wrapper for ws-flv streams
Mp4Player - HTML5 Video wrapper for mp4 streams
```

## Coordinate System

- **Logical coordinates**: Window position/size always in logical pixels
- **Screen coordinates**: Converted internally using scale factor
- Scale factor: `scale = containerSize / logicalSize`

## License

MIT
