import React, { useState, useMemo, useCallback } from 'react';
import { icons } from 'lucide-react';
import { Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Popular / curated icons shown by default
// ---------------------------------------------------------------------------

const POPULAR_ICONS = [
  'User', 'Users', 'UserCircle', 'UserCheck',
  'Settings', 'Cog', 'Wrench', 'Tool',
  'Home', 'Building', 'Building2', 'Factory',
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
  'Code', 'Terminal', 'GitBranch', 'GitCommit', 'GitPullRequest', 'Github',
  'Cpu', 'Zap', 'Battery', 'Plug', 'Activity',
  'Map', 'MapPin', 'Navigation', 'Compass',
  'Camera', 'Image', 'Film', 'Music', 'Mic',
  'Truck', 'Package', 'Box', 'Inbox',
  'Lightbulb', 'Flame', 'Sparkles', 'Wand2',
  'PieChart', 'BarChart', 'TrendingUp', 'TrendingDown', 'LineChart',
];

// Pre-filter popular icons to only those that actually exist in the icons object
const VALID_POPULAR_ICONS = POPULAR_ICONS.filter(
  (name) => name in (icons as Record<string, unknown>),
);

// All icon names from lucide-react, sorted alphabetically
const ALL_ICON_NAMES = Object.keys(icons).sort();

// How many icons to show at a time when browsing all results
const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  onClose: () => void;
  currentIcon?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose, currentIcon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Determine which icons to display
  const displayedIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return VALID_POPULAR_ICONS;
    }
    const query = searchQuery.toLowerCase();
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(query));
  }, [searchQuery]);

  // Slice to visible count for performance
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

  return (
    <div className="mt-2 border border-border rounded-lg bg-white dark:bg-dk-panel shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Choose Icon
        </span>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-dk-hover transition-colors cursor-pointer"
          data-tooltip="Close"
        >
          <X size={14} className="text-text-muted" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search all icons..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded border border-border bg-white dark:bg-dk-hover
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Remove icon option */}
      {currentIcon && (
        <div className="px-3 pt-2">
          <button
            onClick={() => onSelect('')}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-red-200
                       dark:border-red-800 transition-colors cursor-pointer"
          >
            <X size={12} />
            Remove Icon
          </button>
        </div>
      )}

      {/* Section label */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] font-medium text-text-muted">
          {searchQuery
            ? `${displayedIcons.length} result${displayedIcons.length !== 1 ? 's' : ''}`
            : 'Popular Icons'}
        </span>
      </div>

      {/* Icon grid */}
      <div className="px-3 pb-3 max-h-[280px] overflow-y-auto panel-scroll">
        {visibleIcons.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-text-muted">
            No icons found
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {visibleIcons.map((iconName) => {
              const IconComp = (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
              if (!IconComp) return null;
              const isSelected = currentIcon === iconName;
              return (
                <button
                  key={iconName}
                  onClick={() => onSelect(iconName)}
                  className={`
                    flex items-center justify-center p-1.5 rounded transition-colors cursor-pointer
                    ${isSelected
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                      : 'hover:bg-slate-100 dark:hover:bg-dk-hover text-slate-600 dark:text-dk-muted'
                    }
                  `}
                  title={iconName}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        )}

        {/* Show more button */}
        {hasMore && (
          <button
            onClick={handleShowMore}
            className="w-full mt-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/5
                       rounded border border-primary/20 transition-colors cursor-pointer"
          >
            Show more ({displayedIcons.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(IconPicker);
