// ---------------------------------------------------------------------------
// StickyNoteNode.tsx -- Square with folded corner, yellow-ish default
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 140;
const DEFAULT_HEIGHT = 120;
const DEFAULT_FILL = '#fef9c3'; // yellow-100 ish
const DEFAULT_STROKE = '#eab308'; // yellow-500
const DEFAULT_STROKE_WIDTH = 1;

/** Size of the folded corner triangle. */
const FOLD_SIZE = 18;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StickyNoteNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  // Main body with a clipped top-right corner
  const bodyPath = [
    `M 0,0`,
    `L ${width - FOLD_SIZE},0`,
    `L ${width},${FOLD_SIZE}`,
    `L ${width},${height}`,
    `L 0,${height}`,
    `Z`,
  ].join(' ');

  // The folded corner triangle
  const foldPath = [
    `M ${width - FOLD_SIZE},0`,
    `L ${width - FOLD_SIZE},${FOLD_SIZE}`,
    `L ${width},${FOLD_SIZE}`,
    `Z`,
  ].join(' ');

  return (
    <BaseNode nodeProps={props} width={width} height={height}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{
          opacity,
          filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.08))',
          transform: 'rotate(-1deg)',
        }}
      >
        {/* Main sticky body */}
        <path
          d={bodyPath}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Folded corner (slightly darker) */}
        <path
          d={foldPath}
          fill={stroke}
          opacity={0.25}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    </BaseNode>
  );
};

export default React.memo(StickyNoteNode);
