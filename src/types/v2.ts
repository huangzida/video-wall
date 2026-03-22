export enum ErrorCode {
  ERR_WINDOW_NOT_FOUND = 'ERR_WINDOW_NOT_FOUND',
  ERR_WINDOW_LOCKED = 'ERR_WINDOW_LOCKED',
  ERR_OUT_OF_BOUNDS = 'ERR_OUT_OF_BOUNDS',
  ERR_LAYOUT_CONFLICT = 'ERR_LAYOUT_CONFLICT',
  ERR_ZONE_CONFLICT = 'ERR_ZONE_CONFLICT',
  ERR_INVALID_ACTION = 'ERR_INVALID_ACTION',
  ERR_MIGRATION_FAILED = 'ERR_MIGRATION_FAILED',
  ERR_PERSISTENCE_IO = 'ERR_PERSISTENCE_IO',
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  detail?: unknown;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorPayload };

export interface BatchResult {
  applied: number;
  rolledBack: boolean;
  tag?: string;
}

export type WindowId = string;
export type GroupId = string;
export type ZoneId = string;

export type WindowLifecycle = 'idle' | 'mounting' | 'ready' | 'error' | 'suspended';
export type StreamKind = 'flv' | 'mp4' | 'auto';
export type LayoutStrategy = 'free' | 'smart-grid' | 'focus-side' | 'pip';

export interface V2WindowState {
  id: WindowId;
  bounds: { x: number; y: number; width: number; height: number };
  zIndex: number;
  zoneId?: ZoneId;
  groupId?: GroupId;
  locked: boolean;
  collapsed: boolean;
  lifecycle: WindowLifecycle;
  stream: { url: string; kind: StreamKind };
  priority: number;
}

export interface Zone {
  id: ZoneId;
  name: string;
  rect: { x: number; y: number; width: number; height: number };
  basisResolution: { width: number; height: number };
  priority: number;
}

export interface V2WallState {
  windowsById: Record<WindowId, V2WindowState>;
  windowOrder: WindowId[];
  selection: { selectedIds: WindowId[]; anchorId?: WindowId };
  groupsById: Record<GroupId, { id: GroupId; name: string; windowIds: WindowId[]; locked?: boolean }>;
  zonesById: Record<ZoneId, Zone>;
  layout: { rows: number; cols: number; strategy: LayoutStrategy; locked: boolean };
  history: { past: unknown[]; future: unknown[]; capacity: number };
  meta: { version: number; lastError?: ErrorPayload };
}

export type Action =
  | { type: 'interaction.select.single'; id: WindowId; mode?: 'replace' | 'append' | 'toggle' }
  | { type: 'interaction.select.multi'; ids: WindowId[]; mode?: 'replace' | 'append' }
  | { type: 'interaction.drag'; ids: WindowId[]; dx: number; dy: number; snap?: boolean }
  | { type: 'interaction.resize'; ids: WindowId[]; dw: number; dh: number; anchor?: 'nw' | 'ne' | 'sw' | 'se' | 'center' }
  | { type: 'window.create'; config: Partial<V2WindowState> }
  | { type: 'window.update'; id: WindowId; patch: Partial<V2WindowState> }
  | { type: 'window.remove'; id: WindowId }
  | { type: 'group.create'; name?: string; windowIds: WindowId[] }
  | { type: 'group.update'; groupId: GroupId; patch: { name?: string; locked?: boolean } }
  | { type: 'group.remove'; groupId: GroupId }
  | { type: 'layout.applyStrategy'; strategy: LayoutStrategy; options?: Record<string, unknown> }
  | { type: 'layout.applyTemplate'; templateId: string }
  | { type: 'snapshot.save'; name?: string }
  | { type: 'snapshot.restore'; snapshotId: string; mode?: 'full' | 'layout-only' | 'windows-only' }
  | { type: 'history.undo' }
  | { type: 'history.redo' };
