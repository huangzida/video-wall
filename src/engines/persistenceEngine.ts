import { ErrorCode, type Result } from '../types/v2';

export interface SnapshotPayload {
  schemaVersion: number;
  layout: { rows: number; cols: number };
  windows: any[];
  zones?: any[];
  groups?: any[];
  meta?: Record<string, unknown>;
}

type Migrator = (payload: SnapshotPayload) => SnapshotPayload;

const migrators: Record<number, Migrator> = {
  1: (payload) => ({
    ...payload,
    schemaVersion: 2,
    zones: [],
    groups: [],
  }),
  2: (payload) => ({
    ...payload,
    schemaVersion: 3,
    windows: payload.windows.map(win => ({
      lifecycle: 'idle',
      priority: 0,
      ...win,
    })),
    zones: payload.zones ?? [],
    groups: payload.groups ?? [],
    meta: {
      migratedFrom: 2,
      ...(payload.meta ?? {}),
    },
  }),
};

export function migrateSnapshot(payload: SnapshotPayload, targetVersion: number): SnapshotPayload {
  let next = { ...payload };

  if (next.schemaVersion > targetVersion) {
    throw new Error('Snapshot schema version is newer than runtime target.');
  }

  while (next.schemaVersion < targetVersion) {
    const migrate = migrators[next.schemaVersion];
    if (!migrate) {
      throw new Error(`Missing migrator for version ${next.schemaVersion}`);
    }
    next = migrate(next);
  }

  return next;
}

export function safeDefaultSnapshot(targetVersion: number): SnapshotPayload {
  return {
    schemaVersion: targetVersion,
    layout: { rows: 1, cols: 1 },
    windows: [],
    zones: [],
    groups: [],
    meta: { safeDefault: true },
  };
}

export function restoreWithFallback(payload: SnapshotPayload, targetVersion: number): Result<SnapshotPayload> {
  try {
    const migrated = migrateSnapshot(payload, targetVersion);
    return { ok: true, data: migrated };
  } catch (error) {
    const fallback = safeDefaultSnapshot(targetVersion);
    return {
      ok: false,
      error: {
        code: ErrorCode.ERR_MIGRATION_FAILED,
        message: 'Snapshot migration failed and fallback snapshot was used.',
        detail: {
          raw: payload,
          fallback,
          reason: error instanceof Error ? error.message : String(error),
        },
      },
    };
  }
}
