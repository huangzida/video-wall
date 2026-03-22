import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

class MockResizeObserver {
  observe() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

describe('Playground Labs integration', () => {
  it('renders playground lab switcher and default interaction lab', () => {
    render(<App />);

    expect(screen.getByText('Playground Lab')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Interaction' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Persistence' })).toBeTruthy();
    expect(screen.getByTestId('lab-interaction')).toBeTruthy();
  });
});
