import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useExtensionStore, type ExtensionPack } from '../../extensions/extensionStore';
import { useStyleStore } from '../../store/styleStore';
import { CURSOR_OPEN_HAND } from '../../assets/cursors/cursors';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Horizontal pinned extensions bar — rendered above the StatusBar
// ---------------------------------------------------------------------------

interface PackStripProps {
  pack: ExtensionPack;
}

const PackStrip: React.FC<PackStripProps> = React.memo(({ pack }) => (
  <div className="flex items-center gap-0.5 shrink-0">
    {pack.items.map((item) => (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/charthero-extension', JSON.stringify({ packId: pack.id, itemId: item.id }));
          e.dataTransfer.effectAllowed = 'move';
        }}
        style={{ cursor: CURSOR_OPEN_HAND }}
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md transition-all duration-100 hover:bg-primary/10 hover:scale-110 active:scale-95"
      >
        <div
          className="w-6 h-6 text-text-muted dark:text-dk-muted"
          dangerouslySetInnerHTML={{ __html: item.svgContent }}
        />
      </div>
    ))}
  </div>
));

PackStrip.displayName = 'PackStrip';

const SCROLL_STEP = 160;

const PinnedExtensionsBar: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const packs = useExtensionStore((s) => s.packs);
  const pinnedPackIds = useExtensionStore((s) => s.pinnedPackIds);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Ensure built-in packs are loaded
  useEffect(() => {
    useExtensionStore.getState().loadBuiltInPacks();
  }, []);

  const pinnedPacks = packs.filter((p) => pinnedPackIds.includes(p.id));

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, pinnedPacks.length]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -SCROLL_STEP : SCROLL_STEP, behavior: 'smooth' });
  }, []);

  if (pinnedPacks.length === 0) return null;

  const chevronBase = `shrink-0 flex items-center justify-center w-6 h-full cursor-pointer transition-colors`;
  const chevronActive = darkMode
    ? 'text-dk-muted hover:text-dk-text hover:bg-dk-hover'
    : 'text-text-muted hover:text-text hover:bg-slate-100';
  const chevronDisabled = 'text-transparent pointer-events-none';

  return (
    <div
      className={`flex items-center shrink-0 border-t overflow-hidden ${
        darkMode
          ? 'bg-dk-panel border-dk-border'
          : 'bg-white/90 border-border'
      }`}
    >
      {/* Left chevron */}
      <button
        onClick={() => scroll('left')}
        className={`${chevronBase} ${canScrollLeft ? chevronActive : chevronDisabled}`}
        tabIndex={-1}
        aria-label="Scroll extensions left"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      {/* Scrollable icon strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 py-0.5 flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none"
      >
        {pinnedPacks.map((pack, i) => (
          <React.Fragment key={pack.id}>
            {i > 0 && (
              <div
                className={`shrink-0 self-stretch my-1 ${
                  darkMode ? 'bg-dk-border' : 'bg-slate-300'
                }`}
                style={{ width: 2 }}
              />
            )}
            <PackStrip pack={pack} />
          </React.Fragment>
        ))}
      </div>

      {/* Right chevron */}
      <button
        onClick={() => scroll('right')}
        className={`${chevronBase} ${canScrollRight ? chevronActive : chevronDisabled}`}
        tabIndex={-1}
        aria-label="Scroll extensions right"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default React.memo(PinnedExtensionsBar);
