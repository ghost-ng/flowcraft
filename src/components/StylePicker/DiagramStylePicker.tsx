import React, { useCallback, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';
import { useFlowStore } from '../../store/flowStore';
import { diagramStyles } from '../../styles/diagramStyles';
import { colorPalettes } from '../../styles/palettes';
import { ensureReadableText } from '../../utils/colorUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiagramStylePickerProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Style card
// ---------------------------------------------------------------------------

interface StyleCardProps {
  styleId: string;
  displayName: string;
  accentColors: string[];
  nodeColor: string;
  edgeColor: string;
  bgColor: string;
  isActive: boolean;
  darkMode: boolean;
  onClick: () => void;
}

const StyleCard: React.FC<StyleCardProps> = React.memo(
  ({ displayName, accentColors, nodeColor, bgColor, isActive, darkMode, onClick }) => (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center rounded-lg border p-2 transition-all duration-150 cursor-pointer
        ${isActive
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : darkMode
            ? 'border-dk-border hover:border-slate-500'
            : 'border-slate-200 hover:border-slate-400'
        }
        ${darkMode ? 'bg-dk-panel' : 'bg-white'}
      `}
    >
      {/* Mini preview */}
      <div
        className="w-full h-12 rounded mb-1.5 flex items-center justify-center gap-1 overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Simulated mini-nodes */}
        <div
          className="w-6 h-4 rounded-sm"
          style={{ backgroundColor: nodeColor }}
        />
        <div className="w-4 h-[2px]" style={{ backgroundColor: accentColors[0] || '#ccc' }} />
        <div
          className="w-6 h-4 rounded-sm"
          style={{ backgroundColor: accentColors[1] || nodeColor }}
        />
      </div>

      {/* Label */}
      <span
        className={`text-[11px] font-medium truncate w-full text-center ${
          darkMode ? 'text-dk-muted' : 'text-slate-600'
        }`}
      >
        {displayName}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
    </button>
  ),
);

StyleCard.displayName = 'StyleCard';

// ---------------------------------------------------------------------------
// Palette swatch
// ---------------------------------------------------------------------------

interface PaletteSwatchProps {
  paletteId: string;
  displayName: string;
  colors: string[];
  isActive: boolean;
  darkMode: boolean;
  onClick: () => void;
}

const PaletteSwatch: React.FC<PaletteSwatchProps> = React.memo(
  ({ displayName, colors, isActive, darkMode, onClick }) => (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-150 cursor-pointer
        ${isActive
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : darkMode
            ? 'border-dk-border hover:border-slate-500'
            : 'border-slate-200 hover:border-slate-400'
        }
      `}
    >
      <div className="flex gap-0.5">
        {colors.slice(0, 5).map((c, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <span
        className={`text-[10px] font-medium ${
          darkMode ? 'text-dk-muted' : 'text-slate-500'
        }`}
      >
        {displayName}
      </span>
    </button>
  ),
);

PaletteSwatch.displayName = 'PaletteSwatch';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DiagramStylePicker: React.FC<DiagramStylePickerProps> = ({ open, onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const activeStyleId = useStyleStore((s) => s.activeStyleId);
  const activePaletteId = useStyleStore((s) => s.activePaletteId);
  const setStyle = useStyleStore((s) => s.setStyle);
  const setPalette = useStyleStore((s) => s.setPalette);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSetStyle = useCallback(
    (id: string) => {
      setStyle(id);

      // Apply style formatting (fonts, borders, edges) but NOT fill colors.
      // Fill colors are controlled independently via the color palette.
      const style = diagramStyles[id];
      if (style) {
        const { nodes } = useFlowStore.getState();
        for (const node of nodes) {
          const textColor = ensureReadableText(
            node.data.color || style.nodeDefaults.fill,
            style.nodeDefaults.fontColor,
          );
          useFlowStore.getState().updateNodeData(node.id, {
            borderColor: style.nodeDefaults.stroke,
            textColor,
            fontFamily: style.nodeDefaults.fontFamily,
            fontSize: style.nodeDefaults.fontSize,
            fontWeight: style.nodeDefaults.fontWeight,
          });
        }
        // Update edge styles
        const { edges, updateEdgeData } = useFlowStore.getState();
        for (const edge of edges) {
          updateEdgeData(edge.id, {
            color: style.edgeDefaults.stroke,
          });
        }
      }
    },
    [setStyle],
  );

  const handleSetPalette = useCallback(
    (id: string) => {
      // Only update the active palette — this changes the quick-change
      // color swatches in context menus and keyboard shortcuts (1-9).
      // Existing node colors are NOT modified.
      setPalette(id);
    },
    [setPalette],
  );

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip close if clicking the toggle button (avoids close-then-reopen race)
      if (target.closest('[data-style-picker-toggle]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to avoid the opening click triggering close immediately
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const styleEntries = Object.entries(diagramStyles);
  const paletteEntries = Object.entries(colorPalettes);

  return (
    <div
      ref={panelRef}
      className={`
        absolute top-12 right-4 w-80 max-h-[70vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col z-50
        ${darkMode
          ? 'bg-dk-panel border-dk-border'
          : 'bg-white border-slate-200'
        }
      `}
    >
      {/* Diagram Styles */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            darkMode ? 'text-dk-muted' : 'text-slate-500'
          }`}
        >
          Diagram Style
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {styleEntries.map(([id, style]) => (
            <StyleCard
              key={id}
              styleId={id}
              displayName={style.displayName}
              accentColors={style.accentColors}
              nodeColor={style.nodeDefaults.fill}
              edgeColor={style.edgeDefaults.stroke}
              bgColor={style.canvas.background}
              isActive={id === activeStyleId}
              darkMode={darkMode}
              onClick={() => handleSetStyle(id)}
            />
          ))}
        </div>

        {/* Color Palettes */}
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            darkMode ? 'text-dk-muted' : 'text-slate-500'
          }`}
        >
          Color Palette
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {paletteEntries.map(([id, palette]) => (
            <PaletteSwatch
              key={id}
              paletteId={id}
              displayName={palette.displayName}
              colors={palette.colors}
              isActive={id === activePaletteId}
              darkMode={darkMode}
              onClick={() => handleSetPalette(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(DiagramStylePicker);
