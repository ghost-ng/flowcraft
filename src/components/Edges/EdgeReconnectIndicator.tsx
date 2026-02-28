// ---------------------------------------------------------------------------
// EdgeReconnectIndicator.tsx -- Small triangle at edge endpoints
//
// Renders a visible triangle near the source or target point of a connector
// to indicate that the user can click-and-drag to reconnect the edge.
// Only rendered when the edge is selected.
// ---------------------------------------------------------------------------

import React, { useCallback, useState } from 'react';
import { Position } from '@xyflow/react';
import { CURSOR_CROSSHAIR } from './cursorUrls';

interface EdgeReconnectIndicatorProps {
  /** Center X of the endpoint */
  cx: number;
  /** Center Y of the endpoint */
  cy: number;
  /** Which side of the node this endpoint is on */
  position: Position;
  /** Edge stroke color */
  color: string;
}

const TRI_SIZE = 5;

/**
 * Compute triangle points for a given position (side of node).
 * The triangle points TOWARD the node (away from the edge body)
 * so it visually indicates "drag from here."
 */
function getTrianglePoints(cx: number, cy: number, position: Position): string {
  const s = TRI_SIZE;
  switch (position) {
    case Position.Top:
      // Triangle points up (toward node above)
      return `${cx},${cy - s} ${cx - s},${cy + s * 0.5} ${cx + s},${cy + s * 0.5}`;
    case Position.Bottom:
      // Triangle points down (toward node below)
      return `${cx},${cy + s} ${cx - s},${cy - s * 0.5} ${cx + s},${cy - s * 0.5}`;
    case Position.Left:
      // Triangle points left (toward node on left)
      return `${cx - s},${cy} ${cx + s * 0.5},${cy - s} ${cx + s * 0.5},${cy + s}`;
    case Position.Right:
      // Triangle points right (toward node on right)
      return `${cx + s},${cy} ${cx - s * 0.5},${cy - s} ${cx - s * 0.5},${cy + s}`;
    default:
      return `${cx},${cy - s} ${cx - s},${cy + s * 0.5} ${cx + s},${cy + s * 0.5}`;
  }
}

const EdgeReconnectIndicator: React.FC<EdgeReconnectIndicatorProps> = ({
  cx,
  cy,
  position,
  color,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const points = getTrianglePoints(cx, cy, position);

  return (
    <polygon
      points={points}
      style={{
        fill: color,
        stroke: color,
        strokeWidth: 0.5,
        strokeLinejoin: 'round',
        opacity: hovered ? 0.9 : 0.5,
        cursor: CURSOR_CROSSHAIR,
        transition: 'opacity 0.15s',
        pointerEvents: 'all',
      }}
      className="react-flow__edgeupdater"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default React.memo(EdgeReconnectIndicator);
