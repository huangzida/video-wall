# Video Wall

React NPM package for video wall display and interaction with draggable windows, box selection, and multi-stream support.

## Features

- Multi-cell video wall layout
- Draggable and resizable windows with Moveable
- Box selection for creating new windows with Selecto
- Support for ws-flv (flv.js) and mp4 (HTML5 Video) streams
- Window z-index management (click/drag to top)
- Drag window out of bounds to delete
- Window locking
- Visibility-based video pause (IntersectionObserver)
- Persistence (localStorage)
- Debug panel
- Full TypeScript support

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
    />
  );
}
```

## API

See full API documentation at [docs](./docs/superpowers/specs/).

## License

MIT
