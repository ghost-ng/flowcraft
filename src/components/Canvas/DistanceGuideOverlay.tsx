// ---------------------------------------------------------------------------
// DistanceGuideOverlay — renders edge-to-edge distance measurements between
// the dragged node and its closest neighbours during drag.
// ---------------------------------------------------------------------------

import { useViewport } from '@xyflow/react';
import type { DistanceGuides } from '../../utils/snapUtils';

export interface DistanceGuideOverlayProps {
  guides: DistanceGuides;
}

const NORMAL_COLOR = '#ec4899';  // pink
const EQUAL_COLOR = '#10b981';   // green
const CAP_SIZE = 3;              // half-length of end cap ticks

const DistanceGuideOverlay: React.FC<DistanceGuideOverlayProps> = ({ guides }) => {
  const { x: vx, y: vy, zoom } = useViewport();

  if (guides.gaps.length === 0) return null;

  const toScreenX = (flowX: number) => flowX * zoom + vx;
  const toScreenY = (flowY: number) => flowY * zoom + vy;

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
      {guides.gaps.map((gap, i) => {
        const color = gap.isEqual ? EQUAL_COLOR : NORMAL_COLOR;
        const dist = Math.round(gap.distance);

        if (gap.axis === 'horizontal') {
          // Horizontal gap: line runs left-to-right, crossPos is y
          const x1 = toScreenX(gap.lineStart);
          const x2 = toScreenX(gap.lineEnd);
          const y = toScreenY(gap.crossPos);
          const mx = (x1 + x2) / 2;
          const capLen = CAP_SIZE * zoom;

          return (
            <g key={`h-${i}`}>
              {/* Main measurement line */}
              <line
                x1={x1} y1={y} x2={x2} y2={y}
                stroke={color} strokeWidth={0.75} strokeDasharray="4 3" opacity={0.7}
              />
              {/* Left end cap */}
              <line
                x1={x1} y1={y - capLen} x2={x1} y2={y + capLen}
                stroke={color} strokeWidth={0.75} opacity={0.7}
              />
              {/* Right end cap */}
              <line
                x1={x2} y1={y - capLen} x2={x2} y2={y + capLen}
                stroke={color} strokeWidth={0.75} opacity={0.7}
              />
              {/* Distance label pill */}
              <rect
                x={mx - 14} y={y - 8}
                width={28} height={14}
                rx={4}
                fill={color} opacity={0.85}
              />
              <text
                x={mx} y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
                fill="white"
              >
                {dist}
              </text>
            </g>
          );
        } else {
          // Vertical gap: line runs top-to-bottom, crossPos is x
          const y1 = toScreenY(gap.lineStart);
          const y2 = toScreenY(gap.lineEnd);
          const x = toScreenX(gap.crossPos);
          const my = (y1 + y2) / 2;
          const capLen = CAP_SIZE * zoom;

          return (
            <g key={`v-${i}`}>
              {/* Main measurement line */}
              <line
                x1={x} y1={y1} x2={x} y2={y2}
                stroke={color} strokeWidth={0.75} strokeDasharray="4 3" opacity={0.7}
              />
              {/* Top end cap */}
              <line
                x1={x - capLen} y1={y1} x2={x + capLen} y2={y1}
                stroke={color} strokeWidth={0.75} opacity={0.7}
              />
              {/* Bottom end cap */}
              <line
                x1={x - capLen} y1={y2} x2={x + capLen} y2={y2}
                stroke={color} strokeWidth={0.75} opacity={0.7}
              />
              {/* Distance label pill */}
              <rect
                x={x - 14} y={my - 8}
                width={28} height={14}
                rx={4}
                fill={color} opacity={0.85}
              />
              <text
                x={x} y={my + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
                fill="white"
              >
                {dist}
              </text>
            </g>
          );
        }
      })}
    </svg>
  );
};

export default DistanceGuideOverlay;
