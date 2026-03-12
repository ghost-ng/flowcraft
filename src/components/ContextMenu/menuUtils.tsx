// ---------------------------------------------------------------------------
// menuUtils.tsx -- Shared context-menu overflow utilities
//
// useMenuPosition: hook that clamps a fixed-position menu to the viewport
// SubMenu: wrapper that auto-flips submenus when they overflow the viewport
// ---------------------------------------------------------------------------

import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PaintBucket, Type, RotateCcw } from 'lucide-react';

const PAD = 8;

/** Persists the sidebar drag offset across open/close cycles (session only). */
let _lastSidebarDragOffset = 0;

// ---------------------------------------------------------------------------
// useMenuPosition
// ---------------------------------------------------------------------------

/**
 * Hook that adjusts a fixed-position menu to stay within viewport bounds.
 * Measures actual rendered size via useLayoutEffect (no flicker).
 */
export function useMenuPosition(
  x: number,
  y: number,
  menuRef: React.RefObject<HTMLDivElement | null>,
): React.CSSProperties {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 9999,
  });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const newLeft = rect.right > vw - PAD ? Math.max(PAD, vw - rect.width - PAD) : x;
    const newTop = rect.bottom > vh - PAD ? Math.max(PAD, vh - rect.height - PAD) : y;

    if (newTop !== y || newLeft !== x) {
      setStyle({ position: 'fixed', top: newTop, left: newLeft, zIndex: 9999 });
    }
  }, [x, y]);

  return style;
}

// ---------------------------------------------------------------------------
// SubMenu
// ---------------------------------------------------------------------------

/**
 * Submenu wrapper that auto-detects viewport overflow and flips horizontally
 * and/or vertically to stay fully visible.
 */
export const SubMenu: React.FC<{
  darkMode: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ darkMode, className = '', style: styleProp, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [flipV, setFlipV] = useState(false);
  const [flipH, setFlipH] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const needFlipV = rect.bottom > window.innerHeight - PAD;
    const needFlipH = rect.right > window.innerWidth - PAD;
    if (needFlipV || needFlipH) {
      setFlipV(needFlipV);
      setFlipH(needFlipH);
    }
  }, []);

  return (
    <div
      ref={ref}
      style={styleProp}
      className={`
        absolute ${flipV ? 'bottom-0' : 'top-0'} ${flipH ? 'right-full mr-1' : 'left-full ml-1'}
        rounded-lg shadow-xl border
        ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        ${className}
      `}
    >
      {/* Invisible bridge covering the gap between parent menu and this submenu */}
      <div
        className={`absolute top-0 bottom-0 ${flipH ? 'left-full' : 'right-full'} w-3`}
        style={{ pointerEvents: 'auto' }}
      />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ColorSwatchSidebar
// ---------------------------------------------------------------------------

/**
 * Floating color swatch grid that sits beside a context menu.
 * Contains fill color, text color columns with fill opacity slider and text size slider.
 * Vertically draggable, clamped to the menu's top/bottom bounds.
 */
export const ColorSwatchSidebar: React.FC<{
  darkMode: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  colors: string[];
  /** Fill color callback */
  onSelectFillColor: (color: string) => void;
  /** Text color callback */
  onSelectTextColor: (color: string) => void;
  /** Fill opacity 0-1, shown as vertical slider */
  fillOpacity?: number;
  onFillOpacityChange?: (v: number) => void;
  /** Current font size for the text size slider */
  fontSize?: number;
  onFontSizeChange?: (v: number) => void;
  /** Reset fill color to theme default */
  onResetFill?: () => void;
  /** Reset text color to theme default */
  onResetText?: () => void;
  /** Reset font size to default */
  onResetFontSize?: () => void;
  /** Max font size (proportional to node size) */
  maxFontSize?: number;
}> = ({ darkMode, menuRef, colors, onSelectFillColor, onSelectTextColor, fillOpacity, onFillOpacityChange, fontSize, onFontSizeChange, onResetFill, onResetText, onResetFontSize, maxFontSize }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(_lastSidebarDragOffset);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);

  const compute = useCallback(() => {
    const menu = menuRef.current;
    const panel = panelRef.current;
    if (!menu || !panel) return;
    const menuRect = menu.getBoundingClientRect();
    const panelW = panel.offsetWidth;
    const gap = 6;

    // Default: left of menu
    let left = menuRect.left - panelW - gap;
    // If overflows left edge, place to the right
    if (left < PAD) {
      left = menuRect.right + gap;
    }
    // If right side also overflows, fall back to left edge
    if (left + panelW > window.innerWidth - PAD) {
      left = PAD;
    }

    let top = menuRect.top + dragOffset;
    const panelH = panel.offsetHeight;
    // Clamp to menu's top/bottom bounds
    const minTop = menuRect.top;
    const maxTop = menuRect.bottom - panelH;
    if (maxTop > minTop) {
      top = Math.max(minTop, Math.min(maxTop, top));
    } else {
      top = minTop;
    }
    // Also clamp to viewport
    if (top + panelH > window.innerHeight - PAD) {
      top = window.innerHeight - panelH - PAD;
    }
    if (top < PAD) top = PAD;

    setPos({ top, left });
  }, [menuRef, dragOffset]);

  useLayoutEffect(() => {
    requestAnimationFrame(compute);
  }, [compute]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartOffset.current = dragOffset;

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const dy = me.clientY - dragStartY.current;
      const next = dragStartOffset.current + dy;
      setDragOffset(next);
      _lastSidebarDragOffset = next;
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [dragOffset]);

  return createPortal(
    <div
      ref={panelRef}
      data-color-sidebar
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 10000,
        opacity: pos ? 1 : 0,
        transition: dragging.current ? 'none' : 'opacity 0.1s',
      }}
      className={`rounded-lg shadow-lg border p-1.5 ${
        darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'
      }`}
    >
      {/* Drag handle */}
      <div
        className={`flex items-center justify-center mb-1 cursor-ns-resize rounded py-0.5 ${darkMode ? 'hover:bg-dk-hover' : 'hover:bg-slate-50'}`}
        onMouseDown={handleDragStart}
      >
        <div className={`w-6 h-0.5 rounded-full ${darkMode ? 'bg-dk-faint' : 'bg-slate-300'}`} />
      </div>

      {/* Column height: icon(16) + N×swatch(16) + (N)×gap(4) + reset(16) */}
      {(() => {
        const n = colors.length;
        const colH = 16 + n * 16 + n * 4 + 16;        // total color column height
        const sliderH = colH - 18;                       // minus the paddingTop offset
        const fontSliderH = colH - 16 - 4 - 16 - 4;     // minus label(16) + gap + reset(16) + gap
        return (
          <div className="flex items-start gap-1">
            {/* Fill opacity slider */}
            {onFillOpacityChange && (
              <div className="flex flex-col items-center" style={{ paddingTop: 18 }} data-tooltip="Fill Opacity">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((fillOpacity ?? 1) * 100)}
                  onChange={(e) => { e.stopPropagation(); onFillOpacityChange(Number(e.target.value) / 100); }}
                  className="accent-primary cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    width: 14,
                    height: sliderH,
                  }}
                />
              </div>
            )}
            {/* Fill column */}
            <div className="flex flex-col items-center gap-1">
              <span className={`flex items-center justify-center w-4 h-4 ${darkMode ? 'text-dk-faint' : 'text-slate-400'}`} data-tooltip="Fill Color">
                <PaintBucket size={10} />
              </span>
              {colors.map((color) => (
                <button
                  key={`fill-${color}`}
                  onClick={(e) => { e.stopPropagation(); onSelectFillColor(color); }}
                  className="w-4 h-4 rounded border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
              {onResetFill && (
                <button
                  onClick={(e) => { e.stopPropagation(); onResetFill(); }}
                  className={`flex items-center justify-center w-4 h-4 rounded cursor-pointer transition-colors ${darkMode ? 'text-dk-faint hover:text-dk-text hover:bg-dk-hover' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  data-tooltip="Reset Fill"
                >
                  <RotateCcw size={9} />
                </button>
              )}
            </div>
            {/* Text color column */}
            <div className="flex flex-col items-center gap-1">
              <span className={`flex items-center justify-center w-4 h-4 ${darkMode ? 'text-dk-faint' : 'text-slate-400'}`} data-tooltip="Text Color">
                <Type size={10} />
              </span>
              {colors.map((color) => (
                <button
                  key={`text-${color}`}
                  onClick={(e) => { e.stopPropagation(); onSelectTextColor(color); }}
                  className="w-4 h-4 rounded border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
              {onResetText && (
                <button
                  onClick={(e) => { e.stopPropagation(); onResetText(); }}
                  className={`flex items-center justify-center w-4 h-4 rounded cursor-pointer transition-colors ${darkMode ? 'text-dk-faint hover:text-dk-text hover:bg-dk-hover' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  data-tooltip="Reset Text Color"
                >
                  <RotateCcw size={9} />
                </button>
              )}
            </div>
            {/* Text size slider */}
            {onFontSizeChange && (
              <div className="flex flex-col items-center gap-1" data-tooltip="Text Size">
                <span className={`text-[9px] tabular-nums flex items-center justify-center w-4 h-4 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  {fontSize ?? 14}
                </span>
                <input
                  type="range"
                  min={6}
                  max={maxFontSize ?? 32}
                  value={Math.min(fontSize ?? 14, maxFontSize ?? 32)}
                  onChange={(e) => { e.stopPropagation(); onFontSizeChange(Number(e.target.value)); }}
                  className="accent-primary cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    width: 14,
                    height: fontSliderH,
                  }}
                />
                {onResetFontSize && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResetFontSize(); }}
                    className={`flex items-center justify-center w-4 h-4 rounded cursor-pointer transition-colors ${
                      (fontSize ?? 14) !== 14
                        ? darkMode ? 'text-dk-faint hover:text-dk-text hover:bg-dk-hover' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        : 'opacity-0 pointer-events-none'
                    }`}
                    data-tooltip="Reset Size"
                  >
                    <RotateCcw size={9} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>,
    document.body,
  );
};

// ---------------------------------------------------------------------------
// Legacy single-column sidebar for edge context menu
// ---------------------------------------------------------------------------
export const EdgeColorSidebar: React.FC<{
  darkMode: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  colors: string[];
  onSelectColor: (color: string) => void;
}> = ({ darkMode, menuRef, colors, onSelectColor }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const compute = useCallback(() => {
    const menu = menuRef.current;
    const panel = panelRef.current;
    if (!menu || !panel) return;
    const menuRect = menu.getBoundingClientRect();
    const panelW = panel.offsetWidth;
    const gap = 6;

    let left = menuRect.left - panelW - gap;
    if (left < PAD) left = menuRect.right + gap;
    if (left + panelW > window.innerWidth - PAD) left = PAD;

    let top = menuRect.top;
    if (top + panel.offsetHeight > window.innerHeight - PAD) {
      top = window.innerHeight - panel.offsetHeight - PAD;
    }
    setPos({ top, left });
  }, [menuRef]);

  useLayoutEffect(() => {
    requestAnimationFrame(compute);
  }, [compute]);

  return createPortal(
    <div
      ref={panelRef}
      data-color-sidebar
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 10000,
        opacity: pos ? 1 : 0,
        transition: 'opacity 0.1s',
      }}
      className={`rounded-lg shadow-lg border p-2 ${
        darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={(e) => { e.stopPropagation(); onSelectColor(color); }}
            className="w-4 h-4 rounded border border-black/10 hover:scale-125 transition-transform cursor-pointer"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
};
