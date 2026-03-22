import React from 'react';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface InteractionLabProps {
  onToggleShiftSelect: (enabled: boolean) => void;
}

export function InteractionLab({ onToggleShiftSelect }: InteractionLabProps) {
  return (
    <section data-testid="lab-interaction" style={labSectionStyle}>
      <h4 style={labTitleStyle}>Interaction Lab</h4>
      <button style={labButtonStyle} onClick={() => onToggleShiftSelect(true)}>启用 Shift 框选</button>
      <button style={labButtonStyle} onClick={() => onToggleShiftSelect(false)}>禁用 Shift 框选</button>
    </section>
  );
}
