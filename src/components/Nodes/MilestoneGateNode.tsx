// ---------------------------------------------------------------------------
// MilestoneGateNode.tsx -- Small diamond checkpoint node
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 60;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1.5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MilestoneGateNode: React.FC<NodeProps> = (props) => {
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
    `${width / 2},${sw}`,
    `${width - sw},${height / 2}`,
    `${width / 2},${height - sw}`,
    `${sw},${height / 2}`,
  ].join(' ');

  return (
    <BaseNode nodeProps={props} width={width} height={height}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{ opacity, filter: 'drop-shadow(0 1px 3px rgb(0 0 0 / 0.08))' }}
      >
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Small inner diamond accent */}
        <polygon
          points={[
            `${width / 2},${height * 0.3}`,
            `${width * 0.7},${height / 2}`,
            `${width / 2},${height * 0.7}`,
            `${width * 0.3},${height / 2}`,
          ].join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth * 0.5}
          strokeLinejoin="round"
          opacity={0.4}
        />
      </svg>
    </BaseNode>
  );
};

export default React.memo(MilestoneGateNode);
