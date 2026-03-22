# Video Wall

用于构建可视化大屏视频墙的 React NPM 包，支持窗口拖拽、框选新建、多流播放等功能。

[English](./README.md)

## 功能特性

### 布局
- 多单元格视频墙布局，支持配置行数和列数
- 单元格间距（gap）配置
- 多种缩放模式：适应（contain）、填充（cover）、原始（original）、自定义
- 背景颜色和图片支持

### 交互
- **框选新建**：在空白区域拖动绘制矩形创建新窗口
- **拖拽移动**：在墙内自由拖动窗口
- **8方向调整大小**：通过边缘和角落调整大小
- **吸附对齐**：拖拽/调整时自动吸附到网格
- **点击置顶**：点击窗口将其置顶
- **Delete 删除**：按 Delete 键删除选中窗口
- **拖出边界删除**：将窗口拖出墙外自动删除

### 窗口管理
- 窗口锁定（禁止拖拽/调整大小）
- 标题栏折叠/展开（可选，默认禁用）
- 每块小屏最大窗口数限制
- 窗口层级管理

### 视频支持
- ws-flv 流媒体支持（flv.js）
- mp4 视频支持（HTML5 Video）
- 自动检测流类型
- 基于可见性的视频暂停（IntersectionObserver）
- 加载、播放、暂停、错误状态

### 状态与持久化
- localStorage 持久化（可选）
- 调试面板显示缩放、视口、窗口数等信息

### 开发支持
- 完整的 TypeScript 支持
- 调试面板监控内部状态

## 安装

```bash
npm install video-wall
```

## 使用示例

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
      onWindowCreate={(win) => console.log('窗口创建:', win)}
      onWindowClose={(id) => console.log('窗口关闭:', id)}
    />
  );
}
```

## API 文档

### VideoWall Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `layout` | `{ rows: number, cols: number }` | 必填 | 网格布局 |
| `cells` | `Cell[]` | 必填 | 单元格配置 |
| `gap` | `number` | `0` | 单元格间距 |
| `background` | `{ color?: string, image?: string }` | - | 背景配置 |
| `scaleMode` | `'contain' \| 'cover' \| 'original' \| 'custom'` | `'contain'` | 缩放模式 |
| `customScale` | `number` | `1` | 自定义缩放值 |
| `debug` | `boolean` | `false` | 显示调试面板 |
| `showBorder` | `boolean` | `true` | 显示窗口边框 |
| `showTitle` | `boolean` | `true` | 显示窗口标题 |
| `showCollapse` | `boolean` | `false` | 启用标题栏折叠 |
| `persistence` | `{ enabled: boolean, storage?: 'localStorage' \| 'sessionStorage', key?: string }` | - | 持久化配置 |
| `presets` | `PresetLayout[]` | - | 预设布局 |
| `onLayoutChange` | `(layout: Layout) => void` | - | 布局变更回调 |
| `onWindowCreate` | `(window: WindowConfig) => void` | - | 窗口创建回调 |
| `onWindowBeforeCreate` | `(config: Partial<WindowConfig>) => Partial<WindowConfig> \| null` | - | 创建前钩子 |
| `onWindowClose` | `(id: string) => void` | - | 窗口关闭回调 |
| `onWindowActive` | `(id: string) => void` | - | 窗口激活回调 |
| `onMaxWindowsReached` | `(cellId: string, maxWindows: number) => void` | - | 达到最大窗口数回调 |

### VideoWallRef（命令式 API）

```tsx
const wallRef = useRef<VideoWallRef>(null);

// 添加窗口
wallRef.current?.addWindow({
  position: [100, 100],
  size: [400, 300],
  streamUrl: 'https://example.com/video.mp4',
  title: '摄像头 1',
});

// 删除窗口
wallRef.current?.removeWindow(windowId);

// 更新窗口属性
wallRef.current?.updateWindow(windowId, { locked: true });

// 获取所有窗口
const windows = wallRef.current?.getWindows();

// 应用预设布局
wallRef.current?.applyPreset('四格布局');

// 获取当前缩放值
const scale = wallRef.current?.getScale();
```

### Cell 接口

```tsx
interface Cell {
  id: string;
  width: number;    // 逻辑像素宽度
  height: number;   // 逻辑像素高度
  maxWindows?: number; // 每单元格最大窗口数
}
```

### WindowConfig 接口

```tsx
interface WindowConfig {
  id: string;
  cellId: string;
  position: [number, number];  // x, y 逻辑像素
  size: [number, number];     // width, height 逻辑像素
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
```

## 架构设计

```
VideoWall（主容器）
├── 布局层 - 渲染单元格网格
├── 窗口层 - 原生鼠标事件处理拖拽/调整
├── 框选层 - 原生鼠标事件处理框选
└── 视频层 - FlvPlayer / Mp4Player 实例

VideoWindow - 展示层，由原生事件驱动
FlvPlayer - flv.js 封装，处理 ws-flv 流
Mp4Player - HTML5 Video 封装，处理 mp4 视频
```

## 坐标系统

- **逻辑坐标**：窗口位置/大小始终使用逻辑像素
- **屏幕坐标**：内部通过缩放因子转换
- 缩放因子：`scale = containerSize / logicalSize`

## 许可证

MIT
