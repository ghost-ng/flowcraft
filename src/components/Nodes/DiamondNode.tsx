// ---------------------------------------------------------------------------
// DiamondNode.tsx -- Diamond / rhombus shape (decision node)
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 80;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DiamondNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  // Points for a diamond inscribed in the width x height box
  const points = [
    `${width / 2},${strokeWidth}`,
    `${width - strokeWidth},${height / 2}`,
    `${width / 2},${height - strokeWidth}`,
    `${strokeWidth},${height / 2}`,
  ].join(' ');

  return (
    <BaseNode nodeProps={props} width={width} height={height}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{ opacity, filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))' }}
      >
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    </BaseNode>
  );
};

export default React.memo(DiamondNode);
