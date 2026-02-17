// ---------------------------------------------------------------------------
// layers.ts -- Diagram layer management
// ---------------------------------------------------------------------------

export interface Layer {
  /** Unique layer identifier. */
  id: string;
  /** Human-readable layer name. */
  name: string;
  /** Whether nodes/edges on this layer are rendered. */
  visible: boolean;
  /** Whether nodes/edges on this layer are locked (non-interactive). */
  locked: boolean;
  /** Opacity of all elements on this layer (0 - 1). */
  opacity: number;
  /** Tint color used for the layer indicator in the UI. */
  color: string;
  /** Stacking order (lower = further back). */
  order: number;
}
