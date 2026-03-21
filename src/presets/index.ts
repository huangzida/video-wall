import type { PresetLayout } from '../types';

export const PRESETS: PresetLayout[] = [
  {
    name: '主副模式',
    windows: [
      { cellId: '0', position: [0, 0], size: [3840, 2160] },
    ],
  },
  {
    name: '等分四格',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '1', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '4', position: [0, 0], size: [1920, 1080] },
    ],
  },
  {
    name: '对称排列',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '2', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '5', position: [0, 0], size: [1920, 1080] },
    ],
  },
  {
    name: '3x3等分',
    windows: [
      { cellId: '0', position: [0, 0], size: [1920, 1080] },
      { cellId: '1', position: [0, 0], size: [1920, 1080] },
      { cellId: '2', position: [0, 0], size: [1920, 1080] },
      { cellId: '3', position: [0, 0], size: [1920, 1080] },
      { cellId: '4', position: [0, 0], size: [1920, 1080] },
      { cellId: '5', position: [0, 0], size: [1920, 1080] },
    ],
  },
];

export function getPreset(name: string): PresetLayout | undefined {
  return PRESETS.find(p => p.name === name);
}
