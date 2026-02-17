import type { DiagramStyle } from '../types';

export const retroTerminal: DiagramStyle = {
  id: 'retroTerminal',
  displayName: 'Retro Terminal',
  dark: true,
  canvas: {
    background: '#0a0a0a',
    gridColor: '#1a1a1a',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#0a0a0a',
    stroke: '#33ff33',
    strokeWidth: 1,
    borderRadius: 0,
    shadow: '0 0 6px rgba(51, 255, 51, 0.25)',
    fontFamily: "'VT323', 'Fira Code', 'Consolas', monospace",
    fontSize: 15,
    fontColor: '#33ff33',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#33ff33',
    strokeWidth: 1,
    type: 'step',
    animated: true,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#33ff33', '#ffb833', '#33ffff', '#ff3333', '#ffffff'],
};
