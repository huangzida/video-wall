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
| 框选新建 | 在空白区域框选新建窗口，起始位置无窗口占用即可，结束位置可在其他窗口上；新建窗口自动置顶 |
| 拖拽移动 | 窗口在大屏范围内自由拖拽，拖拽即激活（置顶） |
| 8方向调整 | 通过边缘/角落调整窗口大小 |
| 吸附对齐 | 拖拽/调整时自动吸附到网格（snapGrid） |
| Delete删除 | 选中窗口按Delete键删除 |
| 拖拽出屏删除 | 鼠标/触摸结束时判断窗口中心是否在容器外 |
| 点击置顶 | 点击窗口将其置顶 |
| 标题栏折叠 | 点击标题栏可折叠/展开窗口 |

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
| 拖拽/调整 | 原生鼠标事件 (native mouse events) |
| 框选 | 原生鼠标事件 (native mouse events) |
| 视频 | flv.js ^1.6.2 (ws-flv) + HTML5 Video (mp4) |
| 测试 | Vitest + Testing Library |
| 发布 | npm + GitHub Packages |

## 4. 架构设计

### 4.1 模块结构

```
VideoWall (大屏容器)
├── 布局层 — 渲染cells网格、间隙
├── 窗口层 — 原生鼠标事件管理所有VideoWindow
├── 框选层 — 原生鼠标事件检测框选区域
└── 视频层 — FlvPlayer / Mp4Player 实例

VideoWindow — 展示层，状态由原生事件驱动
FlvPlayer — 封装flv.js，处理ws-flv流
Mp4Player — 封装HTML5 Video，处理mp4播放
```

### 4.2 核心概念

```
VideoWall
├── layout: { rows: number, cols: number }
├── cells: Cell[] — 按数组顺序排列（从上到下、从左到右）
│   └── { id, width, height, maxWindows? }
├── gap: number — 小屏间隙
├── windows: Map<string, WindowState>
└── viewport: { width, height }

VideoWindow
├── id, position, size, zIndex, isActive
├── locked: boolean
└── Player (FlvPlayer | Mp4Player)

Player
├── instance (flvjs.Player | HTMLVideoElement)
└── state: loading | playing | paused | error
```

### 4.3 坐标系统

- **逻辑坐标** — 以小屏物理像素为单位，窗口位置/大小始终用逻辑坐标
- **屏幕坐标** — 以容器像素为单位，内部转换用
- 缩放系数：`scale = containerSize / logicalSize`
- `initialPosition` 和 `initialSize` 使用逻辑坐标

### 4.4 Cell 布局

Cell 按数组顺序排列：
```
cells = [cell0, cell1, cell2, cell3, cell4, cell5]
layout = { rows: 2, cols: 3 }

布局结果：
cell0  cell1  cell2
cell3  cell4  cell5
```

Cell 在大屏逻辑空间中的位置由其在数组中的 index、layout 行列数、前面的 cells 尺寸 + gap 计算得出。

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
1. 任意时刻 Selecto 监测框选
2. 框选起始位置必须无窗口占用
3. 框选结束位置可在任意位置（包括其他窗口上）
4. 释放时计算选区 bounds
5. 触发 `onWindowBeforeCreate` 回调
6. 若返回有效 config，创建窗口并自动置顶
7. 若返回 null，触发 `onMaxWindowsReached` 或静默失败

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
- 暂未实现 (planned but not implemented)
- `snapGrid` 属性存在于类型定义中但未生效

### 6.4 层级管理
- 新建窗口：`zIndex = max + 1`
- 点击窗口：`zIndex = max + 1`，触发 `onActivate`
- 拖拽窗口：`zIndex = max + 1`，触发 `onActivate`
- 点击不触发 Selecto 选中（通过 Moveable 的 `stopPropagation` 实现）

### 6.5 原生事件协作
- 原生 mousedown/mouseup/mousemove 事件用于拖拽、调整大小和框选
- 通过 `target.closest('[data-window-id]')` 检测点击是否在窗口上
- 框选开始位置必须无窗口占用

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
│   │   ├── Mp4Player/
│   │   │   ├── Mp4Player.tsx
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
│       └── streams.ts  // Mock stream URLs (ws-flv + mp4)
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
- Mock 视频流：
  - ws-flv: 使用公开测试流
  - mp4: 使用在线 mp4（如 Big Buck Bunny 等公开视频）
- 调试面板显示内部状态
- 部署至 GitHub Pages

### Mock 流格式
```typescript
const MOCK_STREAMS = {
  // mp4 (HTML5 Video)
  'mp4-1': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'mp4-2': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  // ws-flv (flv.js)
  'flv-1': 'wss://example.com/live/flv/stream1',
  'flv-2': 'ws://localhost:8080/live/flv/stream1',
};
```

### 视频类型判断
根据 `streamUrl` 后缀自动判断：
- `.mp4` → Mp4Player (HTML5 Video)
- `.flv` 或 `ws://` / `wss://` → FlvPlayer (flv.js)

## 10. 约束与限制

- 视频流支持 ws-flv（flv.js ^1.6.2）和 mp4（HTML5 Video）
- 最小窗口尺寸：200x150
- 依赖 React >= 16.8, ReactDOM >= 16.8
- TypeScript strict mode
