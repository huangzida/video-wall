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
| 吸附对齐 | 拖拽时自动吸附到网格 |
| Delete删除 | 选中窗口按Delete键删除 |
| 拖拽出屏删除 | 鼠标/触摸结束时判断窗口中心是否在容器外 |
| 点击置顶 | 点击窗口将其置顶 |

### 2.3 显示增强
- 窗口边框配置（颜色/粗细/圆角）
- 标题栏（显示窗口名称，可折叠）
- 加载/错误/断流状态提示
- 不可见时暂停视频（提升性能）

### 2.4 配置
| 功能 | 说明 |
|------|------|
| 开窗数量限制 | 每块小屏可配置最大窗口数 |
| 窗口锁定 | 锁定后禁止拖拽/调整 |
| 预设布局 | 模板如"主+副"、"等分四格"等 |
| 布局持久化 | 支持localStorage保存/恢复 |
| 调试面板 | 显示缩放比、坐标、FPS等 |

## 3. 技术栈

| 类别 | 选择 |
|------|------|
| 框架 | React 18+ (peerDependencies: >=16.8) |
| 语言 | TypeScript |
| 构建 | Vite + tsup |
| 样式 | CSS Modules |
| 拖拽/调整 | Moveable |
| 框选 | Selecto |
| 视频 | flv.js (ws-flv) |
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

VideoWindow — 纯展示层，状态由Moveable驱动
FlvPlayer — 封装flv.js，处理ws-flv流
```

### 4.2 核心概念

```
VideoWall
├── layout: { rows: number, cols: number }
├── cells: Cell[] — 每块小屏配置
│   └── { id, width, height, maxWindows? }
├── gap: number — 小屏间隙
├── windows: VideoWindow[]
└── viewport: { width, height }

VideoWindow
├── id, position, size, zIndex, isActive
├── locked: boolean
└── FlvPlayer

FlvPlayer
└── flvjs instance, state: loading | playing | paused | error
```

### 4.3 坐标系统

- **逻辑坐标** — 以小屏物理像素为单位
- **屏幕坐标** — 以容器像素为单位
- 缩放系数：`scale = containerSize / logicalSize`
- 拖拽时实时转换：`screenPos = logicalPos * scale`

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
  onLayoutChange?: (layout: Layout) => void;
  onWindowCreate?: (window: WindowConfig) => void;
  onWindowClose?: (id: string) => void;
  onWindowActive?: (id: string) => void;
}

interface Cell {
  id: string;
  width: number;   // 物理像素
  height: number;  // 物理像素
  maxWindows?: number;
}

interface PresetLayout {
  name: string;
  windows: { position: [number, number]; size: [number, number] }[];
}
```

### 5.2 VideoWindow Props

```typescript
interface VideoWindowProps {
  id: string;
  streamUrl: string;
  title?: string;
  initialPosition: [number, number];
  initialSize: [number, number];
  locked?: boolean;
  border?: { color?: string; width?: number; radius?: number };
  minSize?: [number, number];
  snapGrid?: number;
  onMove?: (id: string, position: [number, number]) => void;
  onResize?: (id: string, size: [number, number]) => void;
  onClose?: (id: string) => void;
}
```

## 6. 交互细节

### 6.1 框选新建
1. 在空白区域按下并拖动
2. Selecto 检测框选区域
3. 框选结束，计算位置和尺寸
4. 创建对应大小的窗口

### 6.2 拖拽出屏删除
```
onDragEnd:
  const center = getWindowCenter(element);
  if (center.x < 0 || center.x > wallWidth ||
      center.y < 0 || center.y > wallHeight) {
    deleteWindow(id);
  }
```

### 6.3 吸附对齐
- Moveable 内置 snap 能力
- 吸附阈值内自动对齐到网格
- 仅在大屏范围内生效

### 6.4 层级管理
- 新建窗口：`zIndex = max + 1`
- 点击置顶：`zIndex = max + 1`
- 当前激活窗口有边框高亮

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
│   │   └── FlvPlayer/
│   │       ├── FlvPlayer.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── usePersistence.ts
│   │   └── useVideoWall.ts
│   ├── utils/
│   │   └── coordinate.ts
│   ├── presets/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── playground/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.html
│   └── playground.css
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── dist/               # 构建输出
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
  3. 构建 playground
  4. 部署到 GitHub Pages

## 9. Playground

独立的调试和演示页面：
- 可视化配置所有 Props
- 实时预览效果
- 支持模拟视频流
- 调试面板显示内部状态
- 部署至 GitHub Pages

## 10. 约束与限制

- 视频流仅支持 ws-flv（flv.js）
- 最小窗口尺寸：200x150
- 依赖 React >= 16.8, ReactDOM >= 16.8
