// ---------------------------------------------------------------------------
// Style Resolution Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

/** A generic style record -- each layer may only define a subset of keys. */
export interface StyleRecord {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textColor?: string;
  shadow?: boolean;
  opacity?: number;
  padding?: number;
  [key: string]: unknown;
}

export interface EdgeStyleRecord {
  stroke?: string;
  strokeWidth?: number;
  animated?: boolean;
  markerEnd?: string;
  labelFontSize?: number;
  labelColor?: string;
  dashArray?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// mergeStyleOverrides
// ---------------------------------------------------------------------------

/**
 * Deep-merge two style objects, keeping only keys from `overrides` that are
 * explicitly defined (not `undefined`).  The `base` object is never mutated.
 *
 * @param base      - Foundation style values
 * @param overrides - Values that should replace the base where defined
 * @returns A new object combining base + overrides
 */
export function mergeStyleOverrides<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T> | undefined | null,
): T {
  if (!overrides) return { ...base };

  const merged = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(overrides)) {
    const value = (overrides as Record<string, unknown>)[key];

    if (value === undefined) continue;

    // Deep-merge plain objects; overwrite everything else
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof merged[key] === 'object' &&
      merged[key] !== null &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeStyleOverrides(
        merged[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      merged[key] = value;
    }
  }

  return merged as T;
}

// ---------------------------------------------------------------------------
// resolveNodeStyle
// ---------------------------------------------------------------------------

/**
 * Merge three node-style layers to produce a final computed style.
 *
 * Priority order (lowest to highest):
 *   1. `globalStyle`     -- the theme's default for all nodes
 *   2. `shapeDefaults`   -- defaults specific to the node's shape
 *   3. `nodeOverrides`   -- per-node inline overrides
 *
 * @returns Final computed node style
 */
export function resolveNodeStyle(
  globalStyle: StyleRecord | undefined | null,
  shapeDefaults: Partial<StyleRecord> | undefined | null,
  nodeOverrides: Partial<StyleRecord> | undefined | null,
): StyleRecord {
  const base: StyleRecord = {
    fill: '#ffffff',
    stroke: '#222222',
    strokeWidth: 1,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 400,
    textColor: '#000000',
    shadow: false,
    opacity: 1,
    padding: 12,
  };

  const withGlobal = mergeStyleOverrides(base, globalStyle);
  const withShape = mergeStyleOverrides(withGlobal, shapeDefaults);
  return mergeStyleOverrides(withShape, nodeOverrides);
}

// ---------------------------------------------------------------------------
// resolveEdgeStyle
// ---------------------------------------------------------------------------

/**
 * Merge four edge-style layers to produce a final computed edge style.
 *
 * Priority order (lowest to highest):
 *   1. `globalStyle`       -- theme's default for all edges
 *   2. `edgeTypeDefaults`  -- defaults for the edge type (e.g. "smoothstep")
 *   3. `depTypeDefaults`   -- defaults based on dependency type
 *   4. `edgeOverrides`     -- per-edge inline overrides
 *
 * @returns Final computed edge style
 */
export function resolveEdgeStyle(
  globalStyle: EdgeStyleRecord | undefined | null,
  edgeTypeDefaults: Partial<EdgeStyleRecord> | undefined | null,
  depTypeDefaults: Partial<EdgeStyleRecord> | undefined | null,
  edgeOverrides: Partial<EdgeStyleRecord> | undefined | null,
): EdgeStyleRecord {
  const base: EdgeStyleRecord = {
    stroke: '#555555',
    strokeWidth: 1.5,
    animated: false,
    markerEnd: 'arrowclosed',
    labelFontSize: 12,
    labelColor: '#333333',
  };

  const withGlobal = mergeStyleOverrides(base, globalStyle);
  const withEdgeType = mergeStyleOverrides(withGlobal, edgeTypeDefaults);
  const withDepType = mergeStyleOverrides(withEdgeType, depTypeDefaults);
  return mergeStyleOverrides(withDepType, edgeOverrides);
}
