import React from 'react';
import { labButtonStyle, labSectionStyle, labTitleStyle } from './styles';

interface ApiLabProps {
  onDispatchSampleAction: () => void;
}

export function ApiLab({ onDispatchSampleAction }: ApiLabProps) {
  return (
    <section data-testid="lab-api" style={labSectionStyle}>
      <h4 style={labTitleStyle}>API Lab</h4>
      <button style={labButtonStyle} onClick={onDispatchSampleAction}>Dispatch Sample Action</button>
    </section>
  );
}
