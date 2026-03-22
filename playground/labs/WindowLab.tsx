import React from 'react';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface WindowLabProps {
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
}

export function WindowLab({ onGroupSelected, onUngroupSelected }: WindowLabProps) {
  return (
    <section data-testid="lab-window" style={labSectionStyle}>
      <h4 style={labTitleStyle}>Window Lab</h4>
      <button style={labButtonStyle} onClick={onGroupSelected}>分组当前窗口</button>
      <button style={labButtonStyle} onClick={onUngroupSelected}>取消分组</button>
    </section>
  );
}
