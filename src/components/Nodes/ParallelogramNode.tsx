// ---------------------------------------------------------------------------
// ParallelogramNode.tsx -- Skewed rectangle (data / I-O shape)
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 48;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

/** How far the slant pushes in from each side (px). */
const SKEW_OFFSET = 20;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ParallelogramNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  const sw = strokeWidth;
  const points = [
    `${SKEW_OFFSET + sw},${sw}`,                          // top-left (inset)
    `${width - sw},${sw}`,                                 // top-right
    `${width - SKEW_OFFSET - sw},${height - sw}`,          // bottom-right (inset)
    `${sw},${height - sw}`,                                // bottom-left
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

export default React.memo(ParallelogramNode);
