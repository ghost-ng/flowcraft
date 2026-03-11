/**
 * Recolor an SVG string by replacing fill and stroke attributes on shape elements.
 * Elements with fill="none" or stroke="none" are left untouched.
 */
export function recolorSvg(
  svgContent: string,
  fillColor?: string,
  strokeColor?: string,
): string {
  if (!fillColor && !strokeColor) return svgContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const shapeEls = doc.querySelectorAll('path, rect, circle, polygon, ellipse, line, polyline');

  for (const el of shapeEls) {
    if (fillColor) {
      const currentFill = el.getAttribute('fill');
      if (currentFill && currentFill !== 'none') {
        el.setAttribute('fill', fillColor);
      }
    }
    if (strokeColor) {
      const currentStroke = el.getAttribute('stroke');
      if (currentStroke && currentStroke !== 'none') {
        el.setAttribute('stroke', strokeColor);
      }
    }
  }

  // Find the maximum stroke-width across all shape elements so we can pad
  // the viewBox to prevent strokes from being clipped at the edges.
  let maxStroke = 0;
  for (const el of shapeEls) {
    const sw = parseFloat(el.getAttribute('stroke-width') || '0');
    if (sw > maxStroke) maxStroke = sw;
  }

  // Allow the SVG to stretch freely with its container (no locked aspect ratio).
  // Individual resize handles on ExtensionNode control which axes scale.
  const root = doc.documentElement;
  root.setAttribute('preserveAspectRatio', 'none');
  root.setAttribute('width', '100%');
  root.setAttribute('height', '100%');
  root.setAttribute('overflow', 'hidden');

  // Expand the viewBox by the max stroke-width on all sides so strokes
  // (including mitered joins) stay within the clipped area.
  if (maxStroke > 0) {
    const vb = root.getAttribute('viewBox');
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        const pad = maxStroke;
        root.setAttribute(
          'viewBox',
          `${parts[0] - pad} ${parts[1] - pad} ${parts[2] + pad * 2} ${parts[3] + pad * 2}`,
        );
      }
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(root);
}

/**
 * Extract the viewBox from an SVG string. Falls back to '0 0 64 64'.
 */
export function extractViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox=["']([^"']+)["']/);
  return match?.[1] || '0 0 64 64';
}
