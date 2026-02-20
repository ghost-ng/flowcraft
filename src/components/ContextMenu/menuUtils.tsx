// ---------------------------------------------------------------------------
// menuUtils.tsx -- Shared context-menu overflow utilities
//
// useMenuPosition: hook that clamps a fixed-position menu to the viewport
// SubMenu: wrapper that auto-flips submenus when they overflow the viewport
// ---------------------------------------------------------------------------

import React, { useLayoutEffect, useRef, useState } from 'react';

const PAD = 8;

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
      {children}
    </div>
  );
};
