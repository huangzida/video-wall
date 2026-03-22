import React from 'react';

interface HistoryLabProps {
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryLab({ onUndo, onRedo }: HistoryLabProps) {
  return (
    <section data-testid="lab-history" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>History Lab</h4>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onRedo}>Redo</button>
    </section>
  );
}
