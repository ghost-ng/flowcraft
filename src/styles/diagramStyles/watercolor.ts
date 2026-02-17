import type { DiagramStyle } from '../types';

export const watercolor: DiagramStyle = {
  id: 'watercolor',
  displayName: 'Watercolor',
  canvas: {
    background: '#f5f0eb',
    gridColor: '#e8e0d8',
    gridStyle: 'none',
  },
  nodeDefaults: {
    fill: '#d4c5b0',
    stroke: '#b8a692',
    strokeWidth: 1,
    borderRadius: 12,
    shadow: '0 3px 10px rgba(140, 120, 100, 0.15)',
    fontFamily: "'Lora', 'Playfair Display', Georgia, serif",
    fontSize: 14,
    fontColor: '#4a3f35',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#a89580',
    strokeWidth: 1.5,
    type: 'default',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#8fae8b', '#c4926e', '#7d9bb5', '#c9a0a0', '#b5a88f'],
};
