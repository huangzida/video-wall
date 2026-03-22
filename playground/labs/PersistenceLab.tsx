import React from 'react';
import type { PlaygroundScenario } from '../mock/scenarios';

interface PersistenceLabProps {
  scenarios: PlaygroundScenario[];
  onLoadScenario: (id: string) => void;
  onReset: () => void;
}

export function PersistenceLab({ scenarios, onLoadScenario, onReset }: PersistenceLabProps) {
  return (
    <section data-testid="lab-persistence" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 12 }}>Persistence Lab</h4>
      <button onClick={onReset}>Reset</button>
      {scenarios.map(item => (
        <button key={item.id} onClick={() => onLoadScenario(item.id)}>{item.name}</button>
      ))}
    </section>
  );
}
