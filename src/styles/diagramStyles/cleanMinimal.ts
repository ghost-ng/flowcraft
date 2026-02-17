import type { DiagramStyle } from '../types';

export const cleanMinimal: DiagramStyle = {
  id: 'cleanMinimal',
  displayName: 'Clean Minimal',
  canvas: {
    background: '#ffffff',
    gridColor: '#e5e7eb',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: '#ffffff',
    stroke: '#d1d5db',
    strokeWidth: 1,
    borderRadius: 8,
    shadow: 'none',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontSize: 14,
    fontColor: '#1f2937',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#9ca3af',
    strokeWidth: 1,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
};
