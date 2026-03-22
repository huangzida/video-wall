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
  collapsed?: boolean;
}

export interface PresetLayout {
  name: string;
  windows: {
    cellId: string;
    position: [number, number];
    size: [number, number];
    streamUrl?: string;
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
  showBorder?: boolean;
  showTitle?: boolean;
  showCollapse?: boolean;
  minSelectionSize?: number;
  defaultMinSize?: [number, number];
  defaultSnapGrid?: number;
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

export type {
  Action as V2Action,
  BatchResult as V2BatchResult,
  ErrorPayload as V2ErrorPayload,
  Result as V2Result,
  V2WallState,
  V2WindowState,
} from './v2';
export { ErrorCode } from './v2';
