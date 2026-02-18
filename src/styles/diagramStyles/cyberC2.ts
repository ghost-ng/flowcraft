import type { DiagramStyle } from '../types';

export const cyberC2: DiagramStyle = {
  id: 'cyberC2',
  displayName: 'Slate Command',
  dark: false,
  canvas: {
    background: '#f0f4f8',
    gridColor: '#d0d8e0',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#FFFFF0',
    stroke: '#000000',
    strokeWidth: 1.5,
    borderRadius: 6,
    shadow: '0 1px 3px rgba(0,0,0,0.15)',
    fontFamily: "'Arial', 'Helvetica Neue', Helvetica, sans-serif",
    fontSize: 12,
    fontColor: '#000000',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#000000',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#5B7A9A', '#829AB5', '#A9BBD2', '#D9D9D9', '#FFFFF0'],
};
