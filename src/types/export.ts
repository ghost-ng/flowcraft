// ---------------------------------------------------------------------------
// export.ts -- Export format options
// ---------------------------------------------------------------------------

// ---- Supported formats ----------------------------------------------------

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf' | 'pptx' | 'json';

// ---- Export scope ---------------------------------------------------------

export type ExportScope =
  | 'full'
  | 'selection'
  | 'visible'
  | 'lane'
  | 'chain';

// ---- Shared base options --------------------------------------------------

export interface ExportOptionsBase {
  /** What region of the diagram to export. */
  scope: ExportScope;
  /** Lane id when scope === 'lane'. */
  laneId?: string;
  /** Chain id when scope === 'chain'. */
  chainId?: string;
  /** Whether to include the canvas background. */
  includeBackground?: boolean;
  /** Padding around the exported content in pixels. */
  padding?: number;
}

// ---- PNG ------------------------------------------------------------------

export interface PngExportOptions extends ExportOptionsBase {
  format: 'png';
  /** Pixel density multiplier (1 = 72 dpi, 2 = 144 dpi, etc.). */
  pixelRatio?: number;
  /** Whether to produce a transparent background. */
  transparent?: boolean;
  /** Maximum dimension in pixels (width or height). */
  maxDimension?: number;
}

// ---- JPG ------------------------------------------------------------------

export interface JpgExportOptions extends ExportOptionsBase {
  format: 'jpg';
  /** JPEG quality 0 - 1. */
  quality?: number;
  /** Pixel density multiplier. */
  pixelRatio?: number;
  /** Background color (replaces transparency). */
  backgroundColor?: string;
  /** Maximum dimension in pixels. */
  maxDimension?: number;
}

// ---- SVG ------------------------------------------------------------------

export interface SvgExportOptions extends ExportOptionsBase {
  format: 'svg';
  /** Whether to inline fonts as data URIs. */
  inlineFonts?: boolean;
  /** Whether to embed images as base64 data URIs. */
  embedImages?: boolean;
  /** Whether to include interactive CSS classes. */
  includeStyles?: boolean;
}

// ---- PDF ------------------------------------------------------------------

export type PdfPageSize = 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid' | 'auto';
export type PdfOrientation = 'portrait' | 'landscape';

export interface PdfExportOptions extends ExportOptionsBase {
  format: 'pdf';
  pageSize?: PdfPageSize;
  orientation?: PdfOrientation;
  /** Margins in millimeters. */
  margins?: { top: number; right: number; bottom: number; left: number };
  /** Whether to include a title page. */
  titlePage?: boolean;
  /** Title text for the title page. */
  title?: string;
  /** Whether to fit the diagram to a single page. */
  fitToPage?: boolean;
}

// ---- PPTX -----------------------------------------------------------------

export interface PptxExportOptions extends ExportOptionsBase {
  format: 'pptx';
  /** Slide width in inches. */
  slideWidth?: number;
  /** Slide height in inches. */
  slideHeight?: number;
  /** Whether to include speaker notes with node metadata. */
  includeSpeakerNotes?: boolean;
  /** Whether to create one slide per layer. */
  slidePerLayer?: boolean;
  /** Master slide layout name. */
  masterLayout?: string;
}

// ---- JSON -----------------------------------------------------------------

export interface JsonExportOptions extends ExportOptionsBase {
  format: 'json';
  /** Whether to pretty-print the output. */
  prettyPrint?: boolean;
  /** Whether to include viewport / camera state. */
  includeViewport?: boolean;
}

// ---- Discriminated union of all export options ----------------------------

export type ExportOptions =
  | PngExportOptions
  | JpgExportOptions
  | SvgExportOptions
  | PdfExportOptions
  | PptxExportOptions
  | JsonExportOptions;
