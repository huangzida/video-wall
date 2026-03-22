import React from 'react';

interface InteractionLabProps {
  onToggleShiftSelect: (enabled: boolean) => void;
}

export function InteractionLab({ onToggleShiftSelect }: InteractionLabProps) {
  return (
    <section data-testid="lab-interaction" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>Interaction Lab</h4>
      <button onClick={() => onToggleShiftSelect(true)}>启用 Shift 框选</button>
      <button onClick={() => onToggleShiftSelect(false)}>禁用 Shift 框选</button>
    </section>
  );
}
