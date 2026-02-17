import type { DiagramStyle } from '../types';

export const monochromeInk: DiagramStyle = {
  id: 'monochromeInk',
  displayName: 'Monochrome Ink',
  canvas: {
    background: '#ffffff',
    gridColor: '#f0f0f0',
    gridStyle: 'none',
  },
  nodeDefaults: {
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2.5,
    borderRadius: 0,
    shadow: 'none',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: 13,
    fontColor: '#000000',
    fontWeight: 600,
  },
  edgeDefaults: {
    stroke: '#000000',
    strokeWidth: 2,
    type: 'straight',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#000000', '#333333', '#555555', '#777777', '#999999'],
};
