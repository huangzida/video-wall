import React from 'react';

interface ApiLabProps {
  onDispatchSampleAction: () => void;
}

export function ApiLab({ onDispatchSampleAction }: ApiLabProps) {
  return (
    <section data-testid="lab-api" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>API Lab</h4>
      <button onClick={onDispatchSampleAction}>Dispatch Sample Action</button>
    </section>
  );
}
