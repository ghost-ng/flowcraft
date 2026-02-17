import type { DiagramStyle } from '../types';

export const darkNeonGlow: DiagramStyle = {
  id: 'darkNeonGlow',
  displayName: 'Dark Neon Glow',
  dark: true,
  canvas: {
    background: '#0d1117',
    gridColor: '#161b22',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#161b22',
    stroke: '#ff2d95',
    strokeWidth: 2,
    borderRadius: 8,
    shadow: '0 0 16px rgba(255, 45, 149, 0.4), 0 0 6px rgba(255, 45, 149, 0.2)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    fontColor: '#00ffff',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#39ff14',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: true,
    arrowType: 'arrowclosed',
  },
  accentColors: [
    '#ff2d95',
    '#00ffff',
    '#39ff14',
    '#ffea00',
    '#bf5af2',
    '#ff6b35',
  ],
};
