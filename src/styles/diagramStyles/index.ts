import type { DiagramStyle } from '../types';

import { cleanMinimal } from './cleanMinimal';
import { corporateProfessional } from './corporateProfessional';
import { blueprint } from './blueprint';
import { whiteboardSketch } from './whiteboardSketch';
import { neonDark } from './neonDark';
import { pastelSoft } from './pastelSoft';
import { flatMaterial } from './flatMaterial';
import { monochromeInk } from './monochromeInk';
import { retroTerminal } from './retroTerminal';
import { watercolor } from './watercolor';
import { glassMorphism } from './glassMorphism';
import { wireframe } from './wireframe';
import { militaryC2 } from './militaryC2';
import { infographicBold } from './infographicBold';
import { colorfulGradient } from './colorfulGradient';
import { darkNeonGlow } from './darkNeonGlow';
import { notebook } from './notebook';
import { gradientCards } from './gradientCards';
import { cyberC2 } from './cyberC2';

export const diagramStyles: Record<string, DiagramStyle> = {
  cleanMinimal,
  corporateProfessional,
  blueprint,
  whiteboardSketch,
  neonDark,
  pastelSoft,
  flatMaterial,
  monochromeInk,
  retroTerminal,
  watercolor,
  glassMorphism,
  wireframe,
  militaryC2,
  infographicBold,
  colorfulGradient,
  darkNeonGlow,
  notebook,
  gradientCards,
  cyberC2,
};

export const defaultStyleId = 'cleanMinimal';

export {
  cleanMinimal,
  corporateProfessional,
  blueprint,
  whiteboardSketch,
  neonDark,
  pastelSoft,
  flatMaterial,
  monochromeInk,
  retroTerminal,
  watercolor,
  glassMorphism,
  wireframe,
  militaryC2,
  infographicBold,
  colorfulGradient,
  darkNeonGlow,
  notebook,
  gradientCards,
  cyberC2,
};
