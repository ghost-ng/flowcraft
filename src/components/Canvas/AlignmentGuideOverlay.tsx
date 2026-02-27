// ---------------------------------------------------------------------------
// AlignmentGuideOverlay — renders subdued dashed alignment lines on the canvas
// during node drag to visualize edge/center snapping with other nodes.
// ---------------------------------------------------------------------------

import { useViewport } from '@xyflow/react';

export interface AlignmentGuideOverlayProps {
  guides: {
    vertical: number[];   // x-positions in flow coordinates
    horizontal: number[]; // y-positions in flow coordinates
  };
}

const AlignmentGuideOverlay: React.FC<AlignmentGuideOverlayProps> = ({ guides }) => {
  const { x: vx, y: vy, zoom } = useViewport();

  if (guides.vertical.length === 0 && guides.horizontal.length === 0) return null;

  // Convert flow-space coordinates to screen-space
  const toScreenX = (flowX: number) => flowX * zoom + vx;
  const toScreenY = (flowY: number) => flowY * zoom + vy;

  // Use a large range to span the visible viewport
  const EXTENT = 10000;

  return (
    <svg
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        zIndex: 1000,
      }}
    >
      {guides.vertical.map((flowX, i) => {
        const sx = toScreenX(flowX);
        return (
          <line
            key={`v-${i}`}
            x1={sx}
            y1={-EXTENT}
            x2={sx}
            y2={EXTENT}
            stroke="#6366f1"
            strokeWidth={0.75}
            strokeDasharray="6 4"
            opacity={0.45}
          />
        );
      })}
      {guides.horizontal.map((flowY, i) => {
        const sy = toScreenY(flowY);
        return (
          <line
            key={`h-${i}`}
            x1={-EXTENT}
            y1={sy}
            x2={EXTENT}
            y2={sy}
            stroke="#6366f1"
            strokeWidth={0.75}
            strokeDasharray="6 4"
            opacity={0.45}
          />
        );
      })}
    </svg>
  );
};

export default AlignmentGuideOverlay;
