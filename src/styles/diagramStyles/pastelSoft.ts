import type { DiagramStyle } from '../types';

export const pastelSoft: DiagramStyle = {
  id: 'pastelSoft',
  displayName: 'Pastel Soft',
  canvas: {
    background: '#fefcfb',
    gridColor: '#f0e6e0',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: '#e8dff5',
    stroke: '#c9b8e8',
    strokeWidth: 1.5,
    borderRadius: 16,
    shadow: '0 2px 8px rgba(180, 160, 210, 0.2)',
    fontFamily: "'Nunito', 'Quicksand', 'Segoe UI', sans-serif",
    fontSize: 14,
    fontColor: '#4a3f6b',
    fontWeight: 600,
  },
  edgeDefaults: {
    stroke: '#c9b8e8',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#c3aed6', '#a8d8b9', '#f6c6a8', '#f7a8b8', '#a8d4f0'],
};
