import React from 'react';

interface WindowLabProps {
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
}

export function WindowLab({ onGroupSelected, onUngroupSelected }: WindowLabProps) {
  return (
    <section data-testid="lab-window" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>Window Lab</h4>
      <button onClick={onGroupSelected}>分组当前窗口</button>
      <button onClick={onUngroupSelected}>取消分组</button>
    </section>
  );
}
