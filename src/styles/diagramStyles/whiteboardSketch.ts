import type { DiagramStyle } from '../types';

export const whiteboardSketch: DiagramStyle = {
  id: 'whiteboardSketch',
  displayName: 'Whiteboard Sketch',
  canvas: {
    background: '#faf8f5',
    gridColor: '#e8e4de',
    gridStyle: 'dots',
  },
  nodeDefaults: {
    fill: '#fffdf7',
    stroke: '#5c5346',
    strokeWidth: 2,
    borderRadius: 6,
    shadow: 'none',
    fontFamily: "'Caveat', 'Patrick Hand', 'Comic Sans MS', cursive",
    fontSize: 18,
    fontColor: '#3d3529',
    fontWeight: 700,
  },
  edgeDefaults: {
    stroke: '#5c5346',
    strokeWidth: 2,
    type: 'default',
    animated: false,
    arrowType: 'arrowclosed',
  },
  accentColors: ['#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'],
};
