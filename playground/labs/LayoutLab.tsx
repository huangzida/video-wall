import React from 'react';

interface LayoutLabProps {
  onApplyStrategy: (strategy: 'free' | 'smart-grid' | 'focus-side' | 'pip') => void;
}

export function LayoutLab({ onApplyStrategy }: LayoutLabProps) {
  return (
    <section data-testid="lab-layout" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>Layout Lab</h4>
      <button onClick={() => onApplyStrategy('free')}>Free</button>
      <button onClick={() => onApplyStrategy('smart-grid')}>Smart Grid</button>
      <button onClick={() => onApplyStrategy('focus-side')}>Focus + Side</button>
      <button onClick={() => onApplyStrategy('pip')}>PiP</button>
    </section>
  );
}
