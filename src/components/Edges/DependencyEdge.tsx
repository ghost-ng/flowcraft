// ---------------------------------------------------------------------------
// DependencyEdge.tsx -- Dependency-typed edge with semantic styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import type { DependencyType } from '../../types/edges';
import { useUIStore } from '../../store/uiStore';
import { useEdgeVisuals } from './useEdgeVisuals';

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
  style: _style,
  selected,
  markerEnd: markerEndProp,
  markerStart: markerStartProp,
}) => {
  void _style; // read from store via useEdgeVisuals instead (bypasses React Flow memo)
  const ev = useEdgeVisuals(id);
  const selectionColor = useUIStore((s) => s.selectionColor);
  const selectionThickness = useUIStore((s) => s.selectionThickness);

  const depType: DependencyType = (ev.dependencyType as DependencyType) ?? 'depends-on';
  const depStyle = DEPENDENCY_STYLES[depType];
  const strokeColor = ev.color ?? ev.overrideStroke ?? ev.styleStroke ?? depStyle.stroke;
  const strokeWidth = ev.thickness ?? ev.overrideStrokeWidth ?? ev.styleStrokeWidth ?? DEFAULT_STROKE_WIDTH;
  const strokeDasharray = ev.strokeDasharray ?? ev.overrideDash ?? ev.styleDash ?? depStyle.strokeDasharray;
  const opacity = ev.opacity ?? ev.overrideOpacity ?? ev.styleOpacity ?? depStyle.opacity;
  const markerEnd = ev.markerEnd ?? markerEndProp ?? depStyle.markerEnd;
  const markerStart = ev.markerStart ?? markerStartProp;
  const label = ev.label;
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
          strokeWidth={strokeWidth + selectionThickness + 1}
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

      {/* Dependency type pill badge + optional label (position adjustable via labelPosition) */}
      {(() => {
        const t = ev.labelPosition ?? 0.5;
        let lx = labelX, ly = labelY;
        if (t !== 0.5) {
          if (t < 0.5) { const s = t * 2; lx = sourceX + s * (labelX - sourceX); ly = sourceY + s * (labelY - sourceY); }
          else { const s = (t - 0.5) * 2; lx = labelX + s * (targetX - labelX); ly = labelY + s * (targetY - labelY); }
        }
        return (
          <EdgeLabelRenderer>
            {/* Dependency type pill badge */}
            {DEPENDENCY_LABELS[depType] && (
              <div
                className="absolute pointer-events-none rounded-full px-2 py-px text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap border"
                style={{
                  transform: `translate(-50%, -50%) translate(${lx}px, ${ly + (showLabel ? -12 : 0)}px)`,
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
                  transform: `translate(-50%, -50%) translate(${lx}px, ${ly + (DEPENDENCY_LABELS[depType] ? 8 : 0)}px)`,
                  color: ev.labelColor ?? ev.overrideLabelFontColor ?? '#475569',
                  backgroundColor: ev.overrideLabelBgColor ?? '#ffffff',
                  borderColor: strokeColor,
                  fontSize: ev.overrideLabelFontSize ?? 11,
                }}
              >
                {label}
              </div>
            )}
          </EdgeLabelRenderer>
        );
      })()}
    </>
  );
};

export default React.memo(DependencyEdge);
