# Video Wall V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-architect Video Wall to support advanced interaction, layout/window orchestration, and unified API, with full feature visibility in playground.

**Architecture:** Keep one public product surface while introducing an internal WallStateKernel and four engines (Interaction/Layout/Window/Persistence). All state changes go through action/command pipeline; UI and playground consume only public APIs (`dispatch/getState/subscribe`). Implement in vertical slices with strict TDD, feature flags, and rollback-safe commits.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite playground, localStorage/sessionStorage, existing video players (flv/mp4).

---

## File Structure Impact

Core files to create:
- `src/types/v2.ts` (new action/result/error/state contracts)
- `src/core/kernel.ts` (WallStateKernel reducer + invariants)
- `src/core/history.ts` (patch history stack)
- `src/core/eventBus.ts` (typed event bus)
- `src/engines/interactionEngine.ts` (selection/drag/resize/shortcut intent)
- `src/engines/layoutEngine.ts` (zone mapping + conflict strategy)
- `src/engines/windowManager.ts` (grouping/lifecycle/batch helpers)
- `src/engines/persistenceEngine.ts` (snapshot v2 + migration chain)
- `src/hooks/useVideoWallV2.ts` (new orchestration hook)
- `src/utils/zones.ts` (zone mapping helpers)
- `src/utils/conflict.ts` (conflict resolution helpers)
- `src/featureFlags.ts` (V2 feature toggles)

Core files to modify:
- `src/types/index.ts` (re-export v2 contracts)
- `src/hooks/useVideoWall.ts` (bridge/compat to V2 when flags enabled)
- `src/components/VideoWall/VideoWall.tsx` (wire dispatch/getState/subscribe)
- `src/components/DebugPanel/DebugPanel.tsx` (action timeline/errors/history depth)
- `src/index.ts` (export updated API)

Playground files to modify/create:
- `playground/App.tsx` (PlaygroundLab host)
- `playground/playground.css` (lab layout)
- `playground/labs/InteractionLab.tsx`
- `playground/labs/LayoutLab.tsx`
- `playground/labs/WindowLab.tsx`
- `playground/labs/ApiLab.tsx`
- `playground/labs/HistoryLab.tsx`
- `playground/labs/PersistenceLab.tsx`
- `playground/mock/scenarios.ts` (preset scenes)

Test files to create/modify:
- `src/core/kernel.test.ts`
- `src/core/history.test.ts`
- `src/core/eventBus.test.ts`
- `src/engines/interactionEngine.test.ts`
- `src/engines/layoutEngine.test.ts`
- `src/engines/persistenceEngine.test.ts`
- `src/hooks/useVideoWallV2.test.tsx`
- `src/components/VideoWall/VideoWall.v2.test.tsx`
- `playground/labs/labs.integration.test.tsx`

Docs to update:
- `README.md`
- `README_zh.md`

## Feature Flag Wiring Strategy

- `FF_UNIFIED_API`: gate `dispatch/getState/subscribe` exposure on `VideoWallRef`.
- `FF_HISTORY_STACK`: gate history reducer and DebugPanel history widgets.
- `FF_ZONE_SUPPORT`: gate zone mapping and zone editor UI in LayoutLab.
- `FF_GROUP_OPERATIONS`: gate group actions and WindowLab group controls.
- `FF_LAYOUT_STRATEGIES`: gate smart-grid/focus-side/pip strategy selectors.
- `FF_PERSISTENCE_V2`: gate snapshot migration chain and PersistenceLab v2 panel.
- `FF_PLAYGROUND_LAB`: gate all six labs rendering in playground.

Validation matrix per PR:
- flags off: legacy paths pass existing tests.
- target flag on: new tests pass for that slice.
- all flags on: integration suite passes.

---

### Task 1: Add V2 Contracts and Feature Flags

**Files:**
- Create: `src/types/v2.ts`, `src/featureFlags.ts`
- Modify: `src/types/index.ts`, `src/index.ts`
- Test: `src/types/v2.contract.test.ts`

- [ ] **Step 1: Write failing contract test**

```ts
import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../types/v2';

describe('v2 contracts', () => {
  it('contains mandatory error codes', () => {
    expect(ErrorCode.ERR_LAYOUT_CONFLICT).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/types/v2.contract.test.ts`
Expected: FAIL (missing module or enum)

- [ ] **Step 3: Implement minimal contracts and flags**

Implement:
- full `Action` discriminated union baseline (interaction/window/group/layout/snapshot/history)
- `Result<T>`, `BatchResult`, `ErrorCode`
- `WallState` + `WindowState` v2 core fields
- feature flags: `FF_HISTORY_STACK`, `FF_ZONE_SUPPORT`, `FF_GROUP_OPERATIONS`, `FF_LAYOUT_STRATEGIES`, `FF_PERSISTENCE_V2`, `FF_UNIFIED_API`, `FF_PLAYGROUND_LAB`
- mandatory ErrorCode set: `ERR_WINDOW_NOT_FOUND`, `ERR_WINDOW_LOCKED`, `ERR_OUT_OF_BOUNDS`, `ERR_LAYOUT_CONFLICT`, `ERR_ZONE_CONFLICT`, `ERR_INVALID_ACTION`, `ERR_MIGRATION_FAILED`, `ERR_PERSISTENCE_IO`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/types/v2.contract.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/v2.ts src/featureFlags.ts src/types/index.ts src/index.ts src/types/v2.contract.test.ts
git commit -m "feat(v2): add contracts and feature flags"
```

---

### Task 2: Build Kernel + EventBus + History (State Backbone)

**Files:**
- Create: `src/core/kernel.ts`, `src/core/eventBus.ts`, `src/core/history.ts`
- Test: `src/core/kernel.test.ts`, `src/core/eventBus.test.ts`, `src/core/history.test.ts`

- [ ] **Step 1: Write failing kernel invariants tests**

Test invariants:
- selection ids must exist in windows
- windowOrder and windowsById must be one-to-one
- group/window zone references must be valid
- history size must not exceed configured capacity
- windows referencing groups must point to existing groups
- windows referencing zones must point to existing zones
- no duplicated window ids in windowOrder
- deleted window must be removed from selection and all groups
- batch rollback restores pre-transaction state exactly

- [ ] **Step 2: Run tests and confirm fail**

Run: `pnpm vitest run src/core/kernel.test.ts src/core/eventBus.test.ts src/core/history.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal reducer/event bus/history**

Implement:
- kernel reducer that handles a small set first (`window.create`, `window.update`, `window.remove`, `interaction.select.single`)
- typed publish/subscribe bus
- patch history push/undo/redo with capacity

- [ ] **Step 4: Re-run tests**

Run same command
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/*.ts src/core/*.test.ts
git commit -m "feat(v2): add kernel, event bus, and history backbone"
```

---

### Task 3: Implement Interaction Engine with Create-vs-Select Semantics

**Files:**
- Create: `src/engines/interactionEngine.ts`
- Modify: `src/components/VideoWall/VideoWall.tsx`
- Test: `src/engines/interactionEngine.test.ts`, `src/components/VideoWall/VideoWall.v2.test.tsx`

- [ ] **Step 1: Write failing tests for interaction rules**

Cases:
- drag on empty area => create window
- Shift+drag on empty area => box select
- single/append/range selection with auto anchor
- range ordering strategies: `spatial`, `createOrder`, `zIndexOrder`
- drag threshold: movement < 4px does not trigger drag mode
- modifier keys: Shift(ratio), Alt(center), Space(temp disable snap)

- [ ] **Step 2: Run targeted tests and confirm fail**

Run: `pnpm vitest run src/engines/interactionEngine.test.ts src/components/VideoWall/VideoWall.v2.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal interaction engine + VideoWall wiring**

Implement:
- action translation for click/drag/shortcut
- anchor behavior: shift click append on first multi-select, range-select when anchor and existing multi-select are present
- no direct mutable state path

- [ ] **Step 4: Re-run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engines/interactionEngine.ts src/components/VideoWall/VideoWall.tsx src/engines/interactionEngine.test.ts src/components/VideoWall/VideoWall.v2.test.tsx
git commit -m "feat(v2): implement interaction engine and create-vs-select behavior"
```

---

### Task 4: Implement Layout Engine (Zones + Conflict Pipeline)

**Files:**
- Create: `src/engines/layoutEngine.ts`, `src/utils/zones.ts`, `src/utils/conflict.ts`
- Test: `src/engines/layoutEngine.test.ts`

- [ ] **Step 1: Write failing tests for zone mapping and conflict order**

Cases:
- basisResolution scaling formula
- candidate ranking by overlapArea desc, zone priority desc, cell index asc
- conflict order: boundary -> zone -> overlap -> min size -> snap

- [ ] **Step 2: Run tests and confirm fail**

Run: `pnpm vitest run src/engines/layoutEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal layout engine**

Implement:
- zone rect scaling
- primary/secondary cell selection
- deterministic conflict decision pipeline

- [ ] **Step 4: Re-run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engines/layoutEngine.ts src/utils/zones.ts src/utils/conflict.ts src/engines/layoutEngine.test.ts
git commit -m "feat(v2): add zone mapping and conflict pipeline"
```

---

### Task 5: Implement Window Manager (Groups + Lifecycle + Batch Atomic)

**Files:**
- Create: `src/engines/windowManager.ts`
- Modify: `src/core/kernel.ts`
- Test: `src/engines/windowManager.test.ts`, `src/core/kernel.test.ts`

- [ ] **Step 1: Write failing tests for group and batch behavior**

Cases:
- group create/update/remove
- batch atomic rollback on failed action
- lifecycle transitions (`idle->mounting->ready`, error/suspended)

- [ ] **Step 2: Run tests and confirm fail**

Run: `pnpm vitest run src/engines/windowManager.test.ts src/core/kernel.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement window manager and batch atomic semantics**

Implement:
- group operations
- lifecycle transition guards
- batch `atomic=true` rollback with failed index in `error.detail.failedAt`

- [ ] **Step 4: Re-run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engines/windowManager.ts src/core/kernel.ts src/engines/windowManager.test.ts src/core/kernel.test.ts
git commit -m "feat(v2): add group lifecycle and atomic batch support"
```

---

### Task 6: Implement Persistence V2 (Snapshot + Migration Chain)

**Files:**
- Create: `src/engines/persistenceEngine.ts`
- Modify: `src/hooks/usePersistence.ts`
- Test: `src/engines/persistenceEngine.test.ts`

- [ ] **Step 1: Write failing tests for migration chain and fallback**

Cases:
- v1->v2->v3 chain migration
- migration failure fallback to safe default (`1x1`, empty windows)
- preserve raw payload for diagnostics
- schema mapping table validation:
  - v1: no zones/groups/lifecycle
  - v2: +zones +groups
  - v3: +lifecycle +priority

- [ ] **Step 2: Run tests and confirm fail**

Run: `pnpm vitest run src/engines/persistenceEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal persistence engine + hook integration**

Implement:
- `migrateSnapshot(from,to,payload)` iterative chain
- error publish with `ERR_MIGRATION_FAILED`
- persistence read/write through unified result model

- [ ] **Step 4: Re-run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engines/persistenceEngine.ts src/hooks/usePersistence.ts src/engines/persistenceEngine.test.ts
git commit -m "feat(v2): add snapshot migration chain and safe fallback"
```

---

### Task 7: Add useVideoWallV2 Hook and Public API Bridge

**Files:**
- Create: `src/hooks/useVideoWallV2.ts`
- Modify: `src/hooks/useVideoWall.ts`, `src/components/VideoWall/VideoWall.tsx`, `src/index.ts`
- Test: `src/hooks/useVideoWallV2.test.tsx`

- [ ] **Step 1: Write failing integration test for dispatch/getState/subscribe**

- [ ] **Step 2: Run failing test**

Run: `pnpm vitest run src/hooks/useVideoWallV2.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement hook and bridge layer**

Implement:
- create `src/hooks/useVideoWallV2.ts` as the V2 orchestration entry
- V2 state orchestration in `useVideoWallV2`
- compatibility bridge for current props/ref methods
- expose unified APIs when `FF_UNIFIED_API` is enabled

- [ ] **Step 4: Re-run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useVideoWallV2.ts src/hooks/useVideoWall.ts src/components/VideoWall/VideoWall.tsx src/index.ts src/hooks/useVideoWallV2.test.tsx
git commit -m "feat(v2): add useVideoWallV2 and unified API bridge"
```

---

### Task 8: Build PlaygroundLab (Full Feature Visibility)

**Files:**
- Create: `playground/labs/InteractionLab.tsx`, `playground/labs/LayoutLab.tsx`, `playground/labs/WindowLab.tsx`, `playground/labs/ApiLab.tsx`, `playground/labs/HistoryLab.tsx`, `playground/labs/PersistenceLab.tsx`, `playground/mock/scenarios.ts`
- Modify: `playground/App.tsx`, `playground/playground.css`, `src/components/DebugPanel/DebugPanel.tsx`
- Test: `playground/labs/labs.integration.test.tsx`

- [ ] **Step 1: Write failing playground integration tests**

Cases:
- six labs are rendered and connected to public API
- scenario load/reset works
- action timeline and error list are visible
- concurrent conflict handling: canvas drag has higher priority than lab config updates
- queued/debounced lab updates (150ms) do not override active pointer operations

- [ ] **Step 2: Run test and confirm fail**

Run: `pnpm vitest run playground/labs/labs.integration.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement labs with tabbed default + split optional**

Implement:
- tabbed/split modes
- debounce 150ms config apply
- user canvas interactions override lab updates when conflict happens

- [ ] **Step 4: Re-run test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add playground/App.tsx playground/playground.css playground/labs/*.tsx playground/mock/scenarios.ts src/components/DebugPanel/DebugPanel.tsx playground/labs/labs.integration.test.tsx
git commit -m "feat(playground): add PlaygroundLab for v2 feature debugging"
```

---

### Task 9: Documentation, Verification, and Release Readiness

**Files:**
- Modify: `README.md`, `README_zh.md`
- Optional Update: `docs/superpowers/specs/2026-03-22-video-wall-v2-design.md` (if implementation deltas found)

- [ ] **Step 1: Update docs with new API and interaction semantics**

Include:
- create-vs-select rules
- unified API examples (`dispatch`, `batch`, `subscribe`)
- feature flag usage in playground

- [ ] **Step 2: Run full verification suite**

Run:
- `pnpm vitest run`
- `pnpm lint`
- `pnpm build`

Expected:
- tests pass
- no type errors
- build success

---

### Task 10: Performance Baseline and Nightly Benchmark

**Files:**
- Create: `scripts/perf/v2-benchmark.mjs`, `scripts/perf/README.md`
- Modify: `.github/workflows/ci.yml` (or add `.github/workflows/perf-nightly.yml`)
- Optional Test: `scripts/perf/v2-benchmark.test.ts` (threshold assertions)

- [ ] **Step 1: Write failing perf threshold assertions**

- [ ] **Step 1: Implement benchmark harness and metrics output**

Implement:
- deterministic benchmark scenario runner
- JSON result output for CI parsing
- threshold check summary with pass/fail fields

- [ ] **Step 2: Capture baseline report locally**

Run: `node scripts/perf/v2-benchmark.mjs`
Expected: JSON report generated (baseline values recorded)

- [ ] **Step 3: Add threshold assertions and verify against baseline**

Thresholds from spec:
- drag p95 >= 60 FPS (100 windows, 30s, 3 rounds)
- history overhead <= 100 MB (delta from empty baseline)
- snapshot save <= 100 ms
- snapshot restore <= 200 ms
- single conflict decision <= 5 ms

Run: `node scripts/perf/v2-benchmark.mjs --assert`
Expected: PASS on baseline machine, FAIL when below threshold

- [ ] **Step 4: Add nightly CI job**

Implement:
- nightly workflow job runs benchmark
- alerts on threshold regression (non-blocking for normal PR CI)

- [ ] **Step 5: Commit**

```bash
git add scripts/perf/v2-benchmark.mjs scripts/perf/README.md .github/workflows/perf-nightly.yml
git commit -m "test(perf): add v2 benchmark baseline and nightly checks"
```

- [ ] **Step 3: Run manual acceptance in playground**

Checklist:
- all six labs usable
- all four scenarios work
- persistence migration fallback behavior observable

- [ ] **Step 4: Commit**

```bash
git add README.md README_zh.md
git commit -m "docs: update v2 API and playground guidance"
```

---

## Cross-Task Rules

- TDD is mandatory per task: write failing test first, then minimal implementation.
- Keep commits small and vertical; avoid batching unrelated files.
- Do not bypass public API from playground.
- Use feature flags to ship safely while integrating V2 internals.

## Suggested Execution Order

1. Task 1 -> Task 2 (contracts and backbone)
2. Task 3 -> Task 4 -> Task 5 (feature engines)
3. Task 6 -> Task 7 (persistence and API bridge)
4. Task 8 (playground full coverage)
5. Task 10 (performance baseline + nightly)
6. Task 9 (docs and final verification)
