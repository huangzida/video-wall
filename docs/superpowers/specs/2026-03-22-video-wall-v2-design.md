# Video Wall V2 设计文档（交互、布局与窗口管理、API）

日期：2026-03-22  
状态：Draft（已完成设计评审前版本）

## 1. 背景与目标

当前 video-wall 已具备基础可用能力：窗口创建、拖拽缩放、框选、持久化、基础事件回调与命令式 API。项目为新开发阶段，无历史迁移负担，允许进行架构级重构。

本轮目标：
- 在基础交互上升级到高频编排可用。
- 在布局与窗口管理上从“自由摆放”升级到“可编排、可复用、可回放”。
- 在 API 上从散点能力升级为统一动作与查询模型。
- 所有新增能力都必须在 playground 可视化呈现，支持实时调试和 demo 演示。

非目标：
- 本轮不引入多端协同编辑。
- 本轮不引入后端依赖。
- 本轮不引入独立 pro 版本分层。

## 2. 总体架构

### 2.1 设计原则

- 单一状态内核：所有状态统一归口，避免多源状态冲突。
- 单向动作流：任何状态变更必须通过 action/command 管道。
- 引擎解耦：交互、布局、窗口、持久化分模块协作。
- 对外统一 API：一套 API 兼顾简单调用与高级编排。

### 2.2 内核与引擎拆分

新增 WallStateKernel（状态内核）并拆分四个引擎：
- InteractionEngine：处理鼠标/键盘/触摸输入，输出标准 action。
- LayoutEngine：处理网格、zone、吸附、冲突、边界策略。
- WindowManager：处理窗口生命周期、分组、批量、层级。
- PersistenceEngine：处理快照、版本、迁移、恢复。

数据流：
1. 输入事件或 API 调用进入 action 管道。
2. Kernel 结合约束和策略生成 next state。
3. UI 渲染消费 next state。
4. event bus、history、persistence 同步产出副作用。

### 2.3 状态树 Schema（实现基线）

WallState 的规范化结构：
- windowsById: Record<WindowId, WindowState>
- windowOrder: WindowId[]
- selection: { selectedIds: WindowId[]; anchorId?: WindowId }
- groupsById: Record<GroupId, { id: GroupId; name: string; windowIds: WindowId[]; locked?: boolean }>
- zonesById: Record<ZoneId, Zone>
- layout: { rows: number; cols: number; strategy: LayoutStrategy; locked: boolean }
- history: { past: StatePatch[]; future: StatePatch[]; capacity: number }
- meta: { version: number; lastError?: ErrorPayload }

WindowState 字段定义（核心子集）：
- id: WindowId
- bounds: { x: number; y: number; width: number; height: number }
- zIndex: number
- zoneId?: ZoneId
- groupId?: GroupId
- locked: boolean
- collapsed: boolean
- lifecycle: idle | mounting | ready | error | suspended
- stream: { url: string; kind: flv | mp4 | auto }
- priority: number

状态不变量：
- selection.selectedIds 中的 id 必须全部存在于 windowsById。
- groupsById[*].windowIds 中的 id 必须全部存在于 windowsById。
- windowsById[*].zoneId 若存在，则 zonesById 必须存在对应 zone。
- windowsById[*].groupId 若存在，则 groupsById 必须存在对应 group。
- zonesById 必须在当前 wall 逻辑坐标范围内。
- history.past.length + history.future.length 不得超过配置容量上限。
- windowOrder 必须与 windowsById 键集合一一对应且无重复。

## 3. 基础交互增强（Interaction 2.0）

### 3.1 选择模型

- 单选：点击激活并置顶。
- 多选：Shift 点击追加/取消；框选默认产生多选集合。
- 锚点区间选：先设置锚点，Shift 点击目标执行区间选。

### 3.2 拖拽与缩放

- 组拖拽：多选后拖任意成员，整组平移。
- 组缩放：多选后显示包围框并按组缩放。
- 约束键：
  - Shift 保持比例
  - Alt 以中心缩放
  - Space 临时禁用吸附
- 防误触：引入拖拽阈值（默认 4 像素）。

### 3.3 吸附与对齐

- 吸附目标：网格线、墙边界、邻窗边、中心线。
- 视觉反馈：辅助线与距离提示。
- 优先级：边界 > 网格 > 邻窗（可配置）。
- 容差：可配置，默认 8 像素。

### 3.4 快捷键

默认快捷键：
- 删除：Delete / Backspace
- 撤销：Cmd+Z
- 重做：Cmd+Shift+Z
- 全选：Cmd+A（画布焦点内）
- 微调：方向键（1px），Shift+方向键（10px）
- 锁定切换：L
- 折叠切换：C

要求：支持禁用与重映射。

### 3.5 历史与恢复

- 所有用户动作进入历史栈。
- 事务动作仅记录为一条历史。
- 历史容量可配置（默认 100）。
- 记录最小 patch 以控制内存。

## 4. 布局与窗口管理增强（Layout/Window 2.0）

### 4.1 布局模型升级

- 保留原有 rows/cols + cells 物理网格。
- 新增逻辑区域 zones（如主画面区、告警区、轮播区）。
- 窗口优先绑定 zone，再映射到 cell，支持跨分辨率稳定布局。

Zone 定义与映射规则：
- Zone 是逻辑约束对象，不直接渲染为播放器实例。
- Zone 数据结构：{ id, name, rect, basisResolution, priority }
- rect 使用逻辑坐标；跨分辨率按 basisResolution 做比例换算。
- 映射流程：window -> zone -> candidate cells -> layout strategy placement。
- 当 zone 与冲突策略冲突时，优先级为：边界约束 > zone 约束 > 重叠策略 > 吸附。

### 4.1.1 Zone 到 Cell 的决策算法

坐标定义：
- wall 逻辑坐标系原点为左上角，单位为逻辑像素。
- zone.rect 使用绝对逻辑坐标：{ x, y, width, height }。
- basisResolution 固定为 { width: number, height: number }。

跨分辨率换算：
- sx = currentWallWidth / basisResolution.width
- sy = currentWallHeight / basisResolution.height
- mappedRect = { x * sx, y * sy, width * sx, height * sy }

候选与最终落位：
1. 计算 mappedRect 与每个 cell 的 overlapArea。
2. overlapArea > 0 的 cell 进入 candidates。
3. 按 (overlapArea desc, zone.priority desc, cell.index asc) 排序。
4. 取首位作为 primaryCell；其余作为 secondaryCells。
5. 交由 layout strategy 在 primaryCell/secondaryCells 内进行最终 placement。

多窗口绑定同一 zone：
- 允许。
- 分配顺序由 strategy 决定（默认 smart-grid）。
- 当 zone 容量不足且策略为 reject，返回 ERR_ZONE_CONFLICT。

### 4.2 布局策略

新增策略模式：
- free：自由模式
- smart-grid：智能填充
- focus-side：主辅分区
- pip：画中画

支持“手动干预后锁定”，避免策略反复覆盖人工调整。

### 4.3 分组能力

- 窗口可归属 groupId。
- 支持临时组与命名组。
- 组级操作：移动、缩放、锁定、隐藏、批量属性更新。
- 组内相对位置保持。

### 4.4 模板与快照

- LayoutTemplate：可复用布局模板（结构级）。
- WallSnapshot：完整状态快照（状态级）。
- 支持保存、恢复、回滚、局部恢复（仅布局/仅窗口）。

版本与迁移策略：
- 快照格式使用 schemaVersion（整数递增）。
- 迁移入口 migrateSnapshot(fromVersion, toVersion, payload)。
- 迁移失败策略：保留原始 payload，触发 system.error，并回退到安全默认布局。
- 向后兼容策略：仅保证最近两个主版本可直接迁移。

迁移链路规则：
- 采用逐级迁移，不允许跨级跳迁移。
- 示例：v1 -> v4 时执行 v1->v2、v2->v3、v3->v4。
- 若任一步失败：停止链路，记录 failedStep，进入安全默认布局并保留原始快照用于导出诊断。
- 安全默认布局：1x1 + 空窗口集 + 默认策略 free。

### 4.5 冲突与约束策略

- 重叠策略：allow-overlap | push-away | swap | reject
- 越界策略：clip | bounce-back | reject
- 尺寸冲突：auto-fix | reject

策略执行统一走 LayoutEngine 决策管道。

冲突决策顺序（固定）：
1. 越界检查（clip/bounce-back/reject）
2. zone 约束检查
3. 重叠策略处理（allow/push-away/swap/reject）
4. 最小尺寸修正（auto-fix/reject）
5. 吸附与对齐（最终落点）

原子事务默认行为：
- batch 默认 atomic=true。
- 任一步骤失败则整体回滚，并返回首个错误与失败 action 索引。

### 4.6 生命周期与资源策略

窗口生命周期：idle | mounting | ready | error | suspended
- 支持惰性挂载。
- 支持离屏挂起。
- 支持 priority 资源优先级。

## 5. API 设计（统一对外接口）

### 5.1 Props 分域化

从平铺 props 升级为域配置：
- interaction
- layoutEngine
- windowManager
- persistence

### 5.2 命令式 API

保留 ref 入口，新增统一动作与查询：
- dispatch(action)
- batch(actions, options)
- undo() / redo()
- getState()
- getSelection()
- getGroups()
- getLayoutSnapshot()

Action 契约骨架：
- interaction.select.single
- interaction.select.multi
- interaction.drag
- interaction.resize
- window.create
- window.update
- window.remove
- group.create
- group.update
- group.remove
- layout.applyStrategy
- layout.applyTemplate
- snapshot.save
- snapshot.restore
- history.undo
- history.redo

Action 参数最小定义：
- interaction.select.single: { id: WindowId; mode?: replace | append | toggle }
- interaction.select.multi: { ids: WindowId[]; mode?: replace | append }
- interaction.drag: { ids: WindowId[]; dx: number; dy: number; snap?: boolean }
- interaction.resize: { ids: WindowId[]; dw: number; dh: number; anchor?: nw | ne | sw | se | center }
- window.create: { config: Partial<WindowState> }
- window.update: { id: WindowId; patch: Partial<WindowState> }
- window.remove: { id: WindowId }
- group.create: { name?: string; windowIds: WindowId[] }
- group.update: { groupId: GroupId; patch: { name?: string; locked?: boolean } }
- group.remove: { groupId: GroupId }
- layout.applyStrategy: { strategy: free | smart-grid | focus-side | pip; options?: Record<string, unknown> }
- layout.applyTemplate: { templateId: string }
- snapshot.save: { name?: string }
- snapshot.restore: { snapshotId: string; mode?: full | layout-only | windows-only }

批处理契约：
- batch(actions, { atomic?: boolean, tag?: string })
- 返回 Result<BatchResult>

### 5.3 统一结果模型

所有动作返回 Result：
- success: { ok: true, data }
- failure: { ok: false, error: { code, message, detail } }

Result 与 Batch 一致性：
- dispatch 返回 Result<ActionResult>
- batch 返回 Result<BatchResult>
- BatchResult: { applied: number; rolledBack: boolean; tag?: string }
- batch 失败时 failedAt 放入 error.detail.failedAt，避免额外返回结构分叉。

ErrorCode 最小集合：
- ERR_WINDOW_NOT_FOUND
- ERR_WINDOW_LOCKED
- ERR_OUT_OF_BOUNDS
- ERR_LAYOUT_CONFLICT
- ERR_ZONE_CONFLICT
- ERR_INVALID_ACTION
- ERR_MIGRATION_FAILED
- ERR_PERSISTENCE_IO

### 5.4 事件总线

统一订阅：
- onEvent(event)
- subscribe(type, handler)

事件类型：
- interaction.*
- window.*
- layout.*
- history.*
- persistence.*
- system.error

### 5.5 TypeScript 契约

- Action 使用判别联合。
- ErrorCode 使用稳定枚举。
- Snapshot/Template 引入 version 字段与迁移器。

快捷键配置契约：
- setShortcutMap(map)
- disableShortcut(actionType)
- enableShortcut(actionType)
- getShortcutConflicts()

## 6. PlaygroundLab 设计（新增硬要求）

要求：所有新增能力都必须在 playground 中可见、可调、可验证。

集成边界：
- PlaygroundLab 只能通过公开 API（dispatch/getState/subscribe）与 VideoWall 通信。
- PlaygroundLab 不得直接访问内核私有状态。
- 现有 DebugPanel 保留为轻量状态面板，PlaygroundLab 为可交互实验面板。

并存与冲突处理：
- 展示模式：Tabbed（默认）或 Split（可选）。
- 当 Lab 参数编辑与画布实时交互冲突时，优先级为：用户直接画布操作 > Lab 配置面板。
- Lab 配置修改采用 debounce 150ms 推送，减少拖拽过程抖动。
- 一键重置/导入导出由 VideoWall 公开 API 执行，Lab 仅做 UI 触发。

新增控制面板区域：
- Interaction Lab：多选、吸附、快捷键映射、阈值调参。
- Layout Lab：策略切换、zone 编辑、冲突策略。
- Window Lab：分组操作、批量操作、生命周期模拟。
- API Lab：action 发射器、事务 batch、事件日志。
- History Lab：撤销重做、历史栈可视化。
- Persistence Lab：快照保存、版本迁移模拟。

新增预设演示：
- Stress 100 Windows
- Focus + Side
- Conflict Recovery
- Undo/Redo Torture

开发体验要求：
- 一键重置
- 一键导出当前配置
- 一键加载预置场景
- 关键参数实时可见

功能覆盖映射（新增能力 -> Lab）：
- 多选/组拖拽/组缩放 -> Interaction Lab
- zone 编辑/策略切换/冲突策略 -> Layout Lab
- 分组/批量更新/生命周期 -> Window Lab
- dispatch/batch/事件监听 -> API Lab
- undo/redo/事务回滚观测 -> History Lab
- snapshot 版本迁移/恢复 -> Persistence Lab

## 7. 错误处理与可观测性

### 7.1 错误模型

统一错误字段：
- code
- message
- detail
- recoverable

错误分类：
- 用户动作错误：软失败 + UI 提示 + 可继续操作
- 系统错误：降级策略 + system.error 事件

### 7.2 调试能力

Debug 面板扩展：
- Action 时间线
- 策略命中记录
- 错误列表
- 历史栈深度
- 快照版本与迁移状态

## 8. 测试策略

### 8.1 单元测试

- 选择状态机
- 吸附决策
- 冲突策略
- 错误码与 Result
- 迁移器

### 8.2 集成测试

- 多选组拖拽与组缩放
- 批量事务回滚
- 快照保存与恢复
- 撤销重做链路

### 8.3 E2E 与演示测试

- 基于 playground 预设场景自动回放
- 验证关键功能路径和事件顺序

### 8.4 性能测试

- 100 窗口拖拽帧率
- 历史栈内存增长
- 快照恢复耗时

量化指标（M5 验收）：
- 100 窗口拖拽：p95 >= 60 FPS
- 历史容量 100 条：额外内存 <= 100 MB
- 快照保存耗时：<= 100 ms
- 快照恢复耗时：<= 200 ms
- 单次冲突决策耗时：<= 5 ms

测试环境与采样：
- 浏览器：Chrome Stable 最新版。
- 设备基线：Apple Silicon 8C/16GB 或等效配置。
- 分辨率基线：1920x1080。
- FPS 采样：每次场景运行 30 秒，采样 3 轮，取整体 p95。
- 内存采样：空场景基线 + 压测场景差值，取峰值。
- CI 验证：性能脚本在 nightly 任务运行，超过阈值触发告警但不阻塞日常提交。

## 9. 分阶段里程碑

- M1（内核重构）
  - 完成 WallStateKernel、action 管道、基础事件总线
- M2（交互升级）
  - 完成多选、组拖拽缩放、吸附、快捷键、历史栈
- M3（布局窗口升级）
  - 完成 zones、策略模式、分组、模板快照
- M4（API 与 playground）
  - 完成统一 API、Result、PlaygroundLab 全覆盖
- M5（稳定化）
  - 完成性能调优、文档完善、回归清零

## 10. 风险与缓解

风险：
- 重构跨度大，短期内回归风险上升。
- 新增策略与状态机复杂度提升。
- playground 功能扩展可能与主库耦合过深。

缓解：
- 严格 action 契约测试。
- 阶段性 feature flag（仅开发环境）。
- playground 与 core 通过公共 API 通信，避免内部耦合。

Feature Flag 规划：
- FF_HISTORY_STACK
- FF_ZONE_SUPPORT
- FF_GROUP_OPERATIONS
- FF_LAYOUT_STRATEGIES
- FF_PERSISTENCE_V2
- FF_UNIFIED_API
- FF_PLAYGROUND_LAB

## 11. 验收标准

功能验收：
- 三大目标域（交互、布局/窗口、API）全部实现。
- 所有新增功能在 playground 可操作且可观察。

质量验收：
- 核心路径单元/集成/E2E 通过。
- 性能指标达到设定阈值。
- 错误可观测且可恢复。

文档验收：
- API 文档与 playground 演示一致。
- 至少 4 个预置 demo 可复现关键能力。
