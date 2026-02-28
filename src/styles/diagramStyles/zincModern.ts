import type { DiagramStyle } from '../types';

export const zincModern: DiagramStyle = {
  id: 'zincModern',
  displayName: 'Zinc Modern',
  canvas: {
    background: '#f4f4f5',
    gridColor: '#e4e4e7',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#ffffff',
    stroke: '#a1a1aa',
    strokeWidth: 1,
    borderRadius: 8,
    shadow: 'none',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    fontSize: 13,
    fontColor: '#27272a',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#a1a1aa',
    strokeWidth: 1,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#3f3f46', '#71717a', '#0ea5e9', '#8b5cf6', '#f59e0b'],
};
