import type { ColorPalette } from '../types';

import { ocean } from './ocean';
import { berry } from './berry';
import { forest } from './forest';
import { sunset } from './sunset';
import { grayscale } from './grayscale';
import { cyber } from './cyber';
import { pastelDream } from './pastelDream';
import { earthTone } from './earthTone';
import { military } from './military';
import { accessible } from './accessible';
import { cyberC2 } from './cyberC2';

export const colorPalettes: Record<string, ColorPalette> = {
  ocean,
  berry,
  forest,
  sunset,
  grayscale,
  cyber,
  pastelDream,
  earthTone,
  military,
  accessible,
  cyberC2,
};

export const defaultPaletteId = 'ocean';

export {
  ocean,
  berry,
  forest,
  sunset,
  grayscale,
  cyber,
  pastelDream,
  earthTone,
  military,
  accessible,
  cyberC2,
};
