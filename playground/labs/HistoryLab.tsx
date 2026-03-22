import React from 'react';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface HistoryLabProps {
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryLab({ onUndo, onRedo }: HistoryLabProps) {
  return (
    <section data-testid="lab-history" style={labSectionStyle}>
      <h4 style={labTitleStyle}>History Lab</h4>
      <button style={labButtonStyle} onClick={onUndo}>Undo</button>
      <button style={labButtonStyle} onClick={onRedo}>Redo</button>
    </section>
  );
}
