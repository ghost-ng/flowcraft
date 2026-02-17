import type { DiagramStyle } from '../types';

export const flatMaterial: DiagramStyle = {
  id: 'flatMaterial',
  displayName: 'Flat Material',
  canvas: {
    background: '#fafafa',
    gridColor: '#eeeeee',
    gridStyle: 'none',
  },
  nodeDefaults: {
    fill: '#1565c0',
    stroke: 'transparent',
    strokeWidth: 0,
    borderRadius: 4,
    shadow: '0 2px 4px rgba(0, 0, 0, 0.14), 0 3px 4px rgba(0, 0, 0, 0.12), 0 1px 5px rgba(0, 0, 0, 0.2)',
    fontFamily: "'Roboto', 'Noto Sans', sans-serif",
    fontSize: 14,
    fontColor: '#ffffff',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#757575',
    strokeWidth: 2,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#1565c0', '#2e7d32', '#ef6c00', '#c62828', '#6a1b9a'],
};
