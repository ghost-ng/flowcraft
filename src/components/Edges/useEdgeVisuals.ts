// ---------------------------------------------------------------------------
// useEdgeVisuals.ts -- Shared hook for extracting edge visual properties
// from the Zustand store with reliable change detection.
//
// React Flow v12's memo'd EdgeWrapper doesn't reliably re-render custom
// edge components when only data/style changes.  This hook uses useShallow
// to compare individual primitive values, guaranteeing re-renders when any
// visual property changes (color, thickness, opacity, dash, markers, label).
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { useShallow } from 'zustand/shallow';

export interface EdgeVisuals {
  color: string | undefined;
  thickness: number | undefined;
  opacity: number | undefined;
  strokeDasharray: string | undefined;
  animated: boolean;
  label: string | undefined;
  labelColor: string | undefined;
  labelPosition: number | undefined;
  labelFontSize: number | undefined;
  labelBgColor: string | undefined;
  markerEnd: string | undefined;
  markerStart: string | undefined;
  dependencyType: string | undefined;
  // styleOverrides passthrough (reference — changes alongside data)
  overrideStroke: string | undefined;
  overrideStrokeWidth: number | undefined;
  overrideDash: string | undefined;
  overrideOpacity: number | undefined;
  overrideLabelFontColor: string | undefined;
  overrideLabelBgColor: string | undefined;
  overrideLabelFontSize: number | undefined;
  // Direct edge.style values (for reliable reads bypassing React Flow memo)
  styleStroke: string | undefined;
  styleStrokeWidth: number | undefined;
  styleDash: string | undefined;
  styleOpacity: number | undefined;
}

/**
 * Extract all visual properties as primitives from the store edge.
 * useShallow compares each key individually with Object.is,
 * so primitive changes always trigger a re-render.
 */
export function useEdgeVisuals(edgeId: string): EdgeVisuals {
  const selector = useCallback(
    (s: ReturnType<typeof useFlowStore.getState>) => {
      const edge = s.edges.find((e) => e.id === edgeId);
      const d = edge?.data as Record<string, unknown> | undefined;
      const ov = d?.styleOverrides as Record<string, unknown> | undefined;
      const st = edge?.style as unknown as Record<string, unknown> | undefined;
      return {
        color: d?.color as string | undefined,
        thickness: d?.thickness as number | undefined,
        opacity: typeof d?.opacity === 'number' ? d.opacity : undefined,
        strokeDasharray: d?.strokeDasharray as string | undefined,
        animated: (d?.animated as boolean) ?? false,
        label: d?.label as string | undefined,
        labelColor: d?.labelColor as string | undefined,
        labelPosition: d?.labelPosition as number | undefined,
        labelFontSize: d?.labelFontSize as number | undefined,
        labelBgColor: d?.labelBgColor as string | undefined,
        markerEnd: typeof edge?.markerEnd === 'string' ? edge.markerEnd : undefined,
        markerStart: typeof edge?.markerStart === 'string' ? edge.markerStart : undefined,
        dependencyType: d?.dependencyType as string | undefined,
        overrideStroke: ov?.stroke as string | undefined,
        overrideStrokeWidth: ov?.strokeWidth as number | undefined,
        overrideDash: ov?.strokeDasharray as string | undefined,
        overrideOpacity: ov?.opacity as number | undefined,
        overrideLabelFontColor: ov?.labelFontColor as string | undefined,
        overrideLabelBgColor: ov?.labelBgColor as string | undefined,
        overrideLabelFontSize: ov?.labelFontSize as number | undefined,
        // Read edge.style directly from store (bypasses React Flow memo)
        styleStroke: st?.stroke as string | undefined,
        styleStrokeWidth: st?.strokeWidth as number | undefined,
        styleDash: st?.strokeDasharray as string | undefined,
        styleOpacity: typeof st?.opacity === 'number' ? st.opacity : undefined,
      };
    },
    [edgeId],
  );

  return useFlowStore(useShallow(selector));
}
