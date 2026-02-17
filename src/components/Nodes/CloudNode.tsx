// ---------------------------------------------------------------------------
// CloudNode.tsx -- Cloud shape using SVG path with bubble curves
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 80;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CloudNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  // Cloud path built from a series of arcs, scaled to width/height.
  // The cloud is drawn in a normalized 160x80 viewBox and SVG scales it.
  const d = [
    'M 25,60',
    'C 5,60 0,45 10,35',
    'C 0,20 15,5 30,10',
    'C 40,-5 60,-5 70,5',
    'C 80,-2 100,-2 110,10',
    'C 125,0 150,10 150,25',
    'C 165,30 160,50 145,55',
    'C 150,65 135,75 120,68',
    'C 110,80 85,80 75,70',
    'C 60,80 40,78 35,68',
    'C 25,72 10,68 25,60',
    'Z',
  ].join(' ');

  return (
    <BaseNode nodeProps={props} width={width} height={height}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 80"
        preserveAspectRatio="none"
        className="absolute inset-0"
        style={{ opacity, filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))' }}
      >
        <path
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    </BaseNode>
  );
};

export default React.memo(CloudNode);
