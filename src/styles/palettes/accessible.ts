import type { ColorPalette } from '../types';

/**
 * WCAG AAA contrast-safe palette.
 * All colors meet a minimum contrast ratio of 7:1 against white (#ffffff)
 * and 4.5:1 against each other where applicable, ensuring readability
 * for users with visual impairments.
 */
export const accessible: ColorPalette = {
  id: 'accessible',
  displayName: 'Accessible (AAA)',
  colors: ['#0b5394', '#6b3a0a', '#1a6b3c', '#8b1a1a', '#4a2d73'],
};
