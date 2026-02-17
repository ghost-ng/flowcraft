/**
 * Suggest edge type based on source/target alignment.
 * If nearly aligned horizontally or vertically, suggest 'straight'.
 */
export function suggestEdgeType(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  threshold: number = 30,
  defaultType: string = 'smoothstep',
): string {
  const dx = Math.abs(sourcePos.x - targetPos.x);
  const dy = Math.abs(sourcePos.y - targetPos.y);
  if (dx <= threshold || dy <= threshold) {
    return 'straight';
  }
  return defaultType;
}
