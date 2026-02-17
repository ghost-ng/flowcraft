import type { DiagramStyle } from '../types';

export const neonDark: DiagramStyle = {
  id: 'neonDark',
  displayName: 'Neon Dark',
  dark: true,
  canvas: {
    background: '#1a1a2e',
    gridColor: '#2a2a4a',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: '#16213e',
    stroke: '#00fff5',
    strokeWidth: 1.5,
    borderRadius: 8,
    shadow: '0 0 12px rgba(0, 255, 245, 0.3), 0 0 4px rgba(0, 255, 245, 0.15)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    fontColor: '#e0e0ff',
    fontWeight: 400,
  },
  edgeDefaults: {
    stroke: '#ff00aa',
    strokeWidth: 2,
    type: 'smoothstep',
    animated: true,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#00fff5', '#ff00aa', '#7b2ff7', '#39ff14', '#ffea00'],
};
