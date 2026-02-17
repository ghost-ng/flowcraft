// ---------------------------------------------------------------------------
// DocumentNode.tsx -- Rectangle with wavy bottom edge
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 64;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

/** Amplitude of the wave at the bottom edge. */
const WAVE_HEIGHT = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DocumentNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  const waveY = height - WAVE_HEIGHT;

  // Path: top-left -> top-right -> right side down -> wavy bottom -> left side up
  const d = [
    `M 0,0`,
    `L ${width},0`,
    `L ${width},${waveY}`,
    // Wavy bottom: two cubic bezier curves creating an S-wave
    `C ${width * 0.75},${waveY + WAVE_HEIGHT * 2} ${width * 0.25},${waveY - WAVE_HEIGHT * 0.5} 0,${waveY + WAVE_HEIGHT * 0.5}`,
    `Z`,
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

export default React.memo(DocumentNode);
