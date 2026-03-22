import React from 'react';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface LayoutLabProps {
  onApplyStrategy: (strategy: 'free' | 'smart-grid' | 'focus-side' | 'pip') => void;
}

export function LayoutLab({ onApplyStrategy }: LayoutLabProps) {
  return (
    <section data-testid="lab-layout" style={labSectionStyle}>
      <h4 style={labTitleStyle}>Layout Lab</h4>
      <button style={labButtonStyle} onClick={() => onApplyStrategy('free')}>Free</button>
      <button style={labButtonStyle} onClick={() => onApplyStrategy('smart-grid')}>Smart Grid</button>
      <button style={labButtonStyle} onClick={() => onApplyStrategy('focus-side')}>Focus + Side</button>
      <button style={labButtonStyle} onClick={() => onApplyStrategy('pip')}>PiP</button>
    </section>
  );
}
