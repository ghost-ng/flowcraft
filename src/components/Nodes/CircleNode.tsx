// ---------------------------------------------------------------------------
// CircleNode.tsx -- Circle / oval node shape
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 80;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CircleNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  return (
    <BaseNode nodeProps={props} width={width} height={height}>
      <div
        className="w-full h-full shadow-sm"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px solid ${stroke}`,
          borderRadius: '50%',
          opacity,
        }}
      />
    </BaseNode>
  );
};

export default React.memo(CircleNode);
