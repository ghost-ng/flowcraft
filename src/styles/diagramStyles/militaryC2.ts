import type { DiagramStyle } from '../types';

export const militaryC2: DiagramStyle = {
  id: 'militaryC2',
  displayName: 'Military C2',
  dark: true,
  canvas: {
    background: '#2b3023',
    gridColor: '#3d4435',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#3d4435',
    stroke: '#8b9a6b',
    strokeWidth: 2,
    borderRadius: 2,
    shadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
    fontFamily: "'Share Tech Mono', 'Consolas', 'Courier New', monospace",
    fontSize: 12,
    fontColor: '#c8d4a8',
    fontWeight: 700,
  },
  edgeDefaults: {
    stroke: '#8b9a6b',
    strokeWidth: 2,
    type: 'step',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#4a90d9', '#d94a4a', '#5cb85c', '#f0ad4e', '#c8d4a8'],
};
