// ---------------------------------------------------------------------------
// ExportDialog.tsx -- Full export modal for FlowCraft
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  FileCode,
  FileText,
  Presentation,
  Braces,
  Loader2,
  Check,
  AlertCircle,
  Maximize2,
  MousePointerSquareDashed,
} from 'lucide-react';
import { toPng } from 'html-to-image';

import {
  useExportStore,
  type ExportFormat,
} from '../../store/exportStore';
import { useFlowStore } from '../../store/flowStore';
import { useStyleStore } from '../../store/styleStore';
import { getReactFlowInstance } from '../Canvas/FlowCanvas';
import {
  runExport,
  getReactFlowElement,
  estimateFileSize,
} from '../../utils/exportUtils';
import { log } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Format tab config
// ---------------------------------------------------------------------------

interface FormatTab {
  id: ExportFormat;
  label: string;
  icon: React.ReactNode;
}

const FORMAT_TABS: FormatTab[] = [
  { id: 'png', label: 'PNG', icon: <ImageIcon size={14} /> },
  { id: 'jpg', label: 'JPG', icon: <ImageIcon size={14} /> },
  { id: 'svg', label: 'SVG', icon: <FileCode size={14} /> },
  { id: 'pdf', label: 'PDF', icon: <FileText size={14} /> },
  { id: 'pptx', label: 'PPTX', icon: <Presentation size={14} /> },
  { id: 'json', label: 'JSON', icon: <Braces size={14} /> },
];

// ---------------------------------------------------------------------------
// Options panels
// ---------------------------------------------------------------------------

const PngOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.png);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Scale */}
      <OptionGroup label="Scale" darkMode={darkMode}>
        <select
          value={options.scale}
          onChange={(e) => setOpts('png', { scale: Number(e.target.value) })}
          className={selectClass(darkMode)}
        >
          <option value={1}>1x (Standard)</option>
          <option value={2}>2x (Retina)</option>
          <option value={3}>3x (High DPI)</option>
          <option value={4}>4x (Ultra)</option>
        </select>
      </OptionGroup>

      {/* Transparent background */}
      <OptionGroup label="Background" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.transparentBackground}
            onChange={(e) =>
              setOpts('png', { transparentBackground: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Transparent background
          </span>
        </label>
      </OptionGroup>

      {/* Padding */}
      <OptionGroup label="Padding" darkMode={darkMode}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={options.padding}
            onChange={(e) => setOpts('png', { padding: Number(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className={`text-sm w-10 text-right ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {options.padding}px
          </span>
        </div>
      </OptionGroup>
    </div>
  );
};

const JpgOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.jpg);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Scale */}
      <OptionGroup label="Scale" darkMode={darkMode}>
        <select
          value={options.scale}
          onChange={(e) => setOpts('jpg', { scale: Number(e.target.value) })}
          className={selectClass(darkMode)}
        >
          <option value={1}>1x (Standard)</option>
          <option value={2}>2x (Retina)</option>
          <option value={3}>3x (High DPI)</option>
          <option value={4}>4x (Ultra)</option>
        </select>
      </OptionGroup>

      {/* Quality */}
      <OptionGroup label="Quality" darkMode={darkMode}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={Math.round(options.quality * 100)}
            onChange={(e) =>
              setOpts('jpg', { quality: Number(e.target.value) / 100 })
            }
            className="flex-1 accent-blue-500"
          />
          <span className={`text-sm w-12 text-right ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {Math.round(options.quality * 100)}%
          </span>
        </div>
      </OptionGroup>

      {/* Background color */}
      <OptionGroup label="Background Color" darkMode={darkMode}>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={options.backgroundColor}
            onChange={(e) =>
              setOpts('jpg', { backgroundColor: e.target.value })
            }
            className="w-8 h-8 rounded border-0 cursor-pointer"
          />
          <span className={`text-sm font-mono ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {options.backgroundColor}
          </span>
        </div>
      </OptionGroup>

      {/* Padding */}
      <OptionGroup label="Padding" darkMode={darkMode}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={options.padding}
            onChange={(e) => setOpts('jpg', { padding: Number(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className={`text-sm w-10 text-right ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {options.padding}px
          </span>
        </div>
      </OptionGroup>
    </div>
  );
};

const SvgOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.svg);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Embed fonts */}
      <OptionGroup label="Fonts" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.embedFonts}
            onChange={(e) => setOpts('svg', { embedFonts: e.target.checked })}
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Embed fonts in SVG
          </span>
        </label>
      </OptionGroup>

      {/* Include styles */}
      <OptionGroup label="Styles" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeStyles}
            onChange={(e) =>
              setOpts('svg', { includeStyles: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Include CSS styles
          </span>
        </label>
      </OptionGroup>

      {/* Padding */}
      <OptionGroup label="Padding" darkMode={darkMode}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={options.padding}
            onChange={(e) => setOpts('svg', { padding: Number(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className={`text-sm w-10 text-right ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {options.padding}px
          </span>
        </div>
      </OptionGroup>
    </div>
  );
};

const PdfOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.pdf);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Page size */}
      <OptionGroup label="Page Size" darkMode={darkMode}>
        <select
          value={options.pageSize}
          onChange={(e) =>
            setOpts('pdf', {
              pageSize: e.target.value as 'a4' | 'a3' | 'letter' | 'legal',
            })
          }
          className={selectClass(darkMode)}
        >
          <option value="a4">A4 (210 x 297 mm)</option>
          <option value="a3">A3 (297 x 420 mm)</option>
          <option value="letter">Letter (8.5 x 11 in)</option>
          <option value="legal">Legal (8.5 x 14 in)</option>
        </select>
      </OptionGroup>

      {/* Orientation */}
      <OptionGroup label="Orientation" darkMode={darkMode}>
        <div className="flex gap-2">
          <PillButton
            active={options.orientation === 'portrait'}
            onClick={() => setOpts('pdf', { orientation: 'portrait' })}
            darkMode={darkMode}
          >
            Portrait
          </PillButton>
          <PillButton
            active={options.orientation === 'landscape'}
            onClick={() => setOpts('pdf', { orientation: 'landscape' })}
            darkMode={darkMode}
          >
            Landscape
          </PillButton>
        </div>
      </OptionGroup>

      {/* Fit to page */}
      <OptionGroup label="Fit" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.fitToPage}
            onChange={(e) => setOpts('pdf', { fitToPage: e.target.checked })}
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Fit diagram to page
          </span>
        </label>
      </OptionGroup>

      {/* Margins */}
      <OptionGroup label="Margins" darkMode={darkMode}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={50}
            value={options.margin}
            onChange={(e) => setOpts('pdf', { margin: Number(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className={`text-sm w-12 text-right ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            {options.margin}mm
          </span>
        </div>
      </OptionGroup>
    </div>
  );
};

const PptxOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.pptx);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Slide size */}
      <OptionGroup label="Slide Size" darkMode={darkMode}>
        <div className="flex gap-2">
          <PillButton
            active={options.slideSize === 'standard'}
            onClick={() => setOpts('pptx', { slideSize: 'standard' })}
            darkMode={darkMode}
          >
            Standard (4:3)
          </PillButton>
          <PillButton
            active={options.slideSize === 'widescreen'}
            onClick={() => setOpts('pptx', { slideSize: 'widescreen' })}
            darkMode={darkMode}
          >
            Widescreen (16:9)
          </PillButton>
        </div>
      </OptionGroup>

      {/* Title slide */}
      <OptionGroup label="Title Slide" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.oneSlidePerGroup}
            onChange={(e) =>
              setOpts('pptx', { oneSlidePerGroup: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Include title slide
          </span>
        </label>
      </OptionGroup>

      {/* Include notes */}
      <OptionGroup label="Speaker Notes" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeNotes}
            onChange={(e) =>
              setOpts('pptx', { includeNotes: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Include node info as notes
          </span>
        </label>
      </OptionGroup>
    </div>
  );
};

const JsonOptionsPanel: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const options = useExportStore((s) => s.options.json);
  const setOpts = useExportStore((s) => s.setExportOptions);

  return (
    <div className="space-y-4">
      {/* Pretty print */}
      <OptionGroup label="Formatting" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.pretty}
            onChange={(e) => setOpts('json', { pretty: e.target.checked })}
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Pretty print (indented)
          </span>
        </label>
      </OptionGroup>

      {/* Include viewport */}
      <OptionGroup label="Viewport" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeViewport}
            onChange={(e) =>
              setOpts('json', { includeViewport: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Include viewport state
          </span>
        </label>
      </OptionGroup>

      {/* Include styles */}
      <OptionGroup label="Styles" darkMode={darkMode}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeStyles}
            onChange={(e) =>
              setOpts('json', { includeStyles: e.target.checked })
            }
            className="rounded accent-blue-500"
          />
          <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-gray-600'}`}>
            Include style settings
          </span>
        </label>
      </OptionGroup>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function selectClass(darkMode: boolean): string {
  return `w-full px-3 py-1.5 rounded-md text-sm border transition-colors ${
    darkMode
      ? 'bg-dk-hover border-dk-border text-dk-text focus:border-blue-400'
      : 'bg-white border-gray-300 text-gray-700 focus:border-blue-500'
  } outline-none focus:ring-1 focus:ring-blue-500/30`;
}

const OptionGroup: React.FC<{
  label: string;
  darkMode: boolean;
  children: React.ReactNode;
}> = ({ label, darkMode, children }) => (
  <div>
    <label
      className={`block text-xs font-medium mb-1.5 ${
        darkMode ? 'text-dk-muted' : 'text-gray-500'
      }`}
    >
      {label}
    </label>
    {children}
  </div>
);

const PillButton: React.FC<{
  active: boolean;
  onClick: () => void;
  darkMode: boolean;
  children: React.ReactNode;
}> = ({ active, onClick, darkMode, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : darkMode
          ? 'bg-dk-hover text-dk-muted hover:bg-dk-border'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// Main ExportDialog component
// ---------------------------------------------------------------------------

const ExportDialog: React.FC = () => {
  const dialogOpen = useExportStore((s) => s.dialogOpen);
  const setDialogOpen = useExportStore((s) => s.setDialogOpen);
  const lastFormat = useExportStore((s) => s.lastFormat);
  const setFormat = useExportStore((s) => s.setFormat);
  const exportInProgress = useExportStore((s) => s.exportInProgress);
  const setExportInProgress = useExportStore((s) => s.setExportInProgress);
  const options = useExportStore((s) => s.options);

  const darkMode = useStyleStore((s) => s.darkMode);
  const nodeCount = useFlowStore((s) => s.nodes.length);
  const edgeCount = useFlowStore((s) => s.edges.length);
  // Scope: 'all' fits the entire diagram before capturing; 'selection' captures as-is
  const [scope, setScope] = useState<'all' | 'selection'>('all');
  // Whether to include grid lines in the exported image (off by default)
  const [includeGrid, setIncludeGrid] = useState(false);
  // Whether to include minimap in the exported image (off by default)
  const [includeMinimap, setIncludeMinimap] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);



  // Serialize current format options for dependency tracking
  const currentOpts = options[lastFormat];
  const optsKey = JSON.stringify(currentOpts);

  // Generate preview thumbnail (debounced on option changes)
  useEffect(() => {
    if (!dialogOpen) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      // Temporarily hide grid/minimap if user unchecked their toggles
      const gridEl = document.querySelector<HTMLElement>('.react-flow__background');
      const minimapEl = document.querySelector<HTMLElement>('.react-flow__minimap');
      const gridWas = gridEl ? gridEl.style.display : '';
      const minimapWas = minimapEl ? minimapEl.style.display : '';
      if (!includeGrid && gridEl) gridEl.style.display = 'none';
      if (!includeMinimap && minimapEl) minimapEl.style.display = 'none';

      // For scope='all', fitView so preview matches the exported output
      const rf = getReactFlowInstance();
      let savedVP: { x: number; y: number; zoom: number } | null = null;
      if (scope === 'all' && rf) {
        savedVP = rf.getViewport();
        rf.fitView({ padding: 0.05 });
        await new Promise((r) => setTimeout(r, 100));
      }

      try {
        const element = getReactFlowElement();
        // Use transparent bg if PNG with transparentBackground checked
        const bgColor =
          lastFormat === 'png' && (currentOpts as { transparentBackground?: boolean }).transparentBackground
            ? undefined
            : lastFormat === 'jpg'
              ? (currentOpts as { backgroundColor?: string }).backgroundColor || '#ffffff'
              : darkMode ? '#253345' : '#ffffff';

        const url = await toPng(element, {
          pixelRatio: 0.5,
          backgroundColor: bgColor,
        });
        if (!cancelled) setPreviewUrl(url);
      } catch (e) {
        log.warn('Export preview generation failed', e);
        if (!cancelled) setPreviewUrl(null);
      } finally {
        if (gridEl) gridEl.style.display = gridWas;
        if (minimapEl) minimapEl.style.display = minimapWas;
        if (savedVP && rf) rf.setViewport(savedVP);
      }
    }, 200); // 200ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dialogOpen, darkMode, includeGrid, includeMinimap, scope, lastFormat, optsKey]);

  // Close on Escape
  useEffect(() => {
    if (!dialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, setDialogOpen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        setDialogOpen(false);
      }
    },
    [setDialogOpen],
  );

  // Handle export -- when scope is 'all', fitView before capturing so
  // the entire diagram is visible, then restore the original viewport.
  const handleExport = useCallback(async () => {
    setExportInProgress(true);
    setExportStatus('idle');
    setErrorMessage('');

    const rf = getReactFlowInstance();
    let savedViewport: { x: number; y: number; zoom: number } | null = null;

    // Temporarily hide grid/minimap if unchecked
    const gridEl = document.querySelector<HTMLElement>('.react-flow__background');
    const minimapEl = document.querySelector<HTMLElement>('.react-flow__minimap');
    const gridWas = gridEl ? gridEl.style.display : '';
    const minimapWas = minimapEl ? minimapEl.style.display : '';
    if (!includeGrid && gridEl) gridEl.style.display = 'none';
    if (!includeMinimap && minimapEl) minimapEl.style.display = 'none';

    try {
      // Fit the entire diagram into view before capture
      if (scope === 'all' && rf) {
        savedViewport = rf.getViewport();
        rf.fitView({ padding: 0.05 });
        // Wait for the DOM to re-render at the new viewport
        await new Promise((r) => setTimeout(r, 200));
      }

      await runExport(lastFormat, options[lastFormat] as unknown as Record<string, unknown>);
      setExportStatus('success');
      setTimeout(() => {
        setDialogOpen(false);
        setExportStatus('idle');
      }, 1200);
    } catch (err) {
      setExportStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Export failed. Please try again.',
      );
    } finally {
      // Restore the grid/minimap visibility
      if (gridEl) gridEl.style.display = gridWas;
      if (minimapEl) minimapEl.style.display = minimapWas;
      // Restore the original viewport so the user's view is unchanged
      if (savedViewport && rf) {
        rf.setViewport(savedViewport);
      }
      setExportInProgress(false);
    }
  }, [lastFormat, options, scope, includeGrid, includeMinimap, setExportInProgress, setDialogOpen]);

  // Estimated file size
  const scale =
    lastFormat === 'png'
      ? options.png.scale
      : lastFormat === 'jpg'
        ? options.jpg.scale
        : 2;
  const estSize = estimateFileSize(lastFormat, nodeCount, edgeCount, scale);

  if (!dialogOpen) return null;

  // Determine which options panel to render
  const currentTab = lastFormat === 'csv' ? 'json' : lastFormat;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        className={`
          relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl border overflow-hidden
          ${darkMode
            ? 'bg-dk-panel border-dk-border'
            : 'bg-white border-gray-200'
          }
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? 'border-dk-border' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Download size={18} className="text-blue-500" />
            <h2
              className={`text-lg font-semibold ${
                darkMode ? 'text-dk-text' : 'text-gray-900'
              }`}
            >
              Export Diagram
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className={`p-1 rounded-md transition-colors ${
              darkMode
                ? 'hover:bg-dk-hover text-dk-muted'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Format tabs */}
        <div
          className={`flex gap-1 px-6 pt-4 pb-2 ${
            darkMode ? 'border-dk-border' : 'border-gray-200'
          }`}
        >
          {FORMAT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFormat(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                lastFormat === tab.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : darkMode
                    ? 'bg-dk-hover text-dk-muted hover:bg-dk-border'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scope selector */}
        <div
          className={`flex items-center gap-3 px-6 pb-2 ${
            darkMode ? 'border-dk-border' : 'border-gray-200'
          }`}
        >
          <span
            className={`text-xs font-medium ${
              darkMode ? 'text-dk-muted' : 'text-gray-500'
            }`}
          >
            Scope
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                scope === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : darkMode
                    ? 'bg-dk-hover text-dk-muted hover:bg-dk-border'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Maximize2 size={12} />
              Entire Diagram
            </button>
            <button
              type="button"
              onClick={() => setScope('selection')}
              title="Export the current viewport (what you see)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                scope === 'selection'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : darkMode
                    ? 'bg-dk-hover text-dk-muted hover:bg-dk-border'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MousePointerSquareDashed size={12} />
              Current View
            </button>
          </div>

          {/* Grid & minimap toggles -- only for image formats */}
          {lastFormat !== 'json' && lastFormat !== 'pptx' && (
            <div className="flex items-center gap-4 ml-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <span className={`text-xs ${darkMode ? 'text-dk-muted' : 'text-gray-500'}`}>
                  Include grid
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMinimap}
                  onChange={(e) => setIncludeMinimap(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <span className={`text-xs ${darkMode ? 'text-dk-muted' : 'text-gray-500'}`}>
                  Include minimap
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Body: Preview + Options */}
        <div className="flex px-6 py-4 gap-6 min-h-[300px]">
          {/* Left: Preview */}
          <div
            className={`flex-1 flex items-center justify-center rounded-lg border overflow-hidden ${
              darkMode
                ? 'bg-dk border-dk-border'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Diagram preview"
                className="max-w-full max-h-[260px] object-contain p-2"
              />
            ) : (
              <div
                className={`text-sm ${
                  darkMode ? 'text-dk-faint' : 'text-gray-400'
                }`}
              >
                {nodeCount === 0
                  ? 'No nodes to export'
                  : 'Generating preview...'}
              </div>
            )}
          </div>

          {/* Right: Options */}
          <div className="w-56 shrink-0 overflow-y-auto max-h-[300px]">
            {currentTab === 'png' && <PngOptionsPanel darkMode={darkMode} />}
            {currentTab === 'jpg' && <JpgOptionsPanel darkMode={darkMode} />}
            {currentTab === 'svg' && <SvgOptionsPanel darkMode={darkMode} />}
            {currentTab === 'pdf' && <PdfOptionsPanel darkMode={darkMode} />}
            {currentTab === 'pptx' && <PptxOptionsPanel darkMode={darkMode} />}
            {currentTab === 'json' && <JsonOptionsPanel darkMode={darkMode} />}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3 border-t ${
            darkMode ? 'border-dk-border' : 'border-gray-200'
          }`}
        >
          {/* File size estimate + status */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs ${
                darkMode ? 'text-dk-muted' : 'text-gray-500'
              }`}
            >
              Est. size: <strong>{estSize}</strong>
            </span>
            <span
              className={`text-xs ${
                darkMode ? 'text-dk-faint' : 'text-gray-400'
              }`}
            >
              {nodeCount} nodes, {edgeCount} connectors
            </span>

            {exportStatus === 'success' && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check size={14} /> Exported
              </span>
            )}
            {exportStatus === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={14} /> {errorMessage || 'Failed'}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-dk-muted hover:bg-dk-hover'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportInProgress || nodeCount === 0}
              className={`
                flex items-center gap-2 px-5 py-1.5 rounded-md text-sm font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700
              `}
            >
              {exportInProgress ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export {lastFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExportDialog);
