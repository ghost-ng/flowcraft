import type { DiagramStyle } from '../styles/types';
import { darkenColor, ensureReadableText } from './colorUtils';

// ---------------------------------------------------------------------------
// Hardcoded shape colors — used when no theme is active
// ---------------------------------------------------------------------------

export const HARDCODED_SHAPE_COLORS: Record<string, string> = {
  rectangle: '#3b82f6',
  roundedRectangle: '#3b82f6',
  diamond: '#f59e0b',
  circle: '#10b981',
  parallelogram: '#8b5cf6',
  hexagon: '#ef4444',
  document: '#ec4899',
  cloud: '#6366f1',
  stickyNote: '#fbbf24',
  textbox: 'transparent',
  blockArrow: '#3b82f6',
  chevronArrow: '#8b5cf6',
  doubleArrow: '#f59e0b',
  circularArrow: '#10b981',
};

// ---------------------------------------------------------------------------
// Resolved types
// ---------------------------------------------------------------------------

export interface ResolvedNodeStyle {
  fill: string;
  borderColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}

export interface ResolvedEdgeStyle {
  stroke: string;
  strokeWidth: number;
}

// ---------------------------------------------------------------------------
// Node resolver
// ---------------------------------------------------------------------------

export function resolveNodeStyle(
  nodeData: Record<string, unknown>,
  shape: string,
  activeStyle: DiagramStyle | null,
): ResolvedNodeStyle {
  // 1. Fill color: user → theme shape → theme default → hardcoded
  const fill =
    (nodeData.color as string | undefined)
    || activeStyle?.shapeColors?.[shape]
    || activeStyle?.nodeDefaults.fill
    || HARDCODED_SHAPE_COLORS[shape]
    || '#3b82f6';

  // 2. Border color: user → theme default → darken(fill)
  const borderColor =
    (nodeData.borderColor as string | undefined)
    || activeStyle?.nodeDefaults.stroke
    || darkenColor(fill, 0.25);

  // 3. Font family: user → theme default → hardcoded
  const fontFamily =
    (nodeData.fontFamily as string | undefined)
    || activeStyle?.nodeDefaults.fontFamily
    || "'Inter', 'Segoe UI', sans-serif";

  // 4. Font size: user → theme default → 14
  const fontSize =
    (nodeData.fontSize as number | undefined)
    || activeStyle?.nodeDefaults.fontSize
    || 14;

  // 5. Font weight: user → theme default → 500
  const fontWeight =
    (nodeData.fontWeight as number | undefined)
    || activeStyle?.nodeDefaults.fontWeight
    || 500;

  // 6. Text color: user → ensureReadable(fill, theme fontColor) → '#ffffff'
  const isTransparentFill = !fill || fill === 'transparent' || fill === 'none';
  const themeFontColor = activeStyle?.nodeDefaults.fontColor;
  let textColor: string;
  if (nodeData.textColor) {
    textColor = nodeData.textColor as string;
  } else if (isTransparentFill) {
    textColor = themeFontColor || '#1e293b';
  } else if (themeFontColor) {
    textColor = ensureReadableText(fill, themeFontColor);
  } else {
    textColor = '#ffffff';
  }

  return { fill, borderColor, textColor, fontFamily, fontSize, fontWeight };
}

// ---------------------------------------------------------------------------
// Edge resolver
// ---------------------------------------------------------------------------

export function resolveEdgeStyle(
  edgeData: Record<string, unknown>,
  activeStyle: DiagramStyle | null,
): ResolvedEdgeStyle {
  const stroke =
    (edgeData.color as string | undefined)
    || activeStyle?.edgeDefaults.stroke
    || '#94a3b8';

  const strokeWidth =
    (edgeData.thickness as number | undefined)
    || activeStyle?.edgeDefaults.strokeWidth
    || 2;

  return { stroke, strokeWidth };
}

// ---------------------------------------------------------------------------
// Canvas background resolver
// ---------------------------------------------------------------------------

export function resolveCanvasBackground(
  canvasColorOverride: string | null,
  darkMode: boolean,
  activeStyle: DiagramStyle | null,
): string {
  if (canvasColorOverride) return canvasColorOverride;
  if (darkMode && !activeStyle) return '#1e2d3d';
  return activeStyle?.canvas.background ?? '#ffffff';
}
