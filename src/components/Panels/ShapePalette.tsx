import React, { useCallback, useState } from 'react';
import { Sparkles, ChevronsLeft, ChevronsRight, Rows3 } from 'lucide-react';
import { useStyleStore } from '../../store/styleStore';
import { useUIStore } from '../../store/uiStore';
import { useSwimlaneStore } from '../../store/swimlaneStore';
import FloatingIconPicker from './FloatingIconPicker';

// ---------------------------------------------------------------------------
// Shape definitions
// ---------------------------------------------------------------------------

interface ShapeDefinition {
  type: string;
  label: string;
  icon: React.ReactNode;
}

/** Small SVG icon factory for each shape */
const mkIcon = (children: React.ReactNode) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {children}
  </svg>
);

const shapes: ShapeDefinition[] = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    icon: mkIcon(
      <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'roundedRectangle',
    label: 'Rounded Rect',
    icon: mkIcon(
      <rect x="4" y="8" width="24" height="16" rx="8" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'diamond',
    label: 'Diamond',
    icon: mkIcon(
      <path d="M16 4 L28 16 L16 28 L4 16 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'circle',
    label: 'Circle',
    icon: mkIcon(
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'parallelogram',
    label: 'Parallelogram',
    icon: mkIcon(
      <path d="M8 24 L4 8 L24 8 L28 24 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'document',
    label: 'Document',
    icon: mkIcon(
      <path d="M5 6 L27 6 L27 23 C21 20 11 26 5 23 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'hexagon',
    label: 'Hexagon',
    icon: mkIcon(
      <path d="M10 4 L22 4 L28 16 L22 28 L10 28 L4 16 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'cloud',
    label: 'Cloud',
    icon: mkIcon(
      <path d="M8 24 C4 24 2 21 3 18 C2 15 4 12 8 12 C9 8 13 6 17 6 C21 6 24 8 25 12 C28 12 30 15 29 18 C30 21 28 24 24 24 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />,
    ),
  },
  {
    type: 'stickyNote',
    label: 'Sticky Note',
    icon: mkIcon(
      <>
        <rect x="4" y="4" width="24" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" fill="#fbbf24" fillOpacity="0.3" />
        <path d="M20 28 L28 20 L20 20 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" />
      </>,
    ),
  },
  {
    type: 'textbox',
    label: 'Text Box',
    icon: mkIcon(
      <>
        <rect x="4" y="8" width="24" height="16" rx="1" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" fill="none" />
        <text x="16" y="19" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="sans-serif">Aa</text>
      </>,
    ),
  },
];

// ---------------------------------------------------------------------------
// Arrow shape definitions
// ---------------------------------------------------------------------------

const arrowShapes: ShapeDefinition[] = [
  {
    type: 'blockArrow',
    label: 'Block Arrow',
    icon: mkIcon(
      <path
        d="M 4 12 L 18 12 L 18 7 L 28 16 L 18 25 L 18 20 L 4 20 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.1"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    type: 'chevronArrow',
    label: 'Chevron Arrow',
    icon: mkIcon(
      <path
        d="M 4 6 L 20 6 L 28 16 L 20 26 L 4 26 L 12 16 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.1"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    type: 'doubleArrow',
    label: 'Double Arrow',
    icon: mkIcon(
      <path
        d="M 10 7 L 4 16 L 10 25 L 10 20 L 22 20 L 22 25 L 28 16 L 22 7 L 22 12 L 10 12 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.1"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    type: 'circularArrow',
    label: 'Circular Arrow',
    icon: mkIcon(
      <>
        <path
          d="M 18 6 A 10 10 0 1 1 10 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <polygon
          points="6,3 12,8 5,11"
          fill="currentColor"
          fillOpacity="0.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </>,
    ),
  },
];

// ---------------------------------------------------------------------------
// Draggable shape item
// ---------------------------------------------------------------------------

interface ShapeItemProps {
  shape: ShapeDefinition;
  isSelected?: boolean;
  onSelect?: (type: string) => void;
}

const ShapeItem: React.FC<ShapeItemProps> = React.memo(({ shape, isSelected, onSelect }) => {
  const onDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/charthero-shape', shape.type);
      event.dataTransfer.effectAllowed = 'move';
    },
    [shape.type],
  );

  const handleClick = useCallback(() => {
    onSelect?.(shape.type);
  }, [shape.type, onSelect]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={handleClick}
      data-tooltip-right={shape.label}
      className={`
        relative flex items-center justify-center w-10 min-h-0 flex-1 max-h-10 rounded-lg cursor-grab
        transition-all duration-100 group
        hover:bg-primary/10 hover:scale-105 active:scale-95 active:cursor-grabbing
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-800/15' : ''}
      `}
    >
      <div className={`transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-text-muted group-hover:text-primary'}`}>
        {shape.icon}
      </div>
    </div>
  );
});

ShapeItem.displayName = 'ShapeItem';

// ---------------------------------------------------------------------------
// Main ShapePalette
// ---------------------------------------------------------------------------

const ShapePalette: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const shapePaletteOpen = useUIStore((s) => s.shapePaletteOpen);
  const toggleShapePalette = useUIStore((s) => s.toggleShapePalette);
  const selectedPaletteShape = useUIStore((s) => s.selectedPaletteShape);
  const setSelectedPaletteShape = useUIStore((s) => s.setSelectedPaletteShape);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const handleShapeSelect = useCallback((type: string) => {
    // Toggle: click same shape to deselect
    setSelectedPaletteShape(selectedPaletteShape === type ? null : type);
  }, [selectedPaletteShape, setSelectedPaletteShape]);

  return (
    <div className="relative flex shrink-0">
      {/* Panel content (only when open) */}
      {shapePaletteOpen && (
        <div
          className={`flex flex-col w-14 shrink-0 overflow-hidden ${
            darkMode ? 'bg-surface-alt-dark' : 'bg-white'
          }`}
        >
          {/* Shape list — no scroll, items shrink to fit */}
          <div className="flex-1 py-1">
            <div className="flex flex-col items-center gap-0 px-1 h-full">
              {shapes.map((shape) => (
                <ShapeItem key={shape.type} shape={shape} isSelected={selectedPaletteShape === shape.type} onSelect={handleShapeSelect} />
              ))}

              {/* Arrows section separator */}
              <div className="w-full border-t border-border dark:border-dk-border my-1" />

              {arrowShapes.map((shape) => (
                <ShapeItem key={shape.type} shape={shape} isSelected={selectedPaletteShape === shape.type} onSelect={handleShapeSelect} />
              ))}

              {/* Icons button */}
              <div className="w-full border-t border-border dark:border-dk-border my-1" />
              <button
                onClick={() => setIconPickerOpen(true)}
                data-tooltip-right="Icon Library"
                className="relative flex items-center justify-center w-10 min-h-0 flex-1 max-h-8 rounded-lg
                           transition-all duration-100
                           hover:bg-primary/10 text-text-muted hover:text-primary cursor-pointer"
              >
                <Sparkles size={16} />
              </button>

              {/* Containers section separator */}
              <div className="w-full border-t border-border dark:border-dk-border my-1" />

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/charthero-shape', 'group');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                data-tooltip-right="Group"
                className="relative flex items-center justify-center w-10 min-h-0 flex-1 max-h-10 rounded-lg cursor-grab
                           transition-all duration-100 group
                           hover:bg-primary/10 hover:scale-105 active:scale-95 active:cursor-grabbing"
              >
                <div className="text-text-muted group-hover:text-primary transition-colors">
                  <svg width="28" height="28" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <rect x="1" y="1" width="38" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                  </svg>
                </div>
              </div>

              {/* Swimlanes button */}
              <button
                onClick={() => {
                  const store = useSwimlaneStore.getState();
                  const hasLanes = store.config.horizontal.length > 0 || store.config.vertical.length > 0;
                  if (!hasLanes) {
                    store.setIsCreating(true);
                  }
                  useUIStore.getState().setActivePanelTab('lane');
                  if (!useUIStore.getState().propertiesPanelOpen) {
                    useUIStore.getState().togglePropertiesPanel();
                  }
                }}
                data-tooltip-right="Swimlanes"
                className="relative flex items-center justify-center w-10 min-h-0 flex-1 max-h-10 rounded-lg
                           transition-all duration-100
                           hover:bg-primary/10 text-text-muted hover:text-primary cursor-pointer"
              >
                <Rows3 size={26} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zero-width wrapper keeps toggle out of flex layout */}
      <div className="relative w-0 self-stretch shrink-0">
        <button
          onClick={toggleShapePalette}
          className={`
            absolute top-1/2 -translate-y-1/2 left-0 z-20
            flex items-center justify-center w-5 h-8
            rounded-r cursor-pointer
            transition-colors duration-150 opacity-40 hover:opacity-100
            ${darkMode
              ? 'text-dk-muted hover:bg-dk-hover/90 hover:text-dk-text'
              : 'text-slate-400 hover:bg-white/90 hover:text-slate-600 hover:shadow-sm'
            }
          `}
          data-tooltip-right={shapePaletteOpen ? 'Collapse palette' : 'Expand palette'}
        >
          {shapePaletteOpen
            ? <ChevronsLeft size={14} />
            : <ChevronsRight size={14} />
          }
        </button>
      </div>

      {/* Floating icon picker */}
      {iconPickerOpen && (
        <FloatingIconPicker onClose={() => setIconPickerOpen(false)} />
      )}
    </div>
  );
};

export default React.memo(ShapePalette);
