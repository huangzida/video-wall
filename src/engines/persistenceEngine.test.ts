import { describe, expect, it } from 'vitest';
import {
  migrateSnapshot,
  restoreWithFallback,
  type SnapshotPayload,
} from './persistenceEngine';

describe('persistenceEngine', () => {
  it('migrates incrementally from v1 to v3', () => {
    const payload: SnapshotPayload = {
      schemaVersion: 1,
      layout: { rows: 1, cols: 1 },
      windows: [],
    };

    const migrated = migrateSnapshot(payload, 3);
    expect(migrated.schemaVersion).toBe(3);
    expect((migrated as any).groups).toEqual([]);
    expect((migrated as any).zones).toEqual([]);
  });

  it('falls back to safe default when migration fails and preserves raw payload', () => {
    const payload: SnapshotPayload = {
      schemaVersion: 99,
      layout: { rows: 4, cols: 4 },
      windows: [{ id: 'x' }],
    };

    const restored = restoreWithFallback(payload, 3);
    expect(restored.ok).toBe(false);
    if (!restored.ok) {
      expect(restored.error.code).toBe('ERR_MIGRATION_FAILED');
      expect((restored.error.detail as any).raw).toEqual(payload);
      expect((restored.error.detail as any).fallback.layout).toEqual({ rows: 1, cols: 1 });
    }
  });
});
