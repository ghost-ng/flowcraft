import type { DiagramStyle } from '../types';

export const glassMorphism: DiagramStyle = {
  id: 'glassMorphism',
  displayName: 'Glass Morphism',
  dark: true,
  canvas: {
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b4e 50%, #1a2a4e 100%)',
    gridColor: 'rgba(255, 255, 255, 0.06)',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: 'rgba(255, 255, 255, 0.18)',
    stroke: 'rgba(255, 255, 255, 0.35)',
    strokeWidth: 1,
    borderRadius: 16,
    shadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
    fontFamily: "'Inter', 'SF Pro Display', sans-serif",
    fontSize: 14,
    fontColor: '#ffffff',
    fontWeight: 600,
  },
  edgeDefaults: {
    stroke: 'rgba(255, 255, 255, 0.5)',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#7c3aed', '#0ea5e9', '#db2777', '#059669', '#d97706'],
};
