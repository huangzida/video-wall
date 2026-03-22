import React from 'react';
import type { PlaygroundScenario } from '../mock/scenarios';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface PersistenceLabProps {
  scenarios: PlaygroundScenario[];
  onLoadScenario: (id: string) => void;
  onReset: () => void;
}

export function PersistenceLab({ scenarios, onLoadScenario, onReset }: PersistenceLabProps) {
  return (
    <section data-testid="lab-persistence" style={labSectionStyle}>
      <h4 style={labTitleStyle}>Persistence Lab</h4>
      <button style={labButtonStyle} onClick={onReset}>Reset</button>
      {scenarios.map(item => (
        <button style={labButtonStyle} key={item.id} onClick={() => onLoadScenario(item.id)}>{item.name}</button>
      ))}
    </section>
  );
}
