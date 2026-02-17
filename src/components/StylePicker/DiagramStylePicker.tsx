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
            ? 'border-slate-700 hover:border-slate-500'
            : 'border-slate-200 hover:border-slate-400'
        }
        ${darkMode ? 'bg-slate-800' : 'bg-white'}
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
          darkMode ? 'text-slate-300' : 'text-slate-600'
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
            ? 'border-slate-700 hover:border-slate-500'
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
          darkMode ? 'text-slate-400' : 'text-slate-500'
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
      // Deselect palette when a style preset is chosen
      setPalette('');

      // Apply the style's colors/fonts to ALL existing nodes
      const style = diagramStyles[id];
      if (style) {
        const { nodes } = useFlowStore.getState();
        const colors = style.accentColors.length > 0 ? style.accentColors : [style.nodeDefaults.fill];
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const assignedColor = colors[i % colors.length];
          // Compute readable text colour for this specific fill
          const textColor = ensureReadableText(assignedColor, style.nodeDefaults.fontColor);
          useFlowStore.getState().updateNodeData(node.id, {
            color: assignedColor,
            borderColor: style.nodeDefaults.stroke,
            textColor,
            fontFamily: style.nodeDefaults.fontFamily,
            fontSize: style.nodeDefaults.fontSize,
            fontWeight: style.nodeDefaults.fontWeight,
          });
        }
        // Also update edge styles
        const { edges, updateEdgeData } = useFlowStore.getState();
        for (const edge of edges) {
          updateEdgeData(edge.id, {
            color: style.edgeDefaults.stroke,
          });
        }
      }
    },
    [setStyle, setPalette],
  );

  const handleSetPalette = useCallback(
    (id: string) => {
      setPalette(id);

      // Apply palette colors to existing nodes with readable text
      const palette = colorPalettes[id];
      if (palette && palette.colors.length > 0) {
        const { nodes } = useFlowStore.getState();
        const colors = palette.colors;
        nodes.forEach((node, idx) => {
          const assignedColor = colors[idx % colors.length];
          const textColor = ensureReadableText(
            assignedColor,
            node.data.textColor || '#ffffff',
          );
          useFlowStore.getState().updateNodeData(node.id, {
            color: assignedColor,
            textColor,
          });
        });
      }
    },
    [setPalette],
  );

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200'
        }
      `}
    >
      {/* Diagram Styles */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
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
            darkMode ? 'text-slate-400' : 'text-slate-500'
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
