// ---------------------------------------------------------------------------
// ID Generation Utilities
// ---------------------------------------------------------------------------

/**
 * Generate a unique identifier using crypto.randomUUID().
 * An optional prefix is prepended with an underscore separator.
 *
 * @param prefix - Optional string prepended to the UUID (e.g. "node", "edge")
 * @returns A unique string like "node_a1b2c3d4-..."
 */
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Shorthand for generating a node identifier.
 */
export function generateNodeId(): string {
  return generateId('node');
}

/**
 * Shorthand for generating an edge identifier.
 */
export function generateEdgeId(): string {
  return generateId('edge');
}
