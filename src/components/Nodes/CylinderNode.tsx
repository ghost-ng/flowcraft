// ---------------------------------------------------------------------------
// CylinderNode.tsx -- Database cylinder shape
// ---------------------------------------------------------------------------

import React from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode, { type BaseNodeData } from './BaseNode';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 100;
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#cbd5e1';
const DEFAULT_STROKE_WIDTH = 1;

/** Height of the elliptical cap (half the full ellipse). */
const ELLIPSE_RY = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CylinderNode: React.FC<NodeProps> = (props) => {
  const data = props.data as BaseNodeData;
  const so = data.styleOverrides;

  const width = (data.width as number) ?? DEFAULT_WIDTH;
  const height = (data.height as number) ?? DEFAULT_HEIGHT;
  const fill = so?.fill ?? (data.color as string) ?? DEFAULT_FILL;
  const stroke = so?.stroke ?? (data.borderColor as string) ?? DEFAULT_STROKE;
  const strokeWidth = so?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const opacity = so?.opacity ?? 1;

  const rx = width / 2;
  const ry = ELLIPSE_RY;
  const bodyTop = ry;
  const bodyBottom = height - ry;

  // SVG path: top ellipse -> right side -> bottom ellipse -> left side (closed)
  // Then draw the visible top ellipse again on top so it looks like a cap.
  const bodyPath = [
    // Start at top-left of the body
    `M 0,${bodyTop}`,
    // Top ellipse (hidden behind the cap, but fills correctly)
    `A ${rx},${ry} 0 0,1 ${width},${bodyTop}`,
    // Right side down
    `L ${width},${bodyBottom}`,
    // Bottom ellipse
    `A ${rx},${ry} 0 0,1 0,${bodyBottom}`,
    // Left side up
    `Z`,
  ].join(' ');

  const topEllipsePath = [
    `M 0,${bodyTop}`,
    `A ${rx},${ry} 0 0,0 ${width},${bodyTop}`,
    `A ${rx},${ry} 0 0,0 0,${bodyTop}`,
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
        {/* Body + bottom ellipse */}
        <path
          d={bodyPath}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Top ellipse cap */}
        <path
          d={topEllipsePath}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    </BaseNode>
  );
};

export default React.memo(CylinderNode);
