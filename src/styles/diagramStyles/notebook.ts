import type { DiagramStyle } from '../types';

export const notebook: DiagramStyle = {
  id: 'notebook',
  displayName: 'Handwritten Notebook',
  canvas: {
    background: '#faf8f5',
    gridColor: '#c8d6e0',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#ffffff',
    stroke: '#374151',
    strokeWidth: 1.5,
    borderRadius: 4,
    shadow: '1px 2px 0px rgba(0, 0, 0, 0.06)',
    fontFamily: "'Comic Sans MS', 'Caveat', cursive",
    fontSize: 15,
    fontColor: '#1f2937',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#4b5563',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: [
    '#2563eb',
    '#dc2626',
    '#16a34a',
    '#ea580c',
    '#7c3aed',
    '#0891b2',
  ],
};
