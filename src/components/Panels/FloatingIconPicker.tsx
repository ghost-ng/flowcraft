// ---------------------------------------------------------------------------
// FloatingIconPicker.tsx -- Draggable floating icon picker for canvas
// ---------------------------------------------------------------------------

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { icons, Search, X, GripHorizontal } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Popular / curated icons shown by default
// ---------------------------------------------------------------------------

const POPULAR_ICONS = [
  'User', 'Users', 'UserCircle', 'UserCheck', 'UserPlus',
  'Settings', 'Wrench', 'SlidersHorizontal',
  'Home', 'Building', 'Building2', 'Factory', 'Landmark',
  'Globe', 'Cloud', 'CloudOff', 'Server', 'Database', 'HardDrive',
  'Wifi', 'Signal', 'Smartphone', 'Monitor', 'Laptop', 'Tablet',
  'Mail', 'MessageSquare', 'MessageCircle', 'Send', 'Bell', 'BellRing',
  'Lock', 'Unlock', 'Shield', 'ShieldCheck', 'Key', 'Fingerprint',
  'CreditCard', 'Wallet', 'DollarSign', 'Coins', 'Receipt', 'ShoppingCart', 'ShoppingBag',
  'Heart', 'Star', 'ThumbsUp', 'ThumbsDown', 'Award', 'Trophy',
  'FileText', 'File', 'Folder', 'FolderOpen', 'Archive', 'Clipboard',
  'Calendar', 'Clock', 'Timer', 'Hourglass', 'AlarmClock',
  'Check', 'CheckCircle', 'XCircle', 'AlertTriangle', 'AlertCircle', 'Info',
  'Play', 'Pause', 'Square', 'CircleDot', 'Power',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'RefreshCw', 'RotateCw',
  'Search', 'ZoomIn', 'ZoomOut', 'Eye', 'EyeOff',
  'Download', 'Upload', 'Share', 'ExternalLink', 'Link', 'Unlink',
  'Code', 'Terminal', 'GitBranch', 'GitCommit', 'GitPullRequest',
  'Cpu', 'Zap', 'Battery', 'Plug', 'Activity',
  'Map', 'MapPin', 'Navigation', 'Compass',
  'Camera', 'Image', 'Film', 'Music', 'Mic',
  'Truck', 'Package', 'Box', 'Inbox',
  'Lightbulb', 'Flame', 'Sparkles', 'Wand2',
  'PieChart', 'BarChart', 'TrendingUp', 'TrendingDown', 'LineChart',
  'Bookmark', 'Flag', 'Tag', 'Hash', 'AtSign',
  'Phone', 'PhoneCall', 'Video', 'Headphones',
  'Printer', 'ScanLine', 'QrCode',
  'Sun', 'Moon', 'CloudRain', 'Snowflake', 'Wind',
  'Layers', 'Layout', 'Grid', 'Columns', 'Rows',
  'Maximize', 'Minimize', 'Move', 'Crosshair', 'Target',
  'Scissors', 'Pen', 'Pencil', 'Eraser', 'Palette',
  'BookOpen', 'GraduationCap', 'Library',
  'Stethoscope', 'Pill', 'Syringe', 'Thermometer',
  'Car', 'Plane', 'Train', 'Bike', 'Ship',
  'TreePine', 'Flower', 'Bug', 'Fish', 'Dog',
];

const VALID_POPULAR_ICONS = POPULAR_ICONS.filter(
  (name) => name in (icons as Record<string, unknown>),
);

const ALL_ICON_NAMES = Object.keys(icons).sort();
const PAGE_SIZE = 200;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FloatingIconPickerProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FloatingIconPicker: React.FC<FloatingIconPickerProps> = ({ onClose }) => {
  const selectedPaletteShape = useUIStore((s) => s.selectedPaletteShape);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [position, setPosition] = useState({ x: 80, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Determine which icons to display
  const displayedIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return VALID_POPULAR_ICONS;
    }
    const query = searchQuery.toLowerCase();
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(query));
  }, [searchQuery]);

  const visibleIcons = useMemo(
    () => displayedIcons.slice(0, visibleCount),
    [displayedIcons, visibleCount],
  );

  const hasMore = displayedIcons.length > visibleCount;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setVisibleCount(PAGE_SIZE);
  }, []);

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 rounded-xl shadow-2xl border bg-white dark:bg-dk-panel dark:border-dk-border border-slate-200 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: 340,
        maxHeight: 480,
      }}
    >
      {/* Draggable title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-dk-border cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-slate-400 dark:text-dk-faint" />
          <span className="text-xs font-semibold text-slate-600 dark:text-dk-muted uppercase tracking-wide">
            Icons
          </span>
          <span className="text-[10px] text-slate-400 dark:text-dk-faint">
            {ALL_ICON_NAMES.length} available
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-dk-hover transition-colors cursor-pointer"
          data-tooltip="Close"
        >
          <X size={14} className="text-slate-400 dark:text-dk-faint" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-dk-border shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dk-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded border border-slate-200 dark:border-dk-border
                       bg-white dark:bg-dk-panel text-slate-700 dark:text-dk-text
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dk-faint hover:text-slate-600 dark:hover:text-dk-muted cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <span className="text-[10px] font-medium text-slate-400 dark:text-dk-faint">
          {searchQuery
            ? `${displayedIcons.length} result${displayedIcons.length !== 1 ? 's' : ''}`
            : `Popular (${VALID_POPULAR_ICONS.length})`}
          {' '}&middot; Drag to canvas
        </span>
      </div>

      {/* Icon grid -- scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {visibleIcons.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-slate-400 dark:text-dk-faint">
            No icons found
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {visibleIcons.map((iconName) => {
              const IconComp = (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
              if (!IconComp) return null;
              return (
                <div
                  key={iconName}
                  draggable
                  onDragStart={(e) => {
                    // If a shape is pre-selected in palette, use it; otherwise icon-only
                    if (selectedPaletteShape) {
                      e.dataTransfer.setData('application/charthero-shape', selectedPaletteShape);
                    } else {
                      e.dataTransfer.setData('application/charthero-shape', 'iconOnly');
                    }
                    e.dataTransfer.setData('application/charthero-icon', iconName);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="flex items-center justify-center p-1.5 rounded cursor-grab
                             hover:bg-blue-50 dark:hover:bg-blue-800/10 hover:text-blue-600
                             text-slate-500 dark:text-dk-muted transition-colors
                             active:cursor-grabbing active:scale-95"
                  title={iconName}
                >
                  <IconComp size={18} />
                </div>
              );
            })}
          </div>
        )}

        {/* Show more */}
        {hasMore && (
          <button
            onClick={handleShowMore}
            className="w-full mt-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50
                       dark:hover:bg-blue-800/10 rounded border border-blue-200 dark:border-blue-800
                       transition-colors cursor-pointer"
          >
            Show more ({displayedIcons.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(FloatingIconPicker);
