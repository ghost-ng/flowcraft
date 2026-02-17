// ---------------------------------------------------------------------------
// Color Utilities (powered by chroma-js)
// ---------------------------------------------------------------------------

import chroma from 'chroma-js';

/**
 * Return a contrasting text colour (black or white) for a given background
 * colour, targeting WCAG AA contrast ratio of 4.5:1.
 *
 * @param bgColor - Any CSS-compatible colour string
 * @returns `'#000000'` or `'#ffffff'`
 */
export function getContrastColor(bgColor: string): string {
  try {
    const bg = chroma(bgColor);
    const contrastWithWhite = chroma.contrast(bg, 'white');
    const contrastWithBlack = chroma.contrast(bg, 'black');

    // Prefer black text when both meet AA; otherwise pick the higher contrast
    if (contrastWithBlack >= 4.5) return '#000000';
    if (contrastWithWhite >= 4.5) return '#ffffff';

    // Fallback: choose whichever has more contrast
    return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';
  } catch {
    return '#000000';
  }
}

/**
 * Generate an array of progressively lighter tints of the given colour.
 *
 * @param color - Base colour
 * @param count - Number of tints to generate
 * @returns Array of hex colour strings from the base towards white
 */
export function generateTints(color: string, count: number): string[] {
  try {
    const scale = chroma.scale([color, '#ffffff']).mode('lab').colors(count + 2);
    // Drop the first (original) and last (pure white) entries
    return scale.slice(1, count + 1);
  } catch {
    return Array(count).fill('#ffffff');
  }
}

/**
 * Generate an array of progressively darker shades of the given colour.
 *
 * @param color - Base colour
 * @param count - Number of shades to generate
 * @returns Array of hex colour strings from the base towards black
 */
export function generateShades(color: string, count: number): string[] {
  try {
    const scale = chroma.scale([color, '#000000']).mode('lab').colors(count + 2);
    // Drop the first (original) and last (pure black) entries
    return scale.slice(1, count + 1);
  } catch {
    return Array(count).fill('#000000');
  }
}

/**
 * Check whether a string is a valid CSS colour that chroma-js can parse.
 */
export function isValidColor(color: string): boolean {
  try {
    chroma(color);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return a colour string with the given opacity applied (rgba).
 *
 * @param color   - Base colour
 * @param opacity - Opacity value between 0 and 1
 */
export function adjustOpacity(color: string, opacity: number): string {
  try {
    return chroma(color).alpha(opacity).css();
  } catch {
    return color;
  }
}

/**
 * Blend two colours together at the given ratio using LAB colour space.
 *
 * @param color1 - First colour
 * @param color2 - Second colour
 * @param ratio  - Blend ratio (0 = all color1, 1 = all color2)
 * @returns Hex colour string of the blended result
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  try {
    return chroma.mix(color1, color2, ratio, 'lab').hex();
  } catch {
    return color1;
  }
}

/**
 * Get the best text colour (white or dark) for a given background,
 * using a luminance threshold optimised for readability.
 */
export function getAutoTextColor(bgColor: string): string {
  try {
    const lum = chroma(bgColor).luminance();
    return lum > 0.35 ? '#1f2937' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

/**
 * Darken a colour by the given amount (0-1).
 * Useful for deriving a default border colour from a fill colour.
 */
export function darkenColor(color: string, amount: number = 0.2): string {
  try {
    return chroma(color).darken(amount * 5).hex();
  } catch {
    return color;
  }
}

/**
 * Return the preferred text colour if it has sufficient contrast against
 * the background (>= 3:1), otherwise auto-pick a readable alternative.
 */
export function ensureReadableText(bgColor: string, preferredColor: string): string {
  try {
    const ratio = chroma.contrast(bgColor, preferredColor);
    if (ratio >= 3) return preferredColor;
    return getAutoTextColor(bgColor);
  } catch {
    return preferredColor;
  }
}
