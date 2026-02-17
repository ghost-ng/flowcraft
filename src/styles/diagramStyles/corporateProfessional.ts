import type { DiagramStyle } from '../types';

export const corporateProfessional: DiagramStyle = {
  id: 'corporateProfessional',
  displayName: 'Corporate Professional',
  canvas: {
    background: '#f8fafc',
    gridColor: '#e2e8f0',
    gridStyle: 'lines',
  },
  nodeDefaults: {
    fill: '#ffffff',
    stroke: '#334155',
    strokeWidth: 1.5,
    borderRadius: 4,
    shadow: '0 1px 3px rgba(15, 23, 42, 0.12), 0 1px 2px rgba(15, 23, 42, 0.06)',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 14,
    fontColor: '#0f172a',
    fontWeight: 500,
  },
  edgeDefaults: {
    stroke: '#475569',
    strokeWidth: 1.5,
    type: 'smoothstep',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#1e3a5f', '#475569', '#0369a1', '#64748b', '#0c4a6e'],
};
