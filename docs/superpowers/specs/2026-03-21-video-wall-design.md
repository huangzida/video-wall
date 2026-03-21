# Video Wall - 可视化大屏视频墙

## 1. 项目概述

React NPM 包，用于构建可视化大屏视频墙显示和交互系统。支持多块小屏拼接成大屏，窗口拖拽、调整大小、框选新建等功能。

## 2. 功能清单

### 2.1 基础显示
- 缩放模式（填充/适应/原始/自定义比例）
- 全屏切换
- 背景设置（颜色/图片）

### 2.2 交互
| 功能 | 说明 |
|------|------|
| 框选新建 | 在空白区域框选新建窗口，框选范围即窗口大小 |
| 拖拽移动 | 窗口在大屏范围内自由拖拽 |
| 8方向调整 | 通过边缘/角落调整窗口大小 |
| 吸附对齐 | 拖拽时自动吸附到网格（仅大屏范围内） |
| Delete删除 | 选中窗口按Delete键删除 |
| 拖拽出屏删除 | 鼠标/触摸结束时判断窗口中心是否在容器外 |
| 点击置顶 | 点击窗口将其置顶（不选中，不触发框选） |

### 2.3 显示增强
- 窗口边框配置（颜色/粗细/圆角）
- 标题栏（显示窗口名称，单击折叠/展开）
- 加载/错误/断流状态提示
- 不可见时暂停视频（使用 IntersectionObserver 检测可见性）

### 2.4 配置
| 功能 | 说明 |
|------|------|
| 开窗数量限制 | 每块小屏可配置最大窗口数，超限时触发 `onMaxWindowsReached` |
| 窗口锁定 | 锁定后禁止拖拽/调整 |
| 预设布局 | 模板如"主+副"、"等分四格"等 |
| 布局持久化 | 支持localStorage保存/恢复 |
| 调试面板 | 显示缩放比、坐标、窗口数量、可见窗口数 |

## 3. 技术栈

| 类别 | 选择 |
|------|------|
| 框架 | React 18+ (peerDependencies: >=16.8) |
| 语言 | TypeScript (strict mode) |
| 构建 | Vite + tsup |
| 样式 | CSS Modules + CSS Custom Properties |
| 拖拽/调整 | Moveable >=0.50 |
| 框选 | Selecto >=1.20 |
| 视频 | flv.js ^1.6.2 (ws-flv) |
| 测试 | Vitest + Testing Library |
| 发布 | npm + GitHub Packages |

## 4. 架构设计

### 4.1 模块结构

```
VideoWall (大屏容器)
├── 布局层 — 渲染cells网格、间隙
├── 窗口层 — Moveable管理所有VideoWindow
├── 框选层 — Selecto检测框选区域
└── 视频层 — FlvPlayer实例

VideoWindow — 展示层，状态由Moveable驱动
FlvPlayer — 封装flv.js，处理ws-flv流
```

### 4.2 核心概念

```
VideoWall
├── layout: { rows: number, cols: number }
├── cells: Cell[] — 按row/col排列的小屏列表
│   └── { id, row, col, width, height, maxWindows? }
├── gap: number — 小屏间隙
├── windows: Map<string, WindowState>
└── viewport: { width, height }

VideoWindow
├── id, position, size, zIndex, isActive
├── locked: boolean
└── FlvPlayer

FlvPlayer
└── flvjs instance, state: loading | playing | paused | error
```

### 4.3 坐标系统

- **逻辑坐标** — 以小屏物理像素为单位，窗口位置/大小始终用逻辑坐标
- **屏幕坐标** — 以容器像素为单位，内部转换用
- 缩放系数：`scale = containerSize / logicalSize`
- `initialPosition` 和 `initialSize` 使用逻辑坐标

### 4.4 Cell 布局

Cell 按 `row` 和 `col` 在 layout grid 中排列：
```
Cell { row: 0, col: 0 }  Cell { row: 0, col: 1 }  Cell { row: 0, col: 2 }
Cell { row: 1, col: 0 }  Cell { row: 1, col: 1 }  Cell { row: 1, col: 2 }
```

Cell 在大屏逻辑空间中的位置由其 row/col 和前面所有 cells 的尺寸 + gap 计算得出。

## 5. API 设计

### 5.1 VideoWall Props

```typescript
interface VideoWallProps {
  layout: { rows: number; cols: number };
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
  
  // 回调
  onLayoutChange?: (layout: Layout) => void;
  onWindowCreate?: (window: WindowConfig) => void;
  onWindowBeforeCreate?: (config: Partial<WindowConfig>) => Partial<WindowConfig> | null;
  onWindowClose?: (id: string) => void;
  onWindowActive?: (id: string) => void;
  onMaxWindowsReached?: (cellId: string, maxWindows: number) => void;
}

interface Cell {
  id: string;
  row: number;    // 0-indexed
  col: number;     // 0-indexed
  width: number;  // 物理像素
  height: number; // 物理像素
  maxWindows?: number;  // 默认 Infinity（无限制）
}

interface PresetLayout {
  name: string;
  windows: { 
    cellId: string;  // 关联的Cell
    position: [number, number];  // 相对于cell的逻辑坐标
    size: [number, number];
  }[];
}
```

### 5.2 VideoWindow Props

```typescript
interface VideoWindowProps {
  id: string;
  streamUrl: string;
  title?: string;
  initialPosition: [number, number];  // 逻辑坐标
  initialSize: [number, number];      // 逻辑坐标
  locked?: boolean;
  border?: { color?: string; width?: number; radius?: number };
  minSize?: [number, number];          // 默认 [200, 150]
  snapGrid?: number;                  // 默认 10
  onMove?: (id: string, position: [number, number]) => void;
  onResize?: (id: string, size: [number, number]) => void;
  onClose?: (id: string) => void;
  onActivate?: (id: string) => void;
}
```

### 5.3 Imperative API (useVideoWall)

```typescript
interface VideoWallRef {
  // 窗口管理
  addWindow(config: WindowConfig): string | null;  // 返回windowId，null表示失败
  removeWindow(id: string): void;
  updateWindow(id: string, updates: Partial<WindowConfig>): void;
  getWindows(): WindowState[];
  getWindow(id: string): WindowState | undefined;
  
  // 布局
  setLayout(layout: { rows: number; cols: number }): void;
  applyPreset(presetName: string): void;
  
  // 状态
  getScale(): number;
  getViewport(): { width: number; height: number };
}

interface WindowState {
  id: string;
  position: [number, number];
  size: [number, number];
  zIndex: number;
  isActive: boolean;
  locked: boolean;
  streamUrl: string;
  title?: string;
}
```

### 5.4 Container 响应式

容器 resize 时：
1. 重新计算 scale
2. 窗口 position/size 保持逻辑坐标不变，仅视觉缩放
3. 触发 `onLayoutChange`

## 6. 交互细节

### 6.1 框选新建
1. Moveable 未选中任何窗口时，Selecto 开始框选
2. 拖动时 Selecto 高亮选区
3. 释放时计算选区 bounds
4. 若选区在空白区域，触发 `onWindowBeforeCreate` 回调
5. 若返回有效 config，创建窗口；否则触发 `onMaxWindowsReached` 或静默失败

### 6.2 拖拽出屏删除
```
onDragEnd:
  const center = getWindowCenter(element);
  if (center.x < 0 || center.x > wallWidth ||
      center.y < 0 || center.y > wallHeight) {
    removeWindow(id);
    onWindowClose?.(id);
  }
```

### 6.3 吸附对齐
- Moveable snap 阈值内自动对齐到 `snapGrid` 网格
- 仅在大屏逻辑边界内生效

### 6.4 层级管理
- 新建窗口：`zIndex = max + 1`
- 点击窗口（非拖拽）：`zIndex = max + 1`，触发 `onActivate`
- 点击不触发 Selecto 选中（通过 Moveable 的 `stopPropagation` 实现）

### 6.5 Selecto/Moveable 协作
- `selectableTargets` 排除 Moveable 激活的元素
- `Moveable.onDragStart` 时阻止 Selecto 开始框选
- 窗口未激活时，Selecto 才能框选空白区域

### 6.6 调试面板内容
| 内容 | 说明 |
|------|------|
| Scale | 当前缩放比例 |
| Viewport | 容器像素尺寸 |
| Windows | 总窗口数 |
| Visible | 可见窗口数 |
| FPS | 可选渲染帧率（默认关闭） |

## 7. 项目结构

```
video-wall/
├── src/
│   ├── components/
│   │   ├── VideoWall/
│   │   │   ├── VideoWall.tsx
│   │   │   ├── VideoWall.module.css
│   │   │   └── index.ts
│   │   ├── VideoWindow/
│   │   │   ├── VideoWindow.tsx
│   │   │   ├── VideoWindow.module.css
│   │   │   └── index.ts
│   │   ├── FlvPlayer/
│   │   │   ├── FlvPlayer.tsx
│   │   │   └── index.ts
│   │   └── DebugPanel/
│   │       ├── DebugPanel.tsx
│   │       ├── DebugPanel.module.css
│   │       └── index.ts
│   ├── hooks/
│   │   ├── usePersistence.ts
│   │   ├── useVideoWall.ts
│   │   └── useVisibility.ts  // IntersectionObserver
│   ├── utils/
│   │   ├── coordinate.ts
│   │   └── layout.ts
│   ├── presets/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── playground/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.html
│   ├── playground.css
│   └── mock/
│       └── streams.ts  // Mock ws-flv stream URLs
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── dist/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tsup.config.ts
└── README.md
```

## 8. GitHub Actions

### 8.1 CI Workflow
- 触发：PR 和 main 提交
- 步骤：lint → typecheck → test

### 8.2 Release Workflow
- 触发：git tag push
- 步骤：
  1. 构建库 (tsup)
  2. 发布到 npm
  3. 构建 playground (vite build)
  4. 部署到 GitHub Pages

## 9. Playground

独立的调试和演示页面：
- 可视化配置所有 Props
- 实时预览效果
- Mock 视频流：使用公开的测试流或本地模拟
- 调试面板显示内部状态
- 部署至 GitHub Pages

### Mock 流格式
```typescript
const MOCK_STREAMS = {
  // 使用公开测试流
  'test-1': 'wss://example.com/live/flv/stream1',
  // 本地开发模拟
  'local': 'ws://localhost:8080/live/flv/stream1',
};
```

## 10. 约束与限制

- 视频流仅支持 ws-flv（flv.js ^1.6.2）
- 最小窗口尺寸：200x150
- 依赖 React >= 16.8, ReactDOM >= 16.8
- TypeScript strict mode
