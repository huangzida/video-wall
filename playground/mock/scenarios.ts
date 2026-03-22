export interface PlaygroundScenario {
  id: string;
  name: string;
  description: string;
}

export const SCENARIOS: PlaygroundScenario[] = [
  { id: 'stress-100', name: 'Stress 100 Windows', description: 'Creates many windows for stress checks.' },
  { id: 'focus-side', name: 'Focus + Side', description: 'Simulates one main and multiple side windows.' },
  { id: 'conflict-recovery', name: 'Conflict Recovery', description: 'Exercises conflict strategies and fallback.' },
  { id: 'undo-redo-torture', name: 'Undo/Redo Torture', description: 'Applies long action chains then rollback/redo.' },
];
