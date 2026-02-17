// ---------------------------------------------------------------------------
// DependencyEdge.tsx -- Dependency-typed edge with semantic styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import type { FlowEdgeData, DependencyType } from '../../types/edges';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Dependency style configuration
// ---------------------------------------------------------------------------

interface DependencyStyle {
  stroke: string;
  strokeDasharray?: string;
  opacity: number;
  markerEnd: string;
}

const DEPENDENCY_STYLES: Record<DependencyType, DependencyStyle> = {
  'depends-on': {
    stroke: '#94a3b8',
    opacity: 1,
    markerEnd: 'url(#flowcraft-filledTriangle)',
  },
  blocks: {
    stroke: '#e53e3e',
    opacity: 1,
    markerEnd: 'url(#flowcraft-filledTriangle)',
  },
  related: {
    stroke: '#a0aec0',
    strokeDasharray: '6 4',
    opacity: 0.8,
    markerEnd: '',
  },
  triggers: {
    stroke: '#6366f1',
    opacity: 1,
    markerEnd: 'url(#flowcraft-filledTriangle)',
  },
  optional: {
    stroke: '#94a3b8',
    strokeDasharray: '3 3',
    opacity: 0.6,
    markerEnd: 'url(#flowcraft-openTriangle)',
  },
  'milestone-gate': {
    stroke: '#d69e2e',
    opacity: 1,
    markerEnd: 'url(#flowcraft-filledDiamond)',
  },
  none: {
    stroke: '#94a3b8',
    opacity: 1,
    markerEnd: '',
  },
};

// ---------------------------------------------------------------------------
// Pill badge label text per dependency type
// ---------------------------------------------------------------------------

const DEPENDENCY_LABELS: Record<DependencyType, string> = {
  'depends-on': 'depends on',
  blocks: 'blocks',
  related: 'related',
  triggers: 'triggers',
  optional: 'optional',
  'milestone-gate': 'gate',
  none: '',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERACTION_PATH_WIDTH = 20;
const DEFAULT_STROKE_WIDTH = 2;

// ---------------------------------------------------------------------------
// Lightning bolt icon for "triggers" type
// ---------------------------------------------------------------------------

const LightningBoltIcon: React.FC<{ x: number; y: number; color: string }> = ({
  x,
  y,
  color,
}) => (
  <g transform={`translate(${x - 6}, ${y - 8})`}>
    <polygon
      points="7,0 3,7 6,7 5,14 11,5 7,5 9,0"
      fill={color}
      stroke="white"
      strokeWidth={0.5}
      strokeLinejoin="round"
    />
  </g>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DependencyEdge: React.FC<EdgeProps> = ({
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
  markerEnd: markerEndProp,
  markerStart,
}) => {
  const selectionColor = useUIStore((s) => s.selectionColor);
  const edgeData = data as FlowEdgeData | undefined;
  const overrides = edgeData?.styleOverrides;
  const depType: DependencyType = edgeData?.dependencyType ?? 'depends-on';
  const depStyle = DEPENDENCY_STYLES[depType];

  // Resolve visual properties -- per-edge overrides beat dependency defaults
  const strokeColor = overrides?.stroke ?? depStyle.stroke;
  const strokeWidth = overrides?.strokeWidth ?? (style?.strokeWidth as number) ?? DEFAULT_STROKE_WIDTH;
  const rawData = edgeData as Record<string, unknown> | undefined;
  const strokeDasharray = (rawData?.strokeDasharray as string) ?? overrides?.strokeDasharray ?? depStyle.strokeDasharray;
  const opacity = overrides?.opacity ?? depStyle.opacity;
  const markerEnd = markerEndProp || depStyle.markerEnd;
  const label = edgeData?.label;
  const showLabel = label !== undefined && label !== '';

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

      {/* Lightning bolt icon at midpoint for "triggers" type */}
      {depType === 'triggers' && (
        <LightningBoltIcon x={labelX} y={labelY - 14} color={strokeColor} />
      )}

      {/* Dependency type pill badge + optional label */}
      <EdgeLabelRenderer>
        {/* Dependency type pill badge */}
        {DEPENDENCY_LABELS[depType] && (
          <div
            className="absolute pointer-events-none rounded-full px-2 py-px text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap border"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (showLabel ? -12 : 0)}px)`,
              color: strokeColor,
              backgroundColor: `${strokeColor}14`,
              borderColor: `${strokeColor}40`,
            }}
          >
            {DEPENDENCY_LABELS[depType]}
          </div>
        )}

        {/* Custom label text */}
        {showLabel && (
          <div
            className="absolute pointer-events-auto cursor-pointer rounded px-2 py-0.5 text-xs font-medium shadow-sm border"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (DEPENDENCY_LABELS[depType] ? 8 : 0)}px)`,
              color: (edgeData as Record<string, unknown>)?.labelColor as string ?? overrides?.labelFontColor ?? '#475569',
              backgroundColor: overrides?.labelBgColor ?? '#ffffff',
              borderColor: strokeColor,
              fontSize: overrides?.labelFontSize ?? 11,
            }}
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default React.memo(DependencyEdge);
