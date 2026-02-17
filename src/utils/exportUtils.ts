// ---------------------------------------------------------------------------
// exportUtils.ts -- All export functions for FlowCraft
// ---------------------------------------------------------------------------

import { toPng, toJpeg, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
type SHAPE_NAME = PptxGenJS.SHAPE_NAME;

import { useFlowStore } from '../store/flowStore';
import { useStyleStore } from '../store/styleStore';
import { log } from './logger';
import {
  type ExportFormat,
  type PngExportOptions,
  type JpgExportOptions,
  type SvgExportOptions,
  type PdfExportOptions,
  type PptxExportOptions,
  type JsonExportOptions,
} from '../store/exportStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the React Flow viewport element to capture.
 * Falls back to the `.react-flow` container if the viewport isn't found.
 */
export function getReactFlowElement(): HTMLElement {
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (viewport) return viewport;
  const container = document.querySelector<HTMLElement>('.react-flow');
  if (container) return container;
  throw new Error('Could not find React Flow element in the DOM');
}

/**
 * Generates a timestamped filename.
 */
function getFilename(ext: string): string {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `flowcraft-${stamp}.${ext}`;
}

/**
 * Estimates the file size for a given format (rough heuristic).
 */
export function estimateFileSize(
  format: ExportFormat,
  nodeCount: number,
  edgeCount: number,
  scale: number = 2,
): string {
  const base = Math.max(1, nodeCount * 500 + edgeCount * 200);
  let bytes: number;

  switch (format) {
    case 'png':
      bytes = base * scale * scale * 4;
      break;
    case 'jpg':
      bytes = base * scale * scale * 2;
      break;
    case 'svg':
      bytes = base * 3;
      break;
    case 'pdf':
      bytes = base * scale * scale * 4 + 5000;
      break;
    case 'pptx':
      bytes = base * scale * scale * 4 + 10000;
      break;
    case 'json':
      bytes = (nodeCount * 400 + edgeCount * 200) || 200;
      break;
    case 'csv':
      bytes = (nodeCount * 100 + edgeCount * 60) || 100;
      break;
    default:
      bytes = base;
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// PNG Export
// ---------------------------------------------------------------------------

export async function exportAsPng(options: PngExportOptions): Promise<void> {
  const element = getReactFlowElement();
  const { scale, transparentBackground, padding } = options;

  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: transparentBackground ? undefined : '#ffffff',
    style: {
      padding: `${padding}px`,
    },
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  saveAs(blob, getFilename('png'));
}

// ---------------------------------------------------------------------------
// JPG Export
// ---------------------------------------------------------------------------

export async function exportAsJpg(options: JpgExportOptions): Promise<void> {
  const element = getReactFlowElement();
  const { quality, scale, backgroundColor, padding } = options;

  const dataUrl = await toJpeg(element, {
    quality,
    pixelRatio: scale,
    backgroundColor: backgroundColor || '#ffffff',
    style: {
      padding: `${padding}px`,
    },
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  saveAs(blob, getFilename('jpg'));
}

// ---------------------------------------------------------------------------
// SVG Export
// ---------------------------------------------------------------------------

export async function exportAsSvg(options: SvgExportOptions): Promise<void> {
  const { embedFonts, padding } = options;

  // Use the full .react-flow container — the viewport child has CSS transforms
  // that html-to-image may not resolve correctly, causing blank output.
  const container = document.querySelector<HTMLElement>('.react-flow');
  if (!container) throw new Error('Could not find React Flow element in the DOM');

  const dataUrl = await toSvg(container, {
    skipFonts: !embedFonts,
    backgroundColor: '#ffffff',
    width: container.offsetWidth + padding * 2,
    height: container.offsetHeight + padding * 2,
    style: {
      padding: `${padding}px`,
    },
    filter: (node) => {
      // Exclude minimap, controls, and panel overlays from the SVG
      const el = node as HTMLElement;
      if (!el.classList) return true;
      if (el.classList.contains('react-flow__minimap')) return false;
      if (el.classList.contains('react-flow__controls')) return false;
      if (el.classList.contains('react-flow__panel')) return false;
      return true;
    },
  });

  // Convert data URL to SVG string
  const svgString = decodeURIComponent(dataUrl.split(',')[1]);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, getFilename('svg'));
}

// ---------------------------------------------------------------------------
// PDF Export
// ---------------------------------------------------------------------------

/** Map page size keys to jsPDF format strings */
const PDF_PAGE_SIZES: Record<string, string> = {
  a4: 'a4',
  a3: 'a3',
  letter: 'letter',
  legal: 'legal',
};

export async function exportAsPdf(options: PdfExportOptions): Promise<void> {
  const element = getReactFlowElement();

  // Capture the diagram as a PNG first
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const { pageSize, orientation, fitToPage, margin } = options;
  const pdfFormat = PDF_PAGE_SIZES[pageSize] || 'a4';

  const doc = new jsPDF({
    orientation: orientation === 'portrait' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: pdfFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginMm = margin || 20;

  // Load image to get dimensions
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const imgWidth = img.width;
  const imgHeight = img.height;

  let drawWidth = pageWidth - marginMm * 2;
  let drawHeight = pageHeight - marginMm * 2;

  if (fitToPage) {
    const imgAspect = imgWidth / imgHeight;
    const pageAspect = drawWidth / drawHeight;

    if (imgAspect > pageAspect) {
      drawHeight = drawWidth / imgAspect;
    } else {
      drawWidth = drawHeight * imgAspect;
    }
  }

  // Center the image on the page
  const x = marginMm + (pageWidth - marginMm * 2 - drawWidth) / 2;
  const y = marginMm + (pageHeight - marginMm * 2 - drawHeight) / 2;

  doc.addImage(dataUrl, 'PNG', x, y, drawWidth, drawHeight);

  // Footer with date
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString();
  doc.text(
    `FlowCraft Diagram - ${dateStr}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' },
  );

  doc.save(getFilename('pdf'));
}

// ---------------------------------------------------------------------------
// PPTX Export -- native shapes + SVG fallback
// ---------------------------------------------------------------------------

/**
 * Map FlowCraft node shapes to pptxgenjs SHAPE_NAME values.
 * Shapes with a direct PPTX equivalent are listed here; any shape
 * not in this map falls back to SVG-image rendering.
 */
const PPTX_SHAPE_MAP: Record<string, SHAPE_NAME> = {
  rectangle: 'rect',
  roundedRectangle: 'roundRect',
  diamond: 'diamond',
  circle: 'ellipse',
  ellipse: 'ellipse',
  hexagon: 'hexagon',
  parallelogram: 'parallelogram',
  document: 'flowChartDocument',
  cloud: 'cloud',
  star: 'star5',
  triangle: 'triangle',
  callout: 'wedgeRoundRectCallout',
  predefinedProcess: 'flowChartPredefinedProcess',
  manualInput: 'flowChartManualInput',
  preparation: 'flowChartPreparation',
  data: 'flowChartInputOutput',
  database: 'flowChartMagneticDisk',
  internalStorage: 'flowChartInternalStorage',
  display: 'flowChartDisplay',
};

/**
 * SVG path definitions for arrow / complex shapes that have no PPTX
 * primitive.  Keys match the FlowCraft NodeShape ids; values are
 * functions returning an SVG string sized to the given w/h pixels.
 */
const SVG_SHAPE_RENDERERS: Record<
  string,
  (w: number, h: number, fill: string, stroke: string) => string
> = {
  blockArrow: (w, h, fill, stroke) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 160 80">
      <path d="M 0 20 L 100 20 L 100 5 L 155 40 L 100 75 L 100 60 L 0 60 Z"
            fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
  chevronArrow: (w, h, fill, stroke) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 160 80">
      <path d="M 0 5 L 115 5 L 155 40 L 115 75 L 0 75 L 40 40 Z"
            fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
  doubleArrow: (w, h, fill, stroke) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 160 80">
      <path d="M 40 5 L 0 40 L 40 75 L 40 55 L 120 55 L 120 75 L 160 40 L 120 5 L 120 25 L 40 25 Z"
            fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
  circularArrow: (w, h, fill, stroke) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 80">
      <path d="M 75 12 A 32 32 0 1 1 38 20" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round"/>
      <polygon points="24,4 48,20 22,28" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
  arrow: (w, h, fill, stroke) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 160 80">
      <path d="M 0 20 L 100 20 L 100 5 L 155 40 L 100 75 L 100 60 L 0 60 Z"
            fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
};

/**
 * Default dimensions per shape (mirrors GenericShapeNode logic).
 */
function getDefaultSize(shape: string): { w: number; h: number } {
  const ARROW_SHAPES = new Set(['blockArrow', 'chevronArrow', 'doubleArrow', 'circularArrow']);
  if (shape === 'circularArrow') return { w: 100, h: 100 };
  if (ARROW_SHAPES.has(shape)) return { w: 160, h: 80 };
  if (shape === 'circle') return { w: 100, h: 100 };
  if (shape === 'diamond') return { w: 100, h: 100 };
  return { w: 160, h: 60 };
}

export async function exportAsPptx(options: PptxExportOptions): Promise<void> {
  const state = useFlowStore.getState();
  const { nodes, edges } = state;

  const { slideSize, includeNotes, oneSlidePerGroup } = options;

  const pptx = new PptxGenJS();

  // -- slide dimensions -----------------------------------------------
  const slideW = slideSize === 'widescreen' ? 13.33 : 10;
  const slideH = 7.5;
  if (slideSize === 'widescreen') {
    pptx.defineLayout({ name: 'WIDESCREEN', width: slideW, height: slideH });
    pptx.layout = 'WIDESCREEN';
  } else {
    pptx.defineLayout({ name: 'STANDARD', width: slideW, height: slideH });
    pptx.layout = 'STANDARD';
  }

  // -- optional title slide -------------------------------------------
  if (oneSlidePerGroup) {
    const titleSlide = pptx.addSlide();
    titleSlide.addText('FlowCraft Diagram', {
      x: 0.5,
      y: 2.5,
      w: slideW - 1,
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: '333333',
      align: 'center',
      valign: 'middle',
    });
    titleSlide.addText(new Date().toLocaleDateString(), {
      x: 0.5,
      y: 4,
      w: slideW - 1,
      h: 0.5,
      fontSize: 14,
      color: '888888',
      align: 'center',
    });
  }

  // -- diagram slide --------------------------------------------------
  const slide = pptx.addSlide();

  // Diagram title at the top of the slide
  slide.addText('FlowCraft Diagram', {
    x: 0.3,
    y: 0.15,
    w: slideW - 0.6,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: '555555',
    align: 'left',
    valign: 'middle',
  });

  // Guard: nothing to draw
  if (nodes.length === 0) {
    slide.addText('(empty diagram)', {
      x: 1,
      y: 3,
      w: slideW - 2,
      h: 1,
      fontSize: 18,
      color: '999999',
      align: 'center',
      valign: 'middle',
    });
    const fileData = (await pptx.write({ outputType: 'blob' })) as Blob;
    saveAs(fileData, getFilename('pptx'));
    return;
  }

  // -- compute bounding box & scale factor ----------------------------
  const allX: number[] = [];
  const allY: number[] = [];
  const allR: number[] = [];
  const allB: number[] = [];

  for (const n of nodes) {
    const defaults = getDefaultSize(n.data.shape);
    const w = n.data.width || defaults.w;
    const h = n.data.height || defaults.h;
    allX.push(n.position.x);
    allY.push(n.position.y);
    allR.push(n.position.x + w);
    allB.push(n.position.y + h);
  }

  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allR);
  const maxY = Math.max(...allB);

  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;

  const padding = 0.5; // inches on each side
  const titleReserve = 0.55; // leave room for the title text
  const availW = slideW - 2 * padding;
  const availH = slideH - padding - titleReserve - padding;

  const scaleX = availW / contentW;
  const scaleY = availH / contentH;
  const scale = Math.min(scaleX, scaleY);

  // Offset so the diagram is centered in the available area
  const drawnW = contentW * scale;
  const drawnH = contentH * scale;
  const offsetX = padding + (availW - drawnW) / 2;
  const offsetY = titleReserve + padding + (availH - drawnH) / 2;

  // Coordinate converters: canvas px -> slide inches
  const toX = (px: number) => offsetX + (px - minX) * scale;
  const toY = (px: number) => offsetY + (px - minY) * scale;
  const toW = (px: number) => px * scale;
  const toH = (px: number) => px * scale;

  // -- add edges as lines FIRST (below nodes) -------------------------
  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) continue;

    const sDefaults = getDefaultSize(sourceNode.data.shape);
    const tDefaults = getDefaultSize(targetNode.data.shape);
    const sw = sourceNode.data.width || sDefaults.w;
    const sh = sourceNode.data.height || sDefaults.h;
    const tw = targetNode.data.width || tDefaults.w;

    // Source: bottom-center; Target: top-center (default flow direction)
    const sx = toX(sourceNode.position.x) + toW(sw) / 2;
    const sy = toY(sourceNode.position.y) + toH(sh);
    const tx = toX(targetNode.position.x) + toW(tw) / 2;
    const ty = toY(targetNode.position.y);

    const edgeColorRaw = (edge.data?.color as string) || '#94a3b8';
    const edgeColor = edgeColorRaw.replace('#', '');

    const lineX = Math.min(sx, tx);
    const lineY = Math.min(sy, ty);
    const lineW = Math.abs(tx - sx) || 0.01;
    const lineH = Math.abs(ty - sy) || 0.01;

    slide.addShape('line', {
      x: lineX,
      y: lineY,
      w: lineW,
      h: lineH,
      line: {
        color: edgeColor,
        width: (edge.data?.thickness as number) || 1,
        endArrowType: 'triangle',
      },
      flipH: tx < sx,
      flipV: ty < sy,
    });

    // Edge label
    if (edge.data?.label) {
      const labelX = (sx + tx) / 2 - 0.4;
      const labelY = (sy + ty) / 2 - 0.12;
      slide.addText(edge.data.label as string, {
        x: labelX,
        y: labelY,
        w: 0.8,
        h: 0.24,
        fontSize: 8,
        color: edgeColor,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });
    }
  }

  // -- add nodes as native shapes or SVG images -----------------------
  for (const node of nodes) {
    const defaults = getDefaultSize(node.data.shape);
    const w = node.data.width || defaults.w;
    const h = node.data.height || defaults.h;
    const x = toX(node.position.x);
    const y = toY(node.position.y);
    const wInch = toW(w);
    const hInch = toH(h);

    const fillColor = (node.data.color || '#3b82f6').replace('#', '');
    const borderColorRaw = node.data.borderColor || 'transparent';
    const borderColor = borderColorRaw.replace('#', '');
    const textColor = (node.data.textColor || '#ffffff').replace('#', '');
    const label = node.data.label || '';

    // Font size: scale the canvas font (px) by the layout scale factor.
    // scale converts px to inches; multiply by 72 to get points.
    // Clamp to a readable range (6-36pt).
    const rawFontPt = (node.data.fontSize || 14) * scale * 72;
    const finalFontSize = Math.min(36, Math.max(6, Math.round(rawFontPt)));

    const pptxShapeName = PPTX_SHAPE_MAP[node.data.shape];
    const svgRenderer = SVG_SHAPE_RENDERERS[node.data.shape];

    if (pptxShapeName) {
      // ---------- Native PPTX shape with embedded text ---------------
      const lineOpts =
        borderColorRaw !== 'transparent'
          ? { color: borderColor, width: 1 }
          : undefined;

      slide.addText(label, {
        shape: pptxShapeName,
        x,
        y,
        w: wInch,
        h: hInch,
        fill: { color: fillColor },
        line: lineOpts,
        fontSize: finalFontSize,
        color: textColor,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
        rectRadius: node.data.shape === 'roundedRectangle' ? 0.1 : undefined,
      });
    } else if (svgRenderer) {
      // ---------- SVG image fallback for complex shapes ---------------
      const svgFill = node.data.color || '#3b82f6';
      const svgStroke =
        borderColorRaw !== 'transparent' ? borderColorRaw : 'none';
      const svgString = svgRenderer(
        Math.round(w),
        Math.round(h),
        svgFill,
        svgStroke,
      );
      const base64 = btoa(svgString);
      slide.addImage({
        data: `data:image/svg+xml;base64,${base64}`,
        x,
        y,
        w: wInch,
        h: hInch,
      });

      // Overlay text on top of the SVG image
      if (label) {
        slide.addText(label, {
          x,
          y,
          w: wInch,
          h: hInch,
          fontSize: finalFontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
        });
      }
    } else {
      // ---------- Unknown shape -> plain rectangle fallback ----------
      const lineOpts =
        borderColorRaw !== 'transparent'
          ? { color: borderColor, width: 1 }
          : undefined;

      slide.addText(label, {
        shape: 'rect' as SHAPE_NAME,
        x,
        y,
        w: wInch,
        h: hInch,
        fill: { color: fillColor },
        line: lineOpts,
        fontSize: finalFontSize,
        color: textColor,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });
    }
  }

  // -- speaker notes --------------------------------------------------
  if (includeNotes) {
    const noteText = nodes
      .map((n) => `${n.data.label} (${n.data.shape})`)
      .join('\n');
    slide.addNotes(noteText || 'FlowCraft diagram export');
  }

  // -- write file -----------------------------------------------------
  const fileData = (await pptx.write({ outputType: 'blob' })) as Blob;
  saveAs(fileData, getFilename('pptx'));
}

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------

export function exportAsJson(options: JsonExportOptions): void {
  const state = useFlowStore.getState();
  const styleState = useStyleStore.getState();

  const exportData: Record<string, unknown> = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes: state.nodes,
    edges: state.edges,
  };

  if (options.includeViewport) {
    exportData.viewport = state.viewport;
  }

  if (options.includeStyles) {
    exportData.styles = {
      activeStyleId: styleState.activeStyleId,
      activePaletteId: styleState.activePaletteId,
      darkMode: styleState.darkMode,
    };
  }

  if (options.includeMetadata) {
    exportData.metadata = {
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
    };
  }

  const indent = options.pretty ? 2 : undefined;
  const jsonString = JSON.stringify(exportData, null, indent);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  saveAs(blob, getFilename('json'));
}

// ---------------------------------------------------------------------------
// Clipboard helpers
// ---------------------------------------------------------------------------

export async function copyImageToClipboard(): Promise<void> {
  log.debug('Copying image to clipboard...');
  const element = getReactFlowElement();

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);
  log.debug('Image copied to clipboard');
}

export async function copySvgToClipboard(): Promise<void> {
  log.debug('Copying SVG to clipboard...');
  const element = getReactFlowElement();

  const dataUrl = await toSvg(element, {
    skipFonts: false,
  });

  // Convert data URL to SVG string
  const svgString = decodeURIComponent(dataUrl.split(',')[1]);
  await navigator.clipboard.writeText(svgString);
  log.debug('SVG copied to clipboard');
}

// ---------------------------------------------------------------------------
// Dispatcher -- runs the correct export based on format
// ---------------------------------------------------------------------------

export async function runExport(
  format: ExportFormat,
  options: Record<string, unknown>,
): Promise<void> {
  log.info(`Export started: ${format}`);
  try {
    switch (format) {
      case 'png':
        await exportAsPng(options as unknown as PngExportOptions);
        break;
      case 'jpg':
        await exportAsJpg(options as unknown as JpgExportOptions);
        break;
      case 'svg':
        await exportAsSvg(options as unknown as SvgExportOptions);
        break;
      case 'pdf':
        await exportAsPdf(options as unknown as PdfExportOptions);
        break;
      case 'pptx':
        await exportAsPptx(options as unknown as PptxExportOptions);
        break;
      case 'json':
        exportAsJson(options as unknown as JsonExportOptions);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    log.info(`Export completed: ${format}`);
  } catch (e) {
    log.error(`Export failed: ${format}`, e);
    throw e;
  }
}
