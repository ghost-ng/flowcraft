// ---------------------------------------------------------------------------
// MarkerDefs.tsx -- SVG marker definitions for all arrowhead types
// ---------------------------------------------------------------------------
//
// Usage: Render <MarkerDefs /> inside the React Flow canvas so that edge
// paths can reference these markers via `markerEnd="url(#flowcraft-...)"`.
//
// React Flow provides a <Panel /> or you can place this in the SVG layer.
// The component renders an invisible 0x0 SVG that only contributes <defs>.
// ---------------------------------------------------------------------------

import React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarkerDefsProps {
  /** Override the default marker color. Falls back to context-stroke. */
  color?: string;
}

// ---------------------------------------------------------------------------
// Prefix used for all marker IDs to avoid collisions
// ---------------------------------------------------------------------------

const PREFIX = 'flowcraft';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MarkerDefs: React.FC<MarkerDefsProps> = ({ color }) => {
  // "context-stroke" makes the marker inherit the edge stroke color.
  // If an explicit color is provided, use that instead.
  const fill = color ?? 'context-stroke';
  const stroke = color ?? 'context-stroke';

  return (
    <svg
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        {/* ------------------------------------------------------------ */}
        {/* Filled Triangle -- solid filled triangle pointing right      */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-filledTriangle`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={8}
          markerHeight={8}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={fill} />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Open Triangle -- outline-only triangle                       */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-openTriangle`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={8}
          markerHeight={8}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 Z"
            fill="white"
            stroke={stroke}
            strokeWidth={1.5}
          />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Filled Diamond -- solid diamond shape                        */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-filledDiamond`}
          viewBox="0 0 12 12"
          refX={10}
          refY={6}
          markerWidth={10}
          markerHeight={10}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M 0 6 L 6 0 L 12 6 L 6 12 Z" fill={fill} />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Open Diamond -- outline diamond                              */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-openDiamond`}
          viewBox="0 0 12 12"
          refX={10}
          refY={6}
          markerWidth={10}
          markerHeight={10}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 6 L 6 0 L 12 6 L 6 12 Z"
            fill="white"
            stroke={stroke}
            strokeWidth={1.5}
          />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Filled Circle -- solid circle dot                            */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-filledCircle`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={8}
          markerHeight={8}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <circle cx={5} cy={5} r={4} fill={fill} />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Open Circle -- outline circle                                */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-openCircle`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={8}
          markerHeight={8}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <circle
            cx={5}
            cy={5}
            r={3.5}
            fill="white"
            stroke={stroke}
            strokeWidth={1.5}
          />
        </marker>

        {/* ------------------------------------------------------------ */}
        {/* Tee -- perpendicular flat bar                                */}
        {/* ------------------------------------------------------------ */}
        <marker
          id={`${PREFIX}-tee`}
          viewBox="0 0 6 10"
          refX={4}
          refY={5}
          markerWidth={6}
          markerHeight={10}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <line
            x1={3}
            y1={0}
            x2={3}
            y2={10}
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </marker>
      </defs>
    </svg>
  );
};

export default React.memo(MarkerDefs);
