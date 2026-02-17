// ---------------------------------------------------------------------------
// swimlanes.ts -- Swimlane / cross-functional diagram types
// ---------------------------------------------------------------------------

// ---- Orientation ----------------------------------------------------------

export type LaneOrientation = 'horizontal' | 'vertical';

// ---- Divider appearance ---------------------------------------------------

export type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

// ---- Single lane ----------------------------------------------------------

export interface Lane {
  id: string;
  /** Display label shown in the lane header. */
  label: string;
  /** Optional secondary text rendered below the label. */
  subtitle?: string;
  /** Optional icon identifier (e.g. Lucide icon name). */
  icon?: string;
  /** Header background color. */
  headerColor?: string;
  /** Body / swimlane region background color. */
  bodyColor?: string;
  /**
   * Size of the lane along its cross-axis:
   *  - For horizontal lanes this is the lane height.
   *  - For vertical lanes this is the lane width.
   */
  size?: number;
  /** Ordering index (lower = closer to origin). */
  order?: number;
}

// ---- Full swimlane configuration ------------------------------------------

export interface SwimlaneConfig {
  horizontal: {
    enabled: boolean;
    lanes: Lane[];
  };
  vertical: {
    enabled: boolean;
    lanes: Lane[];
  };
  /** Title displayed at the top-left corner of the grid. */
  containerTitle?: string;
  /** Visual style of the divider lines between lanes. */
  dividerStyle?: DividerStyle;
  /** Divider line color. */
  dividerColor?: string;
  /** Divider line width in pixels. */
  dividerWidth?: number;
  /** Header size (width for horizontal headers, height for vertical headers). */
  headerSize?: number;
}

// ---- Matrix cell (intersection of a horizontal and vertical lane) ---------

export interface MatrixCell {
  /** Id of the horizontal lane. */
  horizontalLaneId: string;
  /** Id of the vertical lane. */
  verticalLaneId: string;
  /** Computed bounding box of this cell on the canvas. */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Node ids currently placed in this cell. */
  nodeIds: string[];
}
