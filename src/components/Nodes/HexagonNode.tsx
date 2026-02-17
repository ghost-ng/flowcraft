// ---------------------------------------------------------------------------
// HexagonNode.tsx -- Six-sided polygon node
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 64;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

/** How far the left/right points indent (px). */
const INDENT = 18;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HexagonNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  // Flat-top hexagon: left point, top-left, top-right, right point, bottom-right, bottom-left
  const points = [
    `0,${height / 2}`,                    // left point
    `${INDENT},0`,                         // top-left
    `${width - INDENT},0`,                 // top-right
    `${width},${height / 2}`,              // right point
    `${width - INDENT},${height}`,          // bottom-right
    `${INDENT},${height}`,                 // bottom-left
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

export default React.memo(HexagonNode);
