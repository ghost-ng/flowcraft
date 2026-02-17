// ---------------------------------------------------------------------------
// CustomStepEdge.tsx -- Right-angle step edge with custom styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import type { FlowEdgeData } from '../../types/edges';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERACTION_PATH_WIDTH = 20;
const DEFAULT_STROKE = '#94a3b8';
const DEFAULT_STROKE_WIDTH = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CustomStepEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  selected,
  markerEnd,
  markerStart,
}) => {
  const selectionColor = useUIStore((s) => s.selectionColor);
  const edgeData = data as FlowEdgeData | undefined;
  const overrides = edgeData?.styleOverrides;

  // Resolve visual properties
  const strokeColor = overrides?.stroke ?? style?.stroke ?? DEFAULT_STROKE;
  const strokeWidth = overrides?.strokeWidth ?? (style?.strokeWidth as number) ?? DEFAULT_STROKE_WIDTH;
  const rawData = edgeData as Record<string, unknown> | undefined;
  const strokeDasharray = (rawData?.strokeDasharray as string) ?? overrides?.strokeDasharray ?? undefined;
  const opacity = overrides?.opacity ?? (typeof rawData?.opacity === 'number' ? rawData.opacity : 1);
  const isAnimated = edgeData?.animated ?? false;
  const label = edgeData?.label;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      {/* Invisible wider interaction path for easier clicking */}
      <path
        id={`${id}-interaction`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={INTERACTION_PATH_WIDTH}
        className="react-flow__edge-interaction"
      />

      {/* Visible edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        markerEnd={markerEnd}
        markerStart={markerStart}
        className={`react-flow__edge-path ${selected ? 'selected' : ''}`}
        style={
          isAnimated
            ? {
                strokeDasharray: strokeDasharray ?? '8 4',
                animation: 'flowcraft-edge-dash 0.6s linear infinite',
              }
            : undefined
        }
      />

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={selectionColor}
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* Label at midpoint */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto cursor-pointer rounded px-2 py-0.5 text-xs font-medium shadow-sm border"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: (edgeData as Record<string, unknown>)?.labelColor as string ?? overrides?.labelFontColor ?? '#475569',
              backgroundColor: overrides?.labelBgColor ?? '#ffffff',
              borderColor: strokeColor,
              fontSize: overrides?.labelFontSize ?? 11,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default React.memo(CustomStepEdge);
