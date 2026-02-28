import type { DiagramStyle } from '../types';

export const paperPrint: DiagramStyle = {
  id: 'paperPrint',
  displayName: 'Paper Print',
  canvas: {
    background: '#faf8f5',
    gridColor: '#e8e2d9',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#fefdfb',
    stroke: '#c8bfb0',
    strokeWidth: 0.75,
    borderRadius: 2,
    shadow: 'none',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 13,
    fontColor: '#3b3228',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#9c9284',
    strokeWidth: 1,
    type: 'straight',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#8b4513', '#2e5e4e', '#5b3a6b', '#8c6d46', '#3d5a80'],
};
