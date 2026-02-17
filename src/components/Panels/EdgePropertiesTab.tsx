// ---------------------------------------------------------------------------
// EdgePropertiesTab.tsx -- Full edge properties editor panel
// ---------------------------------------------------------------------------

import React, { useCallback } from 'react';
import { useFlowStore, type FlowEdgeData } from '../../store/flowStore';

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Edge type options
// ---------------------------------------------------------------------------

const EDGE_TYPES = [
  { value: 'smoothstep', label: 'SmoothStep' },
  { value: 'bezier', label: 'Bezier' },
  { value: 'step', label: 'Step' },
  { value: 'straight', label: 'Straight' },
] as const;

const ARROWHEAD_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'open', label: 'Open Arrow' },
] as const;

const DEPENDENCY_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'depends-on', label: 'Depends On' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'related', label: 'Related' },
] as const;

const EDGE_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
] as const;

// ---------------------------------------------------------------------------
// Map arrowhead selector value to marker URL
// ---------------------------------------------------------------------------

const arrowheadToMarker = (type: string): string => {
  switch (type) {
    case 'arrow':
      return 'url(#flowcraft-filledTriangle)';
    case 'diamond':
      return 'url(#flowcraft-filledDiamond)';
    case 'circle':
      return 'url(#flowcraft-filledCircle)';
    case 'open':
      return 'url(#flowcraft-openTriangle)';
    default:
      return '';
  }
};

const markerToArrowhead = (marker?: string): string => {
  if (!marker) return 'none';
  if (marker.includes('filledTriangle')) return 'arrow';
  if (marker.includes('filledDiamond')) return 'diamond';
  if (marker.includes('filledCircle')) return 'circle';
  if (marker.includes('openTriangle')) return 'open';
  return 'none';
};

// ---------------------------------------------------------------------------
// Map edge style to strokeDasharray
// ---------------------------------------------------------------------------

const styleToStrokeDash = (style: string, spacing?: number): string | undefined => {
  switch (style) {
    case 'dashed': {
      const dashLen = spacing ?? 8;
      const gapLen = Math.max(2, Math.round(dashLen / 2));
      return `${dashLen} ${gapLen}`;
    }
    case 'dotted': {
      const dotLen = spacing ?? 2;
      const gapLen = Math.max(2, spacing ?? 4);
      return `${dotLen} ${gapLen}`;
    }
    default:
      return undefined;
  }
};

const strokeDashToStyle = (dash?: string): string => {
  if (!dash) return 'solid';
  const parts = dash.trim().split(/\s+/).map(Number);
  if (parts.length < 2) return 'solid';
  // Dotted: first segment <= 3
  if (parts[0] <= 3) return 'dotted';
  return 'dashed';
};

/** Extract the spacing value from a dash string */
const getDashSpacing = (dash?: string): number => {
  if (!dash) return 8;
  const parts = dash.trim().split(/\s+/).map(Number);
  if (parts.length < 2) return 8;
  // For dashed: return the dash length; for dotted: return the gap length
  if (parts[0] <= 3) return parts[1]; // dotted: gap is the spacing
  return parts[0]; // dashed: dash length is the spacing
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EdgePropertiesTabProps {
  edgeId: string;
  edgeData: FlowEdgeData;
  edgeType?: string;
}

const EdgePropertiesTab: React.FC<EdgePropertiesTabProps> = React.memo(
  ({ edgeId, edgeData, edgeType }) => {
    const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
    const edges = useFlowStore((s) => s.edges);
    const setEdges = useFlowStore((s) => s.setEdges);

    const update = useCallback(
      (patch: Partial<FlowEdgeData>) => {
        updateEdgeData(edgeId, patch);
      },
      [edgeId, updateEdgeData],
    );

    // Update the edge type (which is on the edge itself, not on edge.data)
    const updateType = useCallback(
      (type: string) => {
        const updated = edges.map((e) =>
          e.id === edgeId ? { ...e, type } : e,
        );
        setEdges(updated);
      },
      [edgeId, edges, setEdges],
    );

    // Update markerEnd on the edge itself
    const updateMarkerEnd = useCallback(
      (marker: string) => {
        const updated = edges.map((e) =>
          e.id === edgeId
            ? { ...e, markerEnd: marker || undefined }
            : e,
        );
        setEdges(updated);
      },
      [edgeId, edges, setEdges],
    );

    // Update markerStart on the edge itself
    const updateMarkerStart = useCallback(
      (marker: string) => {
        const updated = edges.map((e) =>
          e.id === edgeId
            ? { ...e, markerStart: marker || undefined }
            : e,
        );
        setEdges(updated);
      },
      [edgeId, edges, setEdges],
    );

    const strokeColor = edgeData.color || '#94a3b8';
    const thickness = edgeData.thickness || 2;
    const label = edgeData.label || '';
    const dependencyType = edgeData.dependencyType || 'none';

    // Infer current arrowheads from the edge record
    const currentEdge = edges.find((e) => e.id === edgeId);
    const currentMarkerEnd = markerToArrowhead(
      typeof currentEdge?.markerEnd === 'string' ? currentEdge.markerEnd : undefined,
    );
    const currentMarkerStart = markerToArrowhead(
      typeof currentEdge?.markerStart === 'string' ? currentEdge.markerStart : undefined,
    );

    // Infer line style from edge data or style override
    const currentStrokeDash =
      (edgeData as Record<string, unknown>).strokeDasharray as string | undefined;
    const currentLineStyle = strokeDashToStyle(currentStrokeDash);
    const currentDashSpacing = getDashSpacing(currentStrokeDash);

    return (
      <div className="flex flex-col gap-4">
        {/* Connector type */}
        <Field label="Connector Type">
          <select
            value={edgeType || 'smoothstep'}
            onChange={(e) => updateType(e.target.value)}
            className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                       dark:bg-slate-800 dark:border-slate-600 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
          >
            {EDGE_TYPES.map(({ value, label: lbl }) => (
              <option key={value} value={value}>
                {lbl}
              </option>
            ))}
          </select>
        </Field>

        {/* Connector color */}
        <Field label="Connector Color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => update({ color: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={strokeColor}
              onChange={(e) => update({ color: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                         dark:bg-slate-800 dark:border-slate-600 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </Field>

        {/* Thickness */}
        <Field label="Thickness">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={thickness}
              onChange={(e) => update({ thickness: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-text-muted w-8 text-right font-mono">
              {thickness}px
            </span>
          </div>
        </Field>

        {/* Opacity */}
        <Field label="Opacity">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={edgeData.opacity ?? 1}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="flex-1 h-1.5 accent-primary"
            />
            <span className="text-xs text-text-muted w-8 text-right font-mono">
              {Math.round((edgeData.opacity ?? 1) * 100)}%
            </span>
          </div>
        </Field>

        {/* Line style */}
        <Field label="Line Style">
          <div className="flex items-center gap-1">
            {EDGE_STYLES.map(({ value, label: lbl }) => (
              <button
                key={value}
                onClick={() => {
                  const dash = styleToStrokeDash(value);
                  update({ strokeDasharray: dash } as Partial<FlowEdgeData>);
                }}
                className={`
                  flex-1 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer
                  ${currentLineStyle === value
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-text-muted hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {lbl}
              </button>
            ))}
          </div>
        </Field>

        {/* Dash spacing (only for dashed/dotted) */}
        {currentLineStyle !== 'solid' && (
          <Field label="Dash Spacing">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={currentLineStyle === 'dotted' ? 2 : 4}
                max={currentLineStyle === 'dotted' ? 16 : 24}
                step={1}
                value={currentDashSpacing}
                onChange={(e) => {
                  const spacing = Number(e.target.value);
                  const dash = styleToStrokeDash(currentLineStyle, spacing);
                  update({ strokeDasharray: dash } as Partial<FlowEdgeData>);
                }}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right font-mono">
                {currentDashSpacing}px
              </span>
            </div>
          </Field>
        )}

        {/* Connector label */}
        <Field label="Label">
          <input
            type="text"
            value={label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Connector label..."
            className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                       dark:bg-slate-800 dark:border-slate-600 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </Field>

        {/* Label color */}
        {label && (
          <Field label="Label Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(edgeData as Record<string, unknown>).labelColor as string || '#475569'}
                onChange={(e) => update({ labelColor: e.target.value } as Partial<FlowEdgeData>)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={(edgeData as Record<string, unknown>).labelColor as string || '#475569'}
                onChange={(e) => update({ labelColor: e.target.value } as Partial<FlowEdgeData>)}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                           dark:bg-slate-800 dark:border-slate-600 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </Field>
        )}

        {/* Arrowhead section header */}
        <div className="border-t border-border dark:border-slate-600 pt-3 mt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Arrowheads
          </span>
        </div>

        {/* Start arrowhead */}
        <Field label="Start (Source)">
          <select
            value={currentMarkerStart}
            onChange={(e) => updateMarkerStart(arrowheadToMarker(e.target.value))}
            className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                       dark:bg-slate-800 dark:border-slate-600 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
          >
            {ARROWHEAD_TYPES.map(({ value, label: lbl }) => (
              <option key={value} value={value}>
                {lbl}
              </option>
            ))}
          </select>
        </Field>

        {/* End arrowhead */}
        <Field label="End (Target)">
          <select
            value={currentMarkerEnd}
            onChange={(e) => updateMarkerEnd(arrowheadToMarker(e.target.value))}
            className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                       dark:bg-slate-800 dark:border-slate-600 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
          >
            {ARROWHEAD_TYPES.map(({ value, label: lbl }) => (
              <option key={value} value={value}>
                {lbl}
              </option>
            ))}
          </select>
        </Field>

        {/* Dependency type -- only shown when meaningful */}
        <div className="border-t border-border dark:border-slate-600 pt-3 mt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Dependency
          </span>
        </div>

        <Field label="Dependency Type">
          <select
            value={dependencyType}
            onChange={(e) =>
              update({
                dependencyType: e.target.value as FlowEdgeData['dependencyType'],
              })
            }
            className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                       dark:bg-slate-800 dark:border-slate-600 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
          >
            {DEPENDENCY_TYPES.map(({ value, label: lbl }) => (
              <option key={value} value={value}>
                {lbl}
              </option>
            ))}
          </select>
        </Field>
      </div>
    );
  },
);

EdgePropertiesTab.displayName = 'EdgePropertiesTab';

export default EdgePropertiesTab;
