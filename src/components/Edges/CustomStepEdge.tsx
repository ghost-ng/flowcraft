// ---------------------------------------------------------------------------
// CustomStepEdge.tsx -- Right-angle step edge with custom styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useEdgeVisuals } from './useEdgeVisuals';

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
  style: _style,
  selected,
  markerEnd: markerEndProp,
  markerStart: markerStartProp,
}) => {
  void _style; // read from store via useEdgeVisuals instead (bypasses React Flow memo)
  const ev = useEdgeVisuals(id);
  const selectionColor = useUIStore((s) => s.selectionColor);
  const strokeColor = ev.color ?? ev.overrideStroke ?? ev.styleStroke ?? DEFAULT_STROKE;
  const strokeWidth = ev.thickness ?? ev.overrideStrokeWidth ?? ev.styleStrokeWidth ?? DEFAULT_STROKE_WIDTH;
  const strokeDasharray = ev.strokeDasharray ?? ev.overrideDash ?? ev.styleDash ?? undefined;
  const opacity = ev.opacity ?? ev.overrideOpacity ?? ev.styleOpacity ?? 1;
  const isAnimated = ev.animated;
  const label = ev.label;
  const markerEnd = ev.markerEnd ?? markerEndProp;
  const markerStart = ev.markerStart ?? markerStartProp;

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

      {/* Label (position adjustable via labelPosition: 0=source, 0.5=center, 1=target) */}
      {label && (() => {
        const t = ev.labelPosition ?? 0.5;
        let lx = labelX, ly = labelY;
        if (t !== 0.5) {
          if (t < 0.5) { const s = t * 2; lx = sourceX + s * (labelX - sourceX); ly = sourceY + s * (labelY - sourceY); }
          else { const s = (t - 0.5) * 2; lx = labelX + s * (targetX - labelX); ly = labelY + s * (targetY - labelY); }
        }
        return (
          <EdgeLabelRenderer>
            <div
              className="absolute pointer-events-auto cursor-pointer rounded px-2 py-0.5 text-xs font-medium shadow-sm border"
              style={{
                transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
                color: ev.labelColor ?? ev.overrideLabelFontColor ?? '#475569',
                backgroundColor: ev.overrideLabelBgColor ?? '#ffffff',
                borderColor: strokeColor,
                fontSize: ev.overrideLabelFontSize ?? 11,
              }}
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        );
      })()}
    </>
  );
};

export default React.memo(CustomStepEdge);
