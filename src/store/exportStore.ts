import { create, type StoreApi } from 'zustand';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type ExportFormat = 'png' | 'svg' | 'jpg' | 'pdf' | 'pptx' | 'json' | 'csv';

export interface PngExportOptions {
  scale: number;
  transparentBackground: boolean;
  includeWatermark: boolean;
  padding: number;
}

export interface SvgExportOptions {
  includeStyles: boolean;
  embedFonts: boolean;
  padding: number;
}

export interface JpgExportOptions {
  quality: number;
  scale: number;
  backgroundColor: string;
  padding: number;
}

export interface PdfExportOptions {
  pageSize: 'a4' | 'a3' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  fitToPage: boolean;
  includeMetadata: boolean;
  margin: number;
}

export interface PptxExportOptions {
  slideSize: 'standard' | 'widescreen';
  includeNotes: boolean;
  oneSlidePerGroup: boolean;
}

export interface JsonExportOptions {
  pretty: boolean;
  includeViewport: boolean;
  includeStyles: boolean;
  includeMetadata: boolean;
}

export interface CsvExportOptions {
  delimiter: ',' | ';' | '\t';
  includeHeaders: boolean;
  exportNodes: boolean;
  exportEdges: boolean;
}

export interface ExportOptions {
  png: PngExportOptions;
  svg: SvgExportOptions;
  jpg: JpgExportOptions;
  pdf: PdfExportOptions;
  pptx: PptxExportOptions;
  json: JsonExportOptions;
  csv: CsvExportOptions;
}

export interface ExportState {
  // ---- state --------------------------------------------------
  lastFormat: ExportFormat;
  dialogOpen: boolean;
  exportInProgress: boolean;
  options: ExportOptions;

  // ---- actions ------------------------------------------------
  setFormat: (format: ExportFormat) => void;
  toggleDialog: () => void;
  setDialogOpen: (open: boolean) => void;
  setExportInProgress: (inProgress: boolean) => void;
  setExportOptions: <F extends ExportFormat>(
    format: F,
    opts: Partial<ExportOptions[F]>,
  ) => void;
}

// ---------------------------------------------------------------------------
// Default option values
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: ExportOptions = {
  png: {
    scale: 2,
    transparentBackground: false,
    includeWatermark: false,
    padding: 20,
  },
  svg: {
    includeStyles: true,
    embedFonts: true,
    padding: 20,
  },
  jpg: {
    quality: 0.92,
    scale: 2,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  pdf: {
    pageSize: 'a4',
    orientation: 'landscape',
    fitToPage: true,
    includeMetadata: true,
    margin: 20,
  },
  pptx: {
    slideSize: 'widescreen',
    includeNotes: false,
    oneSlidePerGroup: false,
  },
  json: {
    pretty: true,
    includeViewport: true,
    includeStyles: true,
    includeMetadata: true,
  },
  csv: {
    delimiter: ',',
    includeHeaders: true,
    exportNodes: true,
    exportEdges: true,
  },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExportStore = create<ExportState>()((set) => ({
  // -- initial state --------------------------------------------
  lastFormat: 'png',
  dialogOpen: false,
  exportInProgress: false,
  options: DEFAULT_OPTIONS,

  // -- actions --------------------------------------------------
  setFormat: (format) => set({ lastFormat: format }),

  toggleDialog: () => set((s) => ({ dialogOpen: !s.dialogOpen })),
  setDialogOpen: (open) => set({ dialogOpen: open }),

  setExportInProgress: (inProgress) => set({ exportInProgress: inProgress }),

  setExportOptions: (format, opts) =>
    set((s) => ({
      options: {
        ...s.options,
        [format]: { ...s.options[format], ...opts },
      },
    })),
}));

/** Direct access to the store (useful outside of React components) */
export const exportStore: StoreApi<ExportState> = useExportStore;
