import type { DiagramStyle } from '../types';

export const auroraBorealis: DiagramStyle = {
  id: 'auroraBorealis',
  displayName: 'Aurora Borealis',
  dark: true,
  canvas: {
    background: 'linear-gradient(160deg, #0a0a1a 0%, #0d1b3e 40%, #1a0a2e 100%)',
    gridColor: 'rgba(100, 200, 255, 0.05)',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: 'rgba(15, 23, 42, 0.75)',
    stroke: 'rgba(56, 189, 248, 0.5)',
    strokeWidth: 1,
    borderRadius: 12,
    shadow: '0 0 20px rgba(56, 189, 248, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    fontSize: 13,
    fontColor: '#e2e8f0',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#22d3ee',
    strokeWidth: 1.5,
    type: 'bezier',
    animated: true,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fbbf24'],
};
