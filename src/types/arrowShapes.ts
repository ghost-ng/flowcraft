// ---------------------------------------------------------------------------
// arrowShapes.ts -- Arrow shape node types (block arrows, chevrons, etc.)
// ---------------------------------------------------------------------------

import type { ArrowShapeType } from './nodes';

// ---- Arrow pointing direction ---------------------------------------------

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

// ---- Per-instance arrow properties ----------------------------------------

export interface ArrowProperties {
  /** Which arrow shape variant to render. */
  shapeType: ArrowShapeType;
  /** Direction the arrow points toward. */
  direction: ArrowDirection;
  /** Shaft width as a ratio of the bounding box (0 - 1). */
  shaftWidth: number;
  /** Head length as a ratio of the bounding box (0 - 1). */
  headLength: number;
  /** Head width as a ratio of the bounding box (0 - 1). */
  headWidth: number;
  /** Corner radius for block / chevron arrows. */
  cornerRadius?: number;
  /** Curvature amount for curved arrows (-1 to 1). */
  curvature?: number;
  /** Whether the shaft is hollow (outlined) vs filled. */
  hollow?: boolean;
  /** Bend angle in degrees for bent arrows. */
  bendAngle?: number;
  /** Fill color override. */
  fill?: string;
  /** Stroke color override. */
  stroke?: string;
  /** Stroke width override. */
  strokeWidth?: number;
}

// ---- Arrow shape definition (template in the palette) ---------------------

export interface ArrowShapeDefinition {
  /** Matches the ArrowShapeType discriminator. */
  type: ArrowShapeType;
  /** Display label in the UI. */
  label: string;
  /** Brief description / tooltip. */
  description: string;
  /** SVG path template (viewBox 0 0 100 100). */
  svgPath: string;
  /** Default property values for new instances. */
  defaults: Omit<ArrowProperties, 'shapeType'>;
  /** Whether the direction can be changed. */
  supportsDirection: boolean;
  /** Whether curvature is adjustable. */
  supportsCurvature: boolean;
}
