import type { DiagramStyle } from '../types';

export const wireframe: DiagramStyle = {
  id: 'wireframe',
  displayName: 'Wireframe',
  canvas: {
    background: '#ffffff',
    gridColor: '#e5e5e5',
    gridStyle: 'cross',
  },
  nodeDefaults: {
    fill: 'transparent',
    stroke: '#888888',
    strokeWidth: 1.5,
    borderRadius: 4,
    shadow: 'none',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    fontColor: '#555555',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#aaaaaa',
    strokeWidth: 1,
    type: 'straight',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#555555', '#777777', '#999999', '#bbbbbb', '#dddddd'],
};
