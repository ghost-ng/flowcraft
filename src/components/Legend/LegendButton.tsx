// ---------------------------------------------------------------------------
// LegendButton — Floating canvas button for toggling / editing the NODE legend
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { List, Plus, Trash2, Eye, EyeOff, X, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useLegendStore, type LegendItemKind, type LegendItem } from '../../store/legendStore';
import { useStyleStore } from '../../store/styleStore';
import { useUIStore } from '../../store/uiStore';
import { generateId } from '../../utils/idGenerator';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const KIND_OPTIONS: { value: LegendItemKind; label: string }[] = [
  { value: 'fill', label: 'Fill' },
  { value: 'border', label: 'Border' },
  { value: 'puck', label: 'Puck' },
  { value: 'edge', label: 'Edge' },
];

const BORDER_STYLE_OPTIONS: { value: NonNullable<LegendItem['borderStyle']>; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dash' },
  { value: 'dotted', label: 'Dot' },
];

/** Small swatch preview matching the kind of legend item */
const MiniSwatch: React.FC<{ color: string; kind?: LegendItemKind; borderStyle?: string }> = ({
  color, kind, borderStyle,
}) => {
  const s = 16;
  switch (kind) {
    case 'border':
      return (
        <div
          style={{
            width: s, height: s, borderRadius: 2, flexShrink: 0,
            border: `2px ${borderStyle || 'solid'} ${color}`,
            backgroundColor: 'transparent',
          }}
        />
      );
    case 'puck':
      return (
        <div
          style={{
            width: s, height: s, borderRadius: '50%', flexShrink: 0,
            backgroundColor: color,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      );
    case 'edge':
      return (
        <svg width={s + 2} height={s} viewBox={`0 0 ${s + 2} ${s}`} style={{ flexShrink: 0 }}>
          <line x1={0} y1={s / 2} x2={s + 2} y2={s / 2} stroke={color} strokeWidth={2} strokeLinecap="round" />
          <polygon
            points={`${s + 2},${s / 2} ${s - 2},${s / 2 - 3} ${s - 2},${s / 2 + 3}`}
            fill={color}
          />
        </svg>
      );
    default: // 'fill' | 'lane' | undefined
      return (
        <div
          style={{
            width: s, height: s, borderRadius: 2, flexShrink: 0,
            backgroundColor: color,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      );
  }
};

const LegendButton: React.FC = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const darkMode = useStyleStore((s) => s.darkMode);
  const rulerVisible = useUIStore((s) => s.rulerVisible);

  // All selectors target nodeLegend only
  const legendConfig = useLegendStore((s) => s.nodeLegend);
  const setVisible = useLegendStore((s) => s.setVisible);
  const setTitle = useLegendStore((s) => s.setTitle);
  const addItem = useLegendStore((s) => s.addItem);
  const removeItem = useLegendStore((s) => s.removeItem);
  const updateItem = useLegendStore((s) => s.updateItem);
  const updateStyle = useLegendStore((s) => s.updateStyle);
  const generateNodeLegend = useLegendStore((s) => s.generateNodeLegend);

  const hasItems = legendConfig.items.length > 0;
  const isVisible = legendConfig.visible && hasItems;

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  const handleToggleVisibility = useCallback(() => {
    if (!hasItems) {
      generateNodeLegend();
      return;
    }
    setVisible('node', !legendConfig.visible);
  }, [hasItems, legendConfig.visible, setVisible, generateNodeLegend]);

  const handleAddItem = useCallback(() => {
    const newId = generateId('legend');
    addItem('node', {
      id: newId,
      label: `Item ${legendConfig.items.length + 1}`,
      color: COLORS[legendConfig.items.length % COLORS.length],
      kind: 'fill',
      order: legendConfig.items.length,
    });
    if (!legendConfig.visible) setVisible('node', true);
    setExpandedItemId(newId);
  }, [addItem, legendConfig.items.length, legendConfig.visible, setVisible]);

  const bg = darkMode ? 'bg-dk-panel' : 'bg-white/90';
  const border = darkMode ? 'border-dk-border' : 'border-slate-200';
  const text = darkMode ? 'text-dk-text' : 'text-slate-600';
  const muted = darkMode ? 'text-dk-muted' : 'text-slate-400';
  const hover = darkMode ? 'hover:bg-dk-hover' : 'hover:bg-slate-50';

  // Pill button class helper
  const pillClass = (active: boolean) =>
    `px-1.5 py-0.5 text-[10px] font-medium rounded cursor-pointer transition-colors border ${
      active
        ? 'bg-primary/15 border-primary/40 text-primary'
        : `${darkMode ? 'bg-dk-hover/50 border-dk-border text-dk-muted' : 'bg-slate-50 border-slate-200 text-slate-400'} hover:border-primary/30`
    }`;

  return (
    <div className="absolute right-3 z-10" style={{ top: rulerVisible ? 'calc(0.75rem + 24px)' : '0.75rem' }} ref={popoverRef}>
      {/* Toggle button row */}
      <div className="flex gap-1">
        {/* Visibility toggle */}
        <button
          onClick={handleToggleVisibility}
          className={`
            p-1.5 rounded-md border shadow-sm transition-colors cursor-pointer
            ${isVisible
              ? 'bg-primary/10 border-primary/30 text-primary'
              : `${bg} ${border} text-slate-500 ${hover}`
            }
          `}
          data-tooltip={isVisible ? 'Hide node legend' : hasItems ? 'Show node legend' : 'Generate node legend'}
        >
          {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        {/* Edit button */}
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className={`
            p-1.5 rounded-md border shadow-sm transition-colors cursor-pointer
            ${popoverOpen
              ? 'bg-primary/10 border-primary/30 text-primary'
              : `${bg} ${border} text-slate-500 ${hover}`
            }
          `}
          data-tooltip="Edit node legend"
        >
          <List size={16} />
        </button>
      </div>

      {/* Popover panel */}
      {popoverOpen && (
        <div
          className={`absolute top-10 right-0 w-72 ${bg} border ${border} rounded-lg shadow-lg overflow-hidden`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2 border-b ${border}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>
              Node Legend
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { generateNodeLegend(); }}
                className={`p-0.5 rounded ${hover} ${muted} cursor-pointer`}
                title="Regenerate from diagram"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setPopoverOpen(false)}
                className={`p-0.5 rounded ${hover} ${muted} cursor-pointer`}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-3 max-h-96 overflow-y-auto">
            {/* Show/Hide */}
            <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${text}`}>
              <input
                type="checkbox"
                checked={legendConfig.visible}
                onChange={(e) => setVisible('node', e.target.checked)}
                className="rounded"
              />
              Show Node Legend
            </label>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-medium ${muted} uppercase tracking-wide`}>Title</span>
              <input
                type="text"
                value={legendConfig.title}
                onChange={(e) => setTitle('node', e.target.value)}
                placeholder="Legend title"
                className={`w-full px-2 py-1 text-sm rounded border ${border} ${bg} ${text}
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary`}
              />
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-[10px] font-medium ${muted} uppercase tracking-wide`}>
                Items ({legendConfig.items.length})
              </span>
              {[...legendConfig.items].sort((a, b) => a.order - b.order).map((item) => {
                const isExpanded = expandedItemId === item.id;
                const itemKind = item.kind || 'fill';
                return (
                  <div
                    key={item.id}
                    className={`rounded border ${border} ${darkMode ? 'bg-dk-hover/50' : 'bg-slate-50/50'} ${
                      item.hidden ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Main row: expand chevron, color, swatch, label, hide, delete */}
                    <div className="flex items-center gap-1 px-1.5 py-1">
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`p-0 shrink-0 cursor-pointer ${muted}`}
                        title={isExpanded ? 'Collapse' : 'Edit symbol'}
                      >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <input
                        type="color"
                        value={item.color}
                        onChange={(e) => updateItem('node', item.id, { color: e.target.value })}
                        className="w-4 h-4 rounded border border-slate-200 cursor-pointer shrink-0 p-0"
                        title="Item color"
                      />
                      <MiniSwatch color={item.color} kind={item.kind} borderStyle={item.borderStyle} />
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem('node', item.id, { label: e.target.value })}
                        className={`flex-1 min-w-0 px-1 py-0.5 text-xs rounded border border-transparent
                                   hover:border-slate-200 focus:border-primary focus:outline-none bg-transparent ${text}`}
                      />
                      <button
                        onClick={() => updateItem('node', item.id, { hidden: !item.hidden })}
                        className={`p-0.5 rounded ${muted} ${hover} transition-colors cursor-pointer shrink-0`}
                        title={item.hidden ? 'Show in legend' : 'Hide from legend'}
                      >
                        {item.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button
                        onClick={() => removeItem('node', item.id)}
                        className={`p-0.5 rounded ${muted} hover:text-red-500 hover:bg-red-50
                                   ${darkMode ? 'dark:hover:bg-red-900/20' : ''} transition-colors cursor-pointer shrink-0`}
                        title="Remove item"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Expanded detail row: kind pills + border style pills */}
                    {isExpanded && (
                      <div className={`px-2 pb-1.5 pt-0 flex flex-col gap-1.5`}>
                        {/* Kind pills */}
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] ${muted} w-8 shrink-0`}>Type</span>
                          <div className="flex gap-0.5 flex-wrap">
                            {KIND_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateItem('node', item.id, {
                                  kind: opt.value,
                                  // Reset borderStyle when switching away from border
                                  ...(opt.value !== 'border' ? { borderStyle: undefined } : { borderStyle: item.borderStyle || 'solid' }),
                                })}
                                className={pillClass(itemKind === opt.value)}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Border style pills (only when kind === 'border') */}
                        {itemKind === 'border' && (
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] ${muted} w-8 shrink-0`}>Style</span>
                            <div className="flex gap-0.5">
                              {BORDER_STYLE_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateItem('node', item.id, { borderStyle: opt.value })}
                                  className={pillClass((item.borderStyle || 'solid') === opt.value)}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAddItem}
                className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium
                           text-primary hover:bg-primary/5 rounded border border-dashed border-primary/30
                           transition-colors cursor-pointer"
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>

            {/* Style controls */}
            {hasItems && (
              <div className={`flex flex-col gap-2 border-t ${border} pt-2`}>
                <span className={`text-[10px] font-medium ${muted} uppercase tracking-wide`}>Style</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${muted} w-10`}>BG</span>
                  <input
                    type="color"
                    value={legendConfig.style.bgColor}
                    onChange={(e) => updateStyle('node', { bgColor: e.target.value })}
                    className="w-5 h-5 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                  <span className={`text-[10px] ${muted} w-10 ml-2`}>Border</span>
                  <input
                    type="color"
                    value={legendConfig.style.borderColor}
                    onChange={(e) => updateStyle('node', { borderColor: e.target.value })}
                    className="w-5 h-5 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${muted} w-10`}>Font</span>
                  <input
                    type="range"
                    min={8}
                    max={16}
                    step={1}
                    value={legendConfig.style.fontSize}
                    onChange={(e) => updateStyle('node', { fontSize: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className={`text-[10px] ${muted} w-4 text-right`}>{legendConfig.style.fontSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${muted} w-10`}>Width</span>
                  <input
                    type="range"
                    min={120}
                    max={300}
                    step={10}
                    value={legendConfig.style.width}
                    onChange={(e) => updateStyle('node', { width: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className={`text-[10px] ${muted} w-4 text-right`}>{legendConfig.style.width}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LegendButton);
