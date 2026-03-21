# Video Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React NPM package for video wall display and interaction with draggable windows, box selection, and live stream support.

**Architecture:** 
- React component library with TypeScript
- Moveable for drag/resize, Selecto for box selection
- flv.js for ws-flv streams, HTML5 Video for mp4
- Vite + tsup for build, Vitest for testing

**Tech Stack:** React 18+, TypeScript (strict), Vite, tsup, Moveable, Selecto, flv.js, Vitest

---

## File Structure

```
video-wall/
├── src/
│   ├── types/index.ts           # All TypeScript interfaces
│   ├── utils/
│   │   ├── coordinate.ts        # Coordinate conversion (logical ↔ screen)
│   │   └── layout.ts            # Cell layout calculation
│   ├── hooks/
│   │   ├── useVideoWall.ts      # Core state management
│   │   ├── usePersistence.ts   # localStorage persistence
│   │   └── useVisibility.ts    # IntersectionObserver for video pause
│   ├── components/
│   │   ├── FlvPlayer/
│   │   │   ├── FlvPlayer.tsx
│   │   │   └── index.ts
│   │   ├── Mp4Player/
│   │   │   ├── Mp4Player.tsx
│   │   │   └── index.ts
│   │   ├── VideoWindow/
│   │   │   ├── VideoWindow.tsx
│   │   │   ├── VideoWindow.module.css
│   │   │   └── index.ts
│   │   ├── DebugPanel/
│   │   │   ├── DebugPanel.tsx
│   │   │   ├── DebugPanel.module.css
│   │   │   └── index.ts
│   │   └── VideoWall/
│   │       ├── VideoWall.tsx
│   │       ├── VideoWall.module.css
│   │       └── index.ts
│   └── index.ts                 # Package exports
├── playground/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.html
│   └── mock/streams.ts
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tsup.config.ts
└── README.md
```

---

## Phase 1: Project Setup

### Task 1: Initialize Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tsup.config.ts`, `vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "video-wall",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "react": ">=16.8",
    "react-dom": ">=16.8"
  },
  "dependencies": {
    "moveable": ">=0.50",
    "selecto": ">=1.20",
    "flv.js": "^1.6.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsup",
    "test": "vitest",
    "lint": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
});
```

- [ ] **Step 4: Create vite.config.ts (for playground dev)**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'playground',
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json vite.config.ts tsup.config.ts vitest.config.ts
git commit -m "chore: initial project setup"
```

---

## Phase 2: Types and Utilities

### Task 2: Define TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
export interface Cell {
  id: string;
  width: number;
  height: number;
  maxWindows?: number;
}

export interface Layout {
  rows: number;
  cols: number;
}

export interface WindowConfig {
  id: string;
  cellId: string;
  position: [number, number];
  size: [number, number];
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

export interface WindowState extends WindowConfig {
  zIndex: number;
  isActive: boolean;
}

export interface PresetLayout {
  name: string;
  windows: {
    cellId: string;
    position: [number, number];
    size: [number, number];
  }[];
}

export interface VideoWallProps {
  layout: Layout;
  cells: Cell[];
  gap?: number;
  background?: { color?: string; image?: string };
  scaleMode?: 'contain' | 'cover' | 'original' | 'custom';
  customScale?: number;
  debug?: boolean;
  persistence?: {
    enabled: boolean;
    storage?: 'localStorage' | 'sessionStorage';
    key?: string;
  };
  presets?: PresetLayout[];
  onLayoutChange?: (layout: Layout) => void;
  onWindowCreate?: (window: WindowConfig) => void;
  onWindowBeforeCreate?: (config: Partial<WindowConfig>) => Partial<WindowConfig> | null;
  onWindowClose?: (id: string) => void;
  onWindowActive?: (id: string) => void;
  onMaxWindowsReached?: (cellId: string, maxWindows: number) => void;
}

export interface VideoWallRef {
  addWindow(config: Partial<WindowConfig>): string | null;
  removeWindow(id: string): void;
  updateWindow(id: string, updates: Partial<WindowConfig>): void;
  getWindows(): WindowState[];
  getWindow(id: string): WindowState | undefined;
  setLayout(layout: Layout): void;
  applyPreset(presetName: string): void;
  getScale(): number;
  getViewport(): { width: number; height: number };
}

export type PlayerState = 'loading' | 'playing' | 'paused' | 'error';

export interface DebugInfo {
  scale: number;
  viewport: { width: number; height: number };
  totalWindows: number;
  visibleWindows: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript types"
```

---

### Task 3: Coordinate Utilities

**Files:**
- Create: `src/utils/coordinate.ts`

- [ ] **Step 1: Write coordinate utilities**

```typescript
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export function logicalToScreen(
  logical: Point | Size,
  scale: number
): Point | Size {
  return {
    x: 'x' in logical ? logical.x * scale : undefined,
    y: 'y' in logical ? logical.y * scale : undefined,
    width: 'width' in logical ? logical.width * scale : undefined,
    height: 'height' in logical ? logical.height * scale : undefined,
  } as Point | Size;
}

export function screenToLogical(
  screen: Point | Size,
  scale: number
): Point | Size {
  return {
    x: 'x' in screen ? screen.x / scale : undefined,
    y: 'y' in screen ? screen.y / scale : undefined,
    width: 'width' in screen ? screen.width / scale : undefined,
    height: 'height' in screen ? screen.height / scale : undefined,
  } as Point | Size;
}

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function doRectsOverlap(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
import { describe, expect, it } from 'vitest';
import {
  logicalToScreen,
  screenToLogical,
  isPointInRect,
  doRectsOverlap,
  getRectCenter,
} from './coordinate';

describe('coordinate', () => {
  describe('logicalToScreen', () => {
    it('converts logical coordinates to screen coordinates', () => {
      const point = { x: 100, y: 200 };
      const scale = 0.5;
      const result = logicalToScreen(point, scale);
      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
    });
  });

  describe('screenToLogical', () => {
    it('converts screen coordinates to logical coordinates', () => {
      const point = { x: 50, y: 100 };
      const scale = 0.5;
      const result = screenToLogical(point, scale);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });
  });

  describe('isPointInRect', () => {
    it('returns true when point is inside rect', () => {
      const point = { x: 50, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(isPointInRect(point, rect)).toBe(true);
    });

    it('returns false when point is outside rect', () => {
      const point = { x: 150, y: 150 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(isPointInRect(point, rect)).toBe(false);
    });
  });

  describe('doRectsOverlap', () => {
    it('returns true for overlapping rects', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 25, y: 25, width: 50, height: 50 };
      expect(doRectsOverlap(rect1, rect2)).toBe(true);
    });

    it('returns false for non-overlapping rects', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 100, y: 100, width: 50, height: 50 };
      expect(doRectsOverlap(rect1, rect2)).toBe(false);
    });
  });

  describe('getRectCenter', () => {
    it('calculates center correctly', () => {
      const rect = { x: 0, y: 0, width: 100, height: 200 };
      const center = getRectCenter(rect);
      expect(center.x).toBe(50);
      expect(center.y).toBe(100);
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test src/utils/coordinate.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/utils/coordinate.ts src/utils/coordinate.test.ts
git commit -m "feat: add coordinate utilities"
```

---

### Task 4: Layout Utilities

**Files:**
- Create: `src/utils/layout.ts`

- [ ] **Step 1: Write layout utilities**

```typescript
import type { Cell, Layout } from '../types';

export interface CellPosition {
  cellId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateCellPositions(
  cells: Cell[],
  layout: Layout,
  gap: number = 0
): CellPosition[] {
  const { rows, cols } = layout;
  const positions: CellPosition[] = [];
  
  let currentX = 0;
  let currentY = 0;
  let maxHeightInRow = 0;

  cells.forEach((cell, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    if (col === 0 && index > 0) {
      currentX = 0;
      currentY += maxHeightInRow + gap;
      maxHeightInRow = 0;
    }

    positions.push({
      cellId: cell.id,
      x: currentX,
      y: currentY,
      width: cell.width,
      height: cell.height,
    });

    currentX += cell.width + gap;
    maxHeightInRow = Math.max(maxHeightInRow, cell.height);
  });

  return positions;
}

export function getWallSize(
  cells: Cell[],
  layout: Layout,
  gap: number = 0
): { width: number; height: number } {
  const positions = calculateCellPositions(cells, layout, gap);
  if (positions.length === 0) return { width: 0, height: 0 };

  let maxX = 0;
  let maxY = 0;

  positions.forEach(pos => {
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });

  return { width: maxX, height: maxY };
}

export function calculateScale(
  wallSize: { width: number; height: number },
  containerSize: { width: number; height: number },
  mode: 'contain' | 'cover' | 'original' | 'custom',
  customScale?: number
): number {
  switch (mode) {
    case 'contain': {
      const scaleX = containerSize.width / wallSize.width;
      const scaleY = containerSize.height / wallSize.height;
      return Math.min(scaleX, scaleY);
    }
    case 'cover': {
      const scaleX = containerSize.width / wallSize.width;
      const scaleY = containerSize.height / wallSize.height;
      return Math.max(scaleX, scaleY);
    }
    case 'original':
      return 1;
    case 'custom':
      return customScale ?? 1;
  }
}

export function findCellAtPosition(
  x: number,
  y: number,
  cellPositions: CellPosition[]
): CellPosition | undefined {
  return cellPositions.find(
    pos => x >= pos.x && x <= pos.x + pos.width &&
           y >= pos.y && y <= pos.y + pos.height
  );
}
```

- [ ] **Step 2: Write tests**

```typescript
import { describe, expect, it } from 'vitest';
import {
  calculateCellPositions,
  getWallSize,
  calculateScale,
  findCellAtPosition,
} from './layout';
import type { Cell, Layout } from '../types';

describe('layout', () => {
  const cells: Cell[] = [
    { id: '0', width: 1920, height: 1080 },
    { id: '1', width: 1920, height: 1080 },
    { id: '2', width: 1920, height: 1080 },
    { id: '3', width: 1920, height: 1080 },
    { id: '4', width: 1920, height: 1080 },
    { id: '5', width: 1920, height: 1080 },
  ];
  const layout: Layout = { rows: 2, cols: 3 };

  describe('calculateCellPositions', () => {
    it('positions cells in correct order', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      
      expect(positions[0]).toEqual({ cellId: '0', x: 0, y: 0, width: 1920, height: 1080 });
      expect(positions[1]).toEqual({ cellId: '1', x: 1920, y: 0, width: 1920, height: 1080 });
      expect(positions[2]).toEqual({ cellId: '2', x: 3840, y: 0, width: 1920, height: 1080 });
      expect(positions[3]).toEqual({ cellId: '3', x: 0, y: 1080, width: 1920, height: 1080 });
      expect(positions[4]).toEqual({ cellId: '4', x: 1920, y: 1080, width: 1920, height: 1080 });
      expect(positions[5]).toEqual({ cellId: '5', x: 3840, y: 1080, width: 1920, height: 1080 });
    });

    it('applies gap between cells', () => {
      const positions = calculateCellPositions(cells, layout, 10);
      
      expect(positions[1].x).toBe(1930);
      expect(positions[3].y).toBe(1090);
    });
  });

  describe('getWallSize', () => {
    it('calculates total wall dimensions', () => {
      const size = getWallSize(cells, layout, 0);
      expect(size.width).toBe(5760);
      expect(size.height).toBe(2160);
    });
  });

  describe('calculateScale', () => {
    it('calculates contain scale correctly', () => {
      const wallSize = { width: 5760, height: 2160 };
      const containerSize = { width: 1920, height: 1080 };
      const scale = calculateScale(wallSize, containerSize, 'contain');
      expect(scale).toBeCloseTo(0.1875);
    });

    it('calculates cover scale correctly', () => {
      const wallSize = { width: 5760, height: 2160 };
      const containerSize = { width: 1920, height: 1080 };
      const scale = calculateScale(wallSize, containerSize, 'cover');
      expect(scale).toBeCloseTo(0.375);
    });
  });

  describe('findCellAtPosition', () => {
    it('finds cell at given position', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      const found = findCellAtPosition(1000, 500, positions);
      expect(found?.cellId).toBe('0');
    });

    it('returns undefined for position outside cells', () => {
      const positions = calculateCellPositions(cells, layout, 0);
      const found = findCellAtPosition(6000, 1000, positions);
      expect(found).toBeUndefined();
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test src/utils/layout.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/utils/layout.ts src/utils/layout.test.ts
git commit -m "feat: add layout utilities"
```

---

## Phase 3: Hooks

### Task 5: useVisibility Hook

**Files:**
- Create: `src/hooks/useVisibility.ts`

- [ ] **Step 1: Write hook**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

export function useVisibility(onVisibilityChange?: (visible: boolean) => void) {
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
  }, []);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        setIsVisible(visible);
        onVisibilityChange?.(visible);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onVisibilityChange]);

  return { isVisible, setElement };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useVisibility.ts
git commit -m "feat: add useVisibility hook"
```

---

### Task 6: usePersistence Hook

**Files:**
- Create: `src/hooks/usePersistence.ts`

- [ ] **Step 1: Write hook**

```typescript
import { useEffect, useCallback } from 'react';
import type { WindowState } from '../types';

interface PersistenceConfig {
  enabled: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  key?: string;
}

export function usePersistence(
  config: PersistenceConfig | undefined,
  windows: WindowState[],
  setWindows: (windows: WindowState[]) => void
) {
  const storage = config?.storage ?? 'localStorage';
  const key = config?.key ?? 'video-wall-state';

  const save = useCallback(() => {
    if (!config?.enabled) return;
    try {
      const data = JSON.stringify(windows);
      window[storage].setItem(key, data);
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [config?.enabled, windows, storage, key]);

  const load = useCallback(() => {
    if (!config?.enabled) return;
    try {
      const data = window[storage].getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as WindowState[];
        setWindows(parsed);
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }, [config?.enabled, storage, key, setWindows]);

  const clear = useCallback(() => {
    if (!config?.enabled) return;
    try {
      window[storage].removeItem(key);
    } catch (e) {
      console.warn('Failed to clear state:', e);
    }
  }, [config?.enabled, storage, key]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    save();
  }, [windows]);

  return { save, load, clear };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePersistence.ts
git commit -m "feat: add usePersistence hook"
```

---

### Task 7: useVideoWall Hook

**Files:**
- Create: `src/hooks/useVideoWall.ts`

- [ ] **Step 1: Write hook**

```typescript
import { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import type {
  VideoWallRef,
  VideoWallProps,
  WindowState,
  WindowConfig,
  Layout,
  Cell,
} from '../types';
import { usePersistence } from './usePersistence';
import { getWallSize, calculateCellPositions, calculateScale } from '../utils/layout';

export function useVideoWall(props: Omit<VideoWallProps, 'ref'>) {
  const {
    layout,
    cells,
    gap = 0,
    scaleMode = 'contain',
    customScale,
    persistence,
  } = props;

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  usePersistence(persistence, windows, setWindows);

  const cellPositions = useMemo(
    () => calculateCellPositions(cells, layout, gap),
    [cells, layout, gap]
  );

  const wallSize = useMemo(
    () => getWallSize(cells, layout, gap),
    [cells, layout, gap]
  );

  const scale = useMemo(
    () => calculateScale(wallSize, containerSize, scaleMode, customScale),
    [wallSize, containerSize, scaleMode, customScale]
  );

  const getMaxZIndex = useCallback(() => {
    if (windows.length === 0) return 0;
    return Math.max(...windows.map(w => w.zIndex));
  }, [windows]);

  const addWindow = useCallback((config: Partial<WindowConfig>): string | null => {
    const id = `window-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const newWindow: WindowState = {
      id,
      cellId: config.cellId ?? cells[0]?.id ?? '',
      position: config.position ?? [0, 0],
      size: config.size ?? [400, 300],
      streamUrl: config.streamUrl ?? '',
      title: config.title,
      locked: config.locked ?? false,
      border: config.border,
      minSize: config.minSize ?? [200, 150],
      snapGrid: config.snapGrid ?? 10,
      zIndex: getMaxZIndex() + 1,
      isActive: true,
    };

    setWindows(prev => [...prev, newWindow]);
    return id;
  }, [cells, getMaxZIndex]);

  const removeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const activateWindow = useCallback((id: string) => {
    const maxZ = getMaxZIndex();
    setWindows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, zIndex: maxZ + 1, isActive: true }
        : { ...w, isActive: false }
    ));
  }, [getMaxZIndex]);

  const setLayout = useCallback((newLayout: Layout) => {
    setWindows([]);
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = props.presets?.find(p => p.name === presetName);
    if (!preset) return;

    setWindows([]);
    preset.windows.forEach(winConfig => {
      addWindow({
        ...winConfig,
        cellId: winConfig.cellId,
      });
    });
  }, [props.presets, addWindow]);

  const handleContainerResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  return {
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
    containerRef,
    handleContainerResize,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useVideoWall.ts
git commit -m "feat: add useVideoWall hook"
```

---

### Task 7b: Presets

**Files:**
- Create: `src/presets/index.ts`

- [ ] **Step 1: Write presets**

```typescript
import type { PresetLayout } from '../types';

export const PRESETS: PresetLayout[] = [
  {
    name: '主副模式',
    windows: [
      { cellId: '0', position: [0, 0], size: [3840, 2160] },
    ],
  },
  {
    name: '等分四格',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '1', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '4', position: [0, 0], size: [1920, 1080] },
    ],
  },
  {
    name: '对称排列',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '2', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '5', position: [0, 0], size: [1920, 1080] },
    ],
  },
  {
    name: '3x3等分',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '1', position: [0, 0], size: [1920, 1080] },
      { cellId: '2', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '4', position: [0, 0], size: [1920, 1080] },
      { cellId: '5', position: [0, 0], size: [1920, 1080] },
    ],
  },
];

export function getPreset(name: string): PresetLayout | undefined {
  return PRESETS.find(p => p.name === name);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/presets/index.ts
git commit -m "feat: add preset layouts"
```

---

## Phase 4: Components

### Task 8: FlvPlayer Component

**Files:**
- Create: `src/components/FlvPlayer/FlvPlayer.tsx`, `src/components/FlvPlayer/index.ts`

- [ ] **Step 1: Write FlvPlayer**

```typescript
import { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import type { PlayerState } from '../../types';
import { useVisibility } from '../../hooks/useVisibility';

interface FlvPlayerProps {
  url: string;
  autoplay?: boolean;
  onStateChange?: (state: PlayerState) => void;
}

export function FlvPlayer({ url, autoplay = true, onStateChange }: FlvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const [state, setState] = useState<PlayerState>('loading');

  const { isVisible, setElement } = useVisibility((visible) => {
    if (playerRef.current) {
      if (visible) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;

    if (flvjs.isSupported()) {
      const player = flvjs.createPlayer({
        type: 'flv',
        url,
        hasAudio: false,
        hasVideo: true,
        isLive: true,
      });

      player.attachMediaElement(videoRef.current);
      player.load();
      
      if (autoplay) {
        player.play();
      }

      player.on(flvjs.Events.ERROR, () => {
        setState('error');
        onStateChange?.('error');
      });

      player.on(flvjs.Events.LOADING_COMPLETE, () => {
        setState('paused');
        onStateChange?.('paused');
      });

      playerRef.current = player;
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, [url, autoplay, onStateChange]);

  useEffect(() => {
    if (isVisible && state !== 'loading') {
      playerRef.current?.play();
      setState('playing');
      onStateChange?.('playing');
    } else if (!isVisible && state === 'playing') {
      playerRef.current?.pause();
      setState('paused');
      onStateChange?.('paused');
    }
  }, [isVisible, state, onStateChange]);

  return (
    <div ref={setElement} style={{ width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        muted
      />
    </div>
  );
}
```

- [ ] **Step 2: Create index.ts**

```typescript
export { FlvPlayer } from './FlvPlayer';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FlvPlayer/FlvPlayer.tsx src/components/FlvPlayer/index.ts
git commit -m "feat: add FlvPlayer component"
```

---

### Task 9: Mp4Player Component

**Files:**
- Create: `src/components/Mp4Player/Mp4Player.tsx`, `src/components/Mp4Player/index.ts`

- [ ] **Step 1: Write Mp4Player**

```typescript
import { useEffect, useRef, useState } from 'react';
import type { PlayerState } from '../../types';
import { useVisibility } from '../../hooks/useVisibility';

interface Mp4PlayerProps {
  url: string;
  autoplay?: boolean;
  onStateChange?: (state: PlayerState) => void;
}

export function Mp4Player({ url, autoplay = true, onStateChange }: Mp4PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlayerState>('loading');

  const { isVisible, setElement } = useVisibility((visible) => {
    if (videoRef.current) {
      if (visible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleCanPlay = () => {
      setState('paused');
      onStateChange?.('paused');
      if (autoplay) {
        video.play();
      }
    };

    const handlePlay = () => {
      setState('playing');
      onStateChange?.('playing');
    };

    const handlePause = () => {
      setState('paused');
      onStateChange?.('paused');
    };

    const handleError = () => {
      setState('error');
      onStateChange?.('error');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [url, autoplay, onStateChange]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible && state !== 'loading' && state !== 'playing') {
      videoRef.current.play();
    } else if (!isVisible && state === 'playing') {
      videoRef.current.pause();
    }
  }, [isVisible, state]);

  return (
    <div ref={setElement} style={{ width: '100%', height: '100%', background: '#000' }}>
      <video
        ref={videoRef}
        src={url}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        muted
        playsInline
      />
    </div>
  );
}
```

- [ ] **Step 2: Create index.ts**

```typescript
export { Mp4Player } from './Mp4Player';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mp4Player/Mp4Player.tsx src/components/Mp4Player/index.ts
git commit -m "feat: add Mp4Player component"
```

---

### Task 10: VideoWindow Component

**Files:**
- Create: `src/components/VideoWindow/VideoWindow.tsx`, `src/components/VideoWindow/VideoWindow.module.css`, `src/components/VideoWindow/index.ts`

- [ ] **Step 1: Write VideoWindow**

```typescript
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
```

- [ ] **Step 2: Write CSS (minimal, mostly using inline styles)**

```css
/* VideoWindow styles - using CSS Modules for scoping */
.window {
  position: absolute;
  overflow: hidden;
  background: #000;
}

.windowActive {
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.titleBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
}

.closeButton {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
```

- [ ] **Step 3: Create index.ts**

```typescript
export { VideoWindow } from './VideoWindow';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/VideoWindow/VideoWindow.tsx src/components/VideoWindow/VideoWindow.module.css src/components/VideoWindow/index.ts
git commit -m "feat: add VideoWindow component"
```

---

### Task 11: DebugPanel Component

**Files:**
- Create: `src/components/DebugPanel/DebugPanel.tsx`, `src/components/DebugPanel/DebugPanel.module.css`, `src/components/DebugPanel/index.ts`

- [ ] **Step 1: Write DebugPanel**

```typescript
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
```

- [ ] **Step 2: Create DebugPanel.module.css**

```css
/* DebugPanel uses inline styles, but CSS module file exists for scoping */
```

- [ ] **Step 3: Create index.ts**

```typescript
export { DebugPanel } from './DebugPanel';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DebugPanel/DebugPanel.tsx src/components/DebugPanel/DebugPanel.module.css src/components/DebugPanel/index.ts
git commit -m "feat: add DebugPanel component"
```

---

### Task 12: VideoWall Component (Main)

**Files:**
- Create: `src/components/VideoWall/VideoWall.tsx`, `src/components/VideoWall/VideoWall.module.css`, `src/components/VideoWall/index.ts`

- [ ] **Step 1: Write VideoWall (core integration with Moveable and Selecto)**

```typescript
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

    moveableRef.current = new Moveable(wallRef.current, {
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
      onDragStart: (e) => {
        const windowId = e.target.getAttribute('data-window-id');
        if (windowId) {
          activateWindow(windowId);
          selectoRef.current?.checkDragStartFlag('drag');
        }
      },
      onDrag: (e) => {
        const windowId = e.target.getAttribute('data-window-id');
        if (windowId) {
          const newX = e.left / scale;
          const newY = e.top / scale;
          updateWindow(windowId, { position: [newX, newY] });
        }
      },
      onDragEnd: (e) => {
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
      },
      onResize: (e) => {
        const windowId = e.target.getAttribute('data-window-id');
        if (windowId) {
          const newWidth = e.width / scale;
          const newHeight = e.height / scale;
          updateWindow(windowId, { size: [newWidth, newHeight] });
          e.target.style.width = `${e.width}px`;
          e.target.style.height = `${e.height}px`;
        }
      },
    });

    selectoRef.current = new Selecto({
      container: wallRef.current,
      selectableTargets: ['[data-window-id]'],
      selectByClick: false,
      onSelectStart: (e) => {
        if (e.target.getAttribute('data-window-id')) {
          e.stop();
        }
      },
      onSelectEnd: (e) => {
        if (e.selected.length === 0) {
          const rect = e.inputEvent.target?.getBoundingClientRect?.();
          if (rect) {
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const startX = (rect.left - containerRect.left) / scale;
              const startY = (rect.top - containerRect.top) / scale;
              
              // Check if start position is occupied by any window
              const isStartOccupied = windows.some(win => {
                const winRight = win.position[0] + win.size[0];
                const winBottom = win.position[1] + win.size[1];
                return startX >= win.position[0] && startX <= winRight &&
                       startY >= win.position[1] && startY <= winBottom;
              });
              
              if (isStartOccupied) {
                return; // Don't create window if start position is occupied
              }
              
              const width = rect.width / scale;
              const height = rect.height / scale;

              const config = {
                position: [startX, startY] as [number, number],
                size: [width, height] as [number, number],
                streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              };

              // Check maxWindows limit per cell
              const cellId = config.cellId;
              const cell = cells.find(c => c.id === cellId);
              if (cell?.maxWindows) {
                const windowsInCell = windows.filter(w => w.cellId === cellId).length;
                if (windowsInCell >= cell.maxWindows) {
                  onMaxWindowsReached?.(cellId, cell.maxWindows);
                  return;
                }
              }

              const finalConfig = onWindowBeforeCreate?.(config) ?? config;
              if (finalConfig) {
                const id = addWindow(finalConfig);
                if (id) {
                  onWindowCreate?.({ ...finalConfig, id } as any);
                }
              }
            }
          }
        }
      },
    });

    return () => {
      moveableRef.current?.destroy();
      selectoRef.current?.destroy();
    };
  }, [wallSize, scale]);

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
```

- [ ] **Step 2: Create VideoWall.module.css**

```css
/* VideoWall container styles */
.container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.wall {
  position: relative;
  transform-origin: top left;
}
```

- [ ] **Step 3: Create index.ts**

```typescript
export { VideoWall } from './VideoWall';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/VideoWall/VideoWall.tsx src/components/VideoWall/VideoWall.module.css src/components/VideoWall/index.ts
git commit -m "feat: add VideoWall component with Moveable and Selecto integration"
```

---

## Phase 5: Playground

### Task 14: Playground Setup

**Files:**
- Create: `playground/index.html`, `playground/main.tsx`, `playground/App.tsx`, `playground/playground.css`, `playground/mock/streams.ts`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Video Wall Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './playground.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create App.tsx with full playground UI**

```typescript
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
```

- [ ] **Step 4: Create playground.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 5: Create mock/streams.ts**

```typescript
export const MOCK_STREAMS = {
  'Big Buck Bunny': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'Elephants Dream': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'Sintel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'Tears of Steel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'Test Pattern': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TestPattern.mp4',
};

export const FLV_STREAMS = {
  'ws-flv-example': 'wss://example.com/live/flv/stream1',
  'ws-local': 'ws://localhost:8080/live/flv/stream1',
};
```

- [ ] **Step 6: Commit**

```bash
git add playground/index.html playground/main.tsx playground/App.tsx playground/playground.css playground/mock/streams.ts
git commit -m "feat: add playground"
```

---

## Phase 6: GitHub Actions

### Task 15: CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run lint
      
      - name: Test
        run: npm test -- --run
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow"
```

---

### Task 16: Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create release workflow**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build library
        run: npm run build
      
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Build playground
        run: npm run build -- --mode playground
        env:
          VITE_APP_BASE: '/video-wall/'
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow"
```

---

## Phase 7: Finalization

### Task 17: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

**Plan complete.** All tasks defined with exact file paths, code, and commands.
