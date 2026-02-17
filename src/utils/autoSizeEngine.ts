// ---------------------------------------------------------------------------
// Auto-Size Engine
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface TextMeasurement {
  width: number;
  height: number;
  lines: string[];
}

export interface NodeSize {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Shared canvas context (lazily initialised)
// ---------------------------------------------------------------------------

let _canvas: HTMLCanvasElement | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (!_canvas) {
    _canvas = document.createElement('canvas');
  }
  return _canvas.getContext('2d');
}

// ---------------------------------------------------------------------------
// measureText
// ---------------------------------------------------------------------------

/**
 * Measure the pixel dimensions a text string would occupy when rendered with
 * the given font settings, word-wrapping to `maxWidth`.
 *
 * Uses an off-screen `<canvas>` for measurement -- no DOM nodes are inserted
 * into the document.
 *
 * @param text       - The text to measure
 * @param fontFamily - CSS font-family value
 * @param fontSize   - Font size in pixels
 * @param fontWeight - Numeric font weight (e.g. 400, 700)
 * @param maxWidth   - Maximum line width before wrapping (pixels)
 * @returns Measured width, height, and the individual wrapped lines
 */
export function measureText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  maxWidth: number,
): TextMeasurement {
  const ctx = getCanvasContext();

  // Fallback if canvas is unavailable (e.g. SSR or test environments)
  if (!ctx) {
    const avgCharWidth = fontSize * 0.6;
    const charsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length > charsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.3;
    return {
      width: Math.min(maxWidth, Math.max(...lines.map((l) => l.length * avgCharWidth))),
      height: lines.length * lineHeight,
      lines,
    };
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const lineHeight = fontSize * 1.3;

  // Split into paragraphs first, then word-wrap each
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const measured = ctx.measureText(candidate);

      if (measured.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  // Compute the actual width as the maximum measured line width
  let widestLine = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > widestLine) widestLine = w;
  }

  return {
    width: Math.ceil(widestLine),
    height: Math.ceil(lines.length * lineHeight),
    lines,
  };
}

// ---------------------------------------------------------------------------
// computeNodeSize
// ---------------------------------------------------------------------------

/**
 * Calculate the ideal node dimensions to comfortably fit the given text.
 *
 * @param text         - Node label text
 * @param fontFamily   - CSS font-family
 * @param fontSize     - Font size in pixels
 * @param fontWeight   - Numeric font weight
 * @param maxAutoWidth - Maximum node width before wrapping (default 280)
 * @param padding      - Internal padding on each side (default 16)
 * @returns Computed { width, height }
 */
export function computeNodeSize(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  maxAutoWidth: number = 280,
  padding: number = 16,
): NodeSize {
  const innerMaxWidth = maxAutoWidth - padding * 2;
  const measurement = measureText(text, fontFamily, fontSize, fontWeight, innerMaxWidth);

  // Minimum dimensions
  const minWidth = 80;
  const minHeight = 36;

  const width = Math.max(minWidth, Math.ceil(measurement.width + padding * 2));
  const height = Math.max(minHeight, Math.ceil(measurement.height + padding * 2));

  return { width, height };
}

// ---------------------------------------------------------------------------
// computeFontSizeToFit
// ---------------------------------------------------------------------------

/**
 * Binary-search for the largest font size that allows the given text to fit
 * within the specified bounding box.
 *
 * @param text        - Text to fit
 * @param width       - Available width in pixels
 * @param height      - Available height in pixels
 * @param fontFamily  - CSS font-family
 * @param fontWeight  - Numeric font weight
 * @param minFontSize - Floor for the font size (default 8)
 * @returns The largest integer font size that fits
 */
export function computeFontSizeToFit(
  text: string,
  width: number,
  height: number,
  fontFamily: string,
  fontWeight: number,
  minFontSize: number = 8,
): number {
  const padding = 8; // small internal padding
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  if (availableWidth <= 0 || availableHeight <= 0) return minFontSize;

  let low = minFontSize;
  let high = Math.max(minFontSize, Math.floor(availableHeight)); // font can't exceed box height
  let best = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const measurement = measureText(text, fontFamily, mid, fontWeight, availableWidth);

    if (measurement.width <= availableWidth && measurement.height <= availableHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
