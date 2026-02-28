import type { DiagramStyle } from '../types';

export const softGradient: DiagramStyle = {
  id: 'softGradient',
  displayName: 'Soft Gradient',
  canvas: {
    background: 'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #e0f2fe 100%)',
    gridColor: 'rgba(0, 0, 0, 0.04)',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: 'rgba(255, 255, 255, 0.85)',
    stroke: 'rgba(0, 0, 0, 0.08)',
    strokeWidth: 1,
    borderRadius: 14,
    shadow: '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    fontSize: 14,
    fontColor: '#374151',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#a78bfa',
    strokeWidth: 1.5,
    type: 'bezier',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#a78bfa', '#f472b6', '#38bdf8', '#34d399', '#fb923c'],
};
