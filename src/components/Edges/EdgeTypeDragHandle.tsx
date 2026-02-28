// ---------------------------------------------------------------------------
// EdgeTypeDragHandle.tsx -- Small diamond indicator at edge midpoint
//
// Always visible so the user knows where to click-and-drag to cycle the
// connector type. Renders a rotated square (diamond) that brightens on hover.
// The mouseDown event is forwarded to the useEdgeTypeDrag handler.
// ---------------------------------------------------------------------------

import React, { useCallback, useState } from 'react';

interface EdgeTypeDragHandleProps {
  /** Center X of the handle (typically labelX from the path helper) */
  cx: number;
  /** Center Y of the handle */
  cy: number;
  /** Edge stroke color -- handle tints to match */
  color: string;
  /** onMouseDown handler from useEdgeTypeDrag */
  onMouseDown: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 6;

const EdgeTypeDragHandle: React.FC<EdgeTypeDragHandleProps> = ({
  cx,
  cy,
  color,
  onMouseDown,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <rect
      x={cx - HANDLE_SIZE / 2}
      y={cy - HANDLE_SIZE / 2}
      width={HANDLE_SIZE}
      height={HANDLE_SIZE}
      rx={1}
      transform={`rotate(45 ${cx} ${cy})`}
      style={{
        fill: color,
        stroke: color,
        strokeWidth: 1,
        opacity: hovered ? 0.8 : 0.35,
        cursor: 'grab',
        transition: 'opacity 0.15s',
        pointerEvents: 'all',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default React.memo(EdgeTypeDragHandle);
