import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Rows3,
  Columns3,
  Grid3X3,
  Copy,
  icons,
} from 'lucide-react';

import { useFlowStore, type FlowNodeData, type FlowEdgeData, type StatusIndicator, getStatusIndicators, newPuckId } from '../../store/flowStore';
import { useUIStore, type PanelTab } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';
import { DependencyPanel } from '../Dependencies';
import { darkenColor } from '../../utils/colorUtils';
import EdgePropertiesTab from './EdgePropertiesTab';
import IconPicker from './IconPicker';
import {
  useSwimlaneStore,
  type SwimlaneOrientation,
  type SwimlaneItem,
} from '../../store/swimlaneStore';
import { generateId } from '../../utils/idGenerator';
import { log } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Helper: sanitize color for <input type="color"> which requires #rrggbb
// ---------------------------------------------------------------------------

const toHexColor = (c: string | undefined, fallback = '#ffffff'): string => {
  if (!c || c === 'transparent' || c === 'none') return fallback;
  return c;
};

// ---------------------------------------------------------------------------
// Panel tab definitions
// ---------------------------------------------------------------------------

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'node', label: 'Node' },
  { id: 'edge', label: 'Connector' },
  { id: 'deps', label: 'Deps' },
  { id: 'lane', label: 'Lane' },
  { id: 'data', label: 'Data' },
];

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Node properties tab
// ---------------------------------------------------------------------------

interface NodePropsTabProps {
  nodeId: string;
  data: FlowNodeData;
}

const SectionHeader: React.FC<{ label: string; collapsed: boolean; onToggle: () => void }> = ({ label, collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-1 mt-1 cursor-pointer hover:text-text transition-colors"
  >
    {label}
    <ChevronDown
      size={12}
      className={`transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Status Pucks section (multi-puck editor)
// ---------------------------------------------------------------------------

interface StatusPucksSectionProps {
  nodeId: string;
  data: FlowNodeData;
  collapsed: boolean;
  onToggle: () => void;
}

const StatusPucksSection: React.FC<StatusPucksSectionProps> = ({ nodeId, data, collapsed, onToggle }) => {
  const selectedPuckIds = useUIStore((s) => s.selectedPuckIds);
  const selectedPuckNodeId = useUIStore((s) => s.selectedPuckNodeId);

  const pucks = useMemo(() => getStatusIndicators(data), [data]);

  // The selected puck for this node's detail editor
  const selectedPuck = useMemo(() => {
    if (selectedPuckNodeId !== nodeId || selectedPuckIds.length === 0) return null;
    return pucks.find((p) => selectedPuckIds.includes(p.id)) ?? null;
  }, [selectedPuckIds, selectedPuckNodeId, nodeId, pucks]);

  const handleAddPuck = useCallback(() => {
    const newPuck: StatusIndicator = {
      id: newPuckId(),
      status: 'not-started',
      color: '#94a3b8',
      size: 12,
      position: 'top-right',
    };
    useFlowStore.getState().addStatusPuck(nodeId, newPuck);
    // Auto-select the newly created puck
    useUIStore.getState().selectPuck(newPuck.id, nodeId);
  }, [nodeId]);

  const handleRemovePuck = useCallback(
    (puckId: string) => {
      useFlowStore.getState().removeStatusPuck(nodeId, puckId);
      // Clear selection if the removed puck was selected
      if (selectedPuckIds.includes(puckId)) {
        useUIStore.getState().clearPuckSelection();
      }
    },
    [nodeId, selectedPuckIds],
  );

  const handleSelectPuck = useCallback(
    (puckId: string) => {
      useUIStore.getState().selectPuck(puckId, nodeId);
    },
    [nodeId],
  );

  const handleUpdatePuck = useCallback(
    (patch: Partial<StatusIndicator>) => {
      if (!selectedPuck) return;
      useFlowStore.getState().updateStatusPuck(nodeId, selectedPuck.id, patch);
    },
    [nodeId, selectedPuck],
  );

  const handleSelectAllOnNode = useCallback(() => {
    if (pucks.length === 0) return;
    // Select first puck normally, then toggle the rest
    useUIStore.getState().selectPuck(pucks[0].id, nodeId);
    for (let i = 1; i < pucks.length; i++) {
      useUIStore.getState().togglePuckSelection(pucks[i].id, nodeId);
    }
  }, [pucks, nodeId]);

  const handleSelectAllGlobal = useCallback(() => {
    const allNodes = useFlowStore.getState().nodes;
    let first = true;
    for (const n of allNodes) {
      const nodePucks = getStatusIndicators(n.data as FlowNodeData);
      for (const p of nodePucks) {
        if (first) {
          useUIStore.getState().selectPuck(p.id, n.id);
          first = false;
        } else {
          useUIStore.getState().togglePuckSelection(p.id, n.id);
        }
      }
    }
  }, []);

  const defaultColors: Record<string, string> = {
    'not-started': '#94a3b8',
    'in-progress': '#3b82f6',
    'completed': '#10b981',
    'blocked': '#ef4444',
    'review': '#f59e0b',
  };

  return (
    <>
      {/* Header with toggle and add button */}
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <SectionHeader label="Status Pucks" collapsed={collapsed} onToggle={onToggle} />
        </div>
        <button
          onClick={handleAddPuck}
          className="p-1 rounded text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
          title="Add a status puck"
        >
          <Plus size={14} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Puck chips row */}
          {pucks.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-text-muted italic">Add a status puck</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {pucks.map((puck) => {
                const isSelected = selectedPuckNodeId === nodeId && selectedPuckIds.includes(puck.id);
                return (
                  <div key={puck.id} className="relative group">
                    <button
                      onClick={() => handleSelectPuck(puck.id)}
                      className={`
                        w-6 h-6 rounded-full border-2 transition-all cursor-pointer
                        ${isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-1'
                          : 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-1'
                        }
                      `}
                      style={{
                        backgroundColor: puck.color || '#94a3b8',
                        borderColor: puck.borderColor || '#ffffff',
                      }}
                      title={`${puck.status} — click to select`}
                    />
                    {/* Remove button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePuck(puck.id);
                      }}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white
                                 flex items-center justify-center opacity-0 group-hover:opacity-100
                                 transition-opacity cursor-pointer"
                      title="Remove puck"
                    >
                      <X size={8} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection helper buttons */}
          {pucks.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSelectAllOnNode}
                className="px-2 py-1 text-[10px] font-medium rounded border border-border
                           text-text-muted hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Select All on Node
              </button>
              <button
                onClick={handleSelectAllGlobal}
                className="px-2 py-1 text-[10px] font-medium rounded border border-border
                           text-text-muted hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Select All (Global)
              </button>
            </div>
          )}

          {/* Detail editor for the selected puck */}
          {selectedPuck && selectedPuckNodeId === nodeId && (
            <div className="flex flex-col gap-3 mt-1 pt-2 border-t border-border">
              {/* Status */}
              <Field label="Status">
                <select
                  value={selectedPuck.status || 'not-started'}
                  onChange={(e) => {
                    const status = e.target.value as StatusIndicator['status'];
                    handleUpdatePuck({
                      status,
                      color: selectedPuck.color || defaultColors[status] || '#94a3b8',
                    });
                  }}
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                  <option value="review">Review</option>
                </select>
              </Field>

              {/* Indicator Color */}
              <Field label="Indicator Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPuck.color || '#94a3b8'}
                    onChange={(e) => handleUpdatePuck({ color: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedPuck.color || '#94a3b8'}
                    onChange={(e) => handleUpdatePuck({ color: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </Field>

              {/* Size */}
              <Field label="Indicator Size">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={8}
                    max={20}
                    step={1}
                    value={selectedPuck.size || 12}
                    onChange={(e) => handleUpdatePuck({ size: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-text-muted w-8 text-right font-mono">
                    {selectedPuck.size || 12}px
                  </span>
                </div>
              </Field>

              {/* Position */}
              <Field label="Position">
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { value: 'top-left', label: 'TL' },
                    { value: 'top-right', label: 'TR' },
                    { value: 'bottom-left', label: 'BL' },
                    { value: 'bottom-right', label: 'BR' },
                  ] as const).map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => handleUpdatePuck({ position: pos.value })}
                      className={`
                        py-1.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer
                        ${(selectedPuck.position || 'top-right') === pos.value
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'border-border text-text-muted hover:bg-slate-50'
                        }
                      `}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Puck Icon */}
              <Field label="Puck Icon">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPuck.icon || ''}
                    onChange={(e) => handleUpdatePuck({ icon: e.target.value || undefined })}
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">Default (Auto)</option>
                    <option value="blank">Blank (No Icon)</option>
                    <option value="Check">Checkmark</option>
                    <option value="Clock">Clock</option>
                    <option value="X">X Mark</option>
                    <option value="Eye">Eye</option>
                    <option value="AlertTriangle">Warning</option>
                    <option value="Star">Star</option>
                    <option value="Heart">Heart</option>
                    <option value="Flag">Flag</option>
                    <option value="Zap">Lightning</option>
                    <option value="ThumbsUp">Thumbs Up</option>
                    <option value="ThumbsDown">Thumbs Down</option>
                    <option value="Circle">Circle</option>
                    <option value="Square">Square</option>
                    <option value="Bell">Bell</option>
                    <option value="Bookmark">Bookmark</option>
                    <option value="Pin">Pin</option>
                  </select>
                </div>
              </Field>

              {/* Border Color */}
              <Field label="Border Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPuck.borderColor || '#ffffff'}
                    onChange={(e) => handleUpdatePuck({ borderColor: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedPuck.borderColor || '#ffffff'}
                    onChange={(e) => handleUpdatePuck({ borderColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </Field>

              {/* Border Width */}
              <Field label="Border Width">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={0.5}
                    value={selectedPuck.borderWidth ?? 2}
                    onChange={(e) => handleUpdatePuck({ borderWidth: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-text-muted w-8 text-right font-mono">
                    {selectedPuck.borderWidth ?? 2}px
                  </span>
                </div>
              </Field>

              {/* Border Style */}
              <Field label="Border Style">
                <div className="flex items-center gap-1">
                  {(['solid', 'dashed', 'dotted', 'none'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleUpdatePuck({ borderStyle: style })}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer
                        ${(selectedPuck.borderStyle || 'solid') === style
                          ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500/50 dark:text-blue-400'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </>
      )}
    </>
  );
};

const NodePropsTab: React.FC<NodePropsTabProps> = React.memo(({ nodeId, data }) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Auto-expand relevant sections based on node properties when selection changes
  useEffect(() => {
    const pucks = getStatusIndicators(data);
    setCollapsedSections({
      block: false,  // always expanded
      label: false,  // always expanded (has text + icon settings)
      status: pucks.length === 0,  // expanded only if node has pucks
      icon: !data.icon,  // expanded only if node has an icon
    });
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (patch: Partial<FlowNodeData>) => {
      updateNodeData(nodeId, patch);
    },
    [nodeId, updateNodeData],
  );

  const fillColor = data.color || '#3b82f6';
  const borderColor = data.borderColor || darkenColor(fillColor, 0.25);
  const textColor = data.textColor || '#ffffff';
  const fontSize = data.fontSize || 14;
  const fontWeight = data.fontWeight || 500;
  const textAlign = (data as Record<string, unknown>).textAlign as string || 'center';

  const currentIcon = data.icon;
  const CurrentIconComponent = currentIcon
    ? (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[currentIcon]
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* ============ BLOCK PROPERTIES ============ */}
      <SectionHeader label="Block" collapsed={!!collapsedSections['block']} onToggle={() => toggleSection('block')} />

      {!collapsedSections['block'] && (
        <>
          {/* Shape type display */}
          <Field label="Shape">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-50 border border-border text-sm capitalize">
              <ChevronRight size={14} className="text-text-muted" />
              {data.shape || 'rectangle'}
            </div>
          </Field>

          {/* Fill color */}
          <Field label="Fill Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={toHexColor(fillColor, '#3b82f6')}
                onChange={(e) => update({ color: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => update({ color: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </Field>

          {/* Border color */}
          <Field label="Border Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={toHexColor(borderColor, '#334155')}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </Field>

          {/* Border Width */}
          <Field label="Border Width">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={data.borderWidth ?? 2}
                onChange={(e) => update({ borderWidth: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right font-mono">
                {data.borderWidth ?? 2}px
              </span>
            </div>
          </Field>

          {/* Border Style */}
          <Field label="Border Style">
            <div className="flex items-center gap-1">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => update({ borderStyle: style })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer
                    ${(data.borderStyle || 'solid') === style
                      ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500/50 dark:text-blue-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </Field>

          {/* Corner Radius */}
          <Field label="Corner Radius">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={data.borderRadius ?? 4}
                onChange={(e) => update({ borderRadius: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right font-mono">
                {data.borderRadius ?? 4}px
              </span>
            </div>
          </Field>

          {/* Opacity */}
          <Field label="Opacity">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={data.opacity ?? 1}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right font-mono">
                {Math.round((data.opacity ?? 1) * 100)}%
              </span>
            </div>
          </Field>
        </>
      )}

      {/* ============ LABEL PROPERTIES ============ */}
      <SectionHeader label="Label" collapsed={!!collapsedSections['label']} onToggle={() => toggleSection('label')} />

      {!collapsedSections['label'] && (
        <>
          {/* Label */}
          <Field label="Text">
            <input
              type="text"
              value={data.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </Field>

          {/* Icon */}
          <Field label="Icon">
            <div className="flex items-center gap-2">
              {CurrentIconComponent && (
                <div className="flex items-center justify-center w-8 h-8 rounded border border-border bg-slate-50">
                  <CurrentIconComponent size={18} className="text-slate-600" />
                </div>
              )}
              <button
                onClick={() => setIconPickerOpen(!iconPickerOpen)}
                className="px-3 py-1.5 text-xs font-medium rounded border border-border
                           text-text-muted hover:bg-slate-50 hover:text-text transition-colors cursor-pointer"
              >
                {currentIcon ? 'Change Icon' : 'Add Icon'}
              </button>
              {currentIcon && (
                <button
                  onClick={() => update({ icon: undefined })}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            {iconPickerOpen && (
              <IconPicker
                currentIcon={currentIcon}
                onSelect={(iconName) => {
                  if (iconName === '') {
                    update({ icon: undefined });
                    // Collapse icon section when removing icon
                    setCollapsedSections((prev) => ({ ...prev, icon: true }));
                  } else {
                    update({ icon: iconName });
                    // Auto-expand icon style section when an icon is selected
                    setCollapsedSections((prev) => ({ ...prev, icon: false }));
                  }
                  setIconPickerOpen(false);
                }}
                onClose={() => setIconPickerOpen(false)}
              />
            )}
          </Field>

          {currentIcon && (
            <Field label="Icon Position">
              <div className="flex items-center gap-1">
                {[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ].map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => update({ iconPosition: pos.value as 'left' | 'right' })}
                    className={`
                      flex-1 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer
                      ${(data.iconPosition || 'left') === pos.value
                        ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500/50 dark:text-blue-400'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Text color */}
          <Field label="Text Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={toHexColor(textColor, '#ffffff')}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </Field>

          {/* Font size */}
          <Field label="Font Size">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={8}
                max={32}
                value={fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right font-mono">
                {fontSize}
              </span>
            </div>
          </Field>

          {/* Font weight */}
          <Field label="Font Weight">
            <div className="flex items-center gap-1">
              {([
                { value: 300, label: 'Light' },
                { value: 400, label: 'Normal' },
                { value: 600, label: 'Semi' },
                { value: 700, label: 'Bold' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ fontWeight: opt.value })}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors cursor-pointer
                    ${fontWeight === opt.value
                      ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500/50 dark:text-blue-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  style={{ fontWeight: opt.value }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Text alignment */}
          <Field label="Text Align">
            <div className="flex items-center gap-1">
              {[
                { icon: <AlignLeft size={16} />, value: 'left' },
                { icon: <AlignCenter size={16} />, value: 'center' },
                { icon: <AlignRight size={16} />, value: 'right' },
              ].map(({ icon, value }) => (
                <button
                  key={value}
                  onClick={() => update({ textAlign: value } as Partial<FlowNodeData>)}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded border
                    transition-colors cursor-pointer
                    ${textAlign === value
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-border text-text-muted hover:bg-slate-50'
                    }
                  `}
                  title={`Align ${value}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {/* ============ ICON STYLING ============ */}
      {currentIcon && (
        <>
          <SectionHeader label="Icon" collapsed={!!collapsedSections['icon']} onToggle={() => toggleSection('icon')} />
          {!collapsedSections['icon'] && (
            <>
              {/* Icon Color */}
              <Field label="Icon Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={toHexColor(data.iconColor || textColor, '#ffffff')}
                    onChange={(e) => update({ iconColor: e.target.value })}
                    className="w-8 h-8 shrink-0 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.iconColor || textColor}
                    onChange={(e) => update({ iconColor: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {data.iconColor && (
                    <button
                      onClick={() => update({ iconColor: undefined })}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </Field>

              {/* Icon Background Color */}
              <Field label="Background">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={toHexColor(data.iconBgColor, '#ffffff')}
                    onChange={(e) => update({ iconBgColor: e.target.value })}
                    className="w-8 h-8 shrink-0 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.iconBgColor || ''}
                    placeholder="None"
                    onChange={(e) => update({ iconBgColor: e.target.value || undefined })}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {data.iconBgColor && (
                    <button
                      onClick={() => update({ iconBgColor: undefined })}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                      title="Remove background"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </Field>

              {/* Icon Border Color */}
              <Field label="Outline Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={toHexColor(data.iconBorderColor, '#94a3b8')}
                    onChange={(e) => update({ iconBorderColor: e.target.value })}
                    className="w-8 h-8 shrink-0 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.iconBorderColor || ''}
                    placeholder="None"
                    onChange={(e) => update({ iconBorderColor: e.target.value || undefined })}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono rounded border border-border bg-white
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </Field>

              {/* Icon Border Width */}
              <Field label="Outline Width">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={0.5}
                    value={data.iconBorderWidth ?? 0}
                    onChange={(e) => update({ iconBorderWidth: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-text-muted w-8 text-right font-mono">
                    {data.iconBorderWidth ?? 0}px
                  </span>
                </div>
              </Field>

              {/* Icon Size */}
              <Field label="Size">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={64}
                    step={1}
                    value={data.iconSize || (fontSize + 2)}
                    onChange={(e) => update({ iconSize: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-text-muted w-8 text-right font-mono">
                    {data.iconSize || (fontSize + 2)}px
                  </span>
                  {data.iconSize && (
                    <button
                      onClick={() => update({ iconSize: undefined })}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                      title="Reset to auto"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </Field>
            </>
          )}
        </>
      )}

      {/* ============ STATUS PUCKS ============ */}
      <StatusPucksSection nodeId={nodeId} data={data} collapsed={!!collapsedSections['status']} onToggle={() => toggleSection('status')} />
    </div>
  );
});

NodePropsTab.displayName = 'NodePropsTab';

// ---------------------------------------------------------------------------
// Placeholder tabs
// ---------------------------------------------------------------------------

const PlaceholderTab: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center justify-center h-32 text-sm text-text-muted">
    {name} settings coming soon
  </div>
);

// ---------------------------------------------------------------------------
// Read-only field with optional copy
// ---------------------------------------------------------------------------

const ReadOnlyField: React.FC<{ label: string; value: string; copyable?: boolean }> = ({
  label,
  value,
  copyable,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch((e) => log.error('Copy to clipboard failed', e));
  }, [value]);

  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <span className="flex-1 px-2 py-1.5 text-xs font-mono rounded bg-slate-50 border border-border text-text truncate">
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </Field>
  );
};

// ---------------------------------------------------------------------------
// Data Tab - shows metadata for selected node
// ---------------------------------------------------------------------------

interface DataTabProps {
  nodeId: string;
  data: FlowNodeData;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
}

const DataTab: React.FC<DataTabProps> = React.memo(({ nodeId, data, position, measured }) => {
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);

  // Compute connected nodes from edges
  const connectedTo = useMemo(() => {
    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source === nodeId) connectedIds.add(edge.target);
      if (edge.target === nodeId) connectedIds.add(edge.source);
    }
    return Array.from(connectedIds).map(id => {
      const node = nodes.find(n => n.id === id);
      return node ? `${node.data.label} (${id})` : id;
    });
  }, [edges, nodes, nodeId]);

  // Upstream (depends on)
  const upstream = useMemo(() => {
    if (!data.dependsOn || data.dependsOn.length === 0) return [];
    return data.dependsOn.map(id => {
      const node = nodes.find(n => n.id === id);
      return node ? `${node.data.label} (${id})` : id;
    });
  }, [data.dependsOn, nodes]);

  // Downstream (blocked by)
  const downstream = useMemo(() => {
    if (!data.blockedBy || data.blockedBy.length === 0) return [];
    return data.blockedBy.map(id => {
      const node = nodes.find(n => n.id === id);
      return node ? `${node.data.label} (${id})` : id;
    });
  }, [data.blockedBy, nodes]);

  // Resolve swimlane label from ID
  const swimlaneLabel = (() => {
    if (!data.swimlaneId) return 'None';
    const { config } = useSwimlaneStore.getState();
    const allLanes = [...config.horizontal, ...config.vertical];
    const lane = allLanes.find((l) => l.id === data.swimlaneId);
    return lane ? lane.label : 'None';
  })();
  const posStr = `${Math.round(position.x)}, ${Math.round(position.y)}`;
  const dimStr = measured
    ? `${Math.round(measured.width ?? 0)} x ${Math.round(measured.height ?? 0)}`
    : 'N/A';

  return (
    <div className="flex flex-col gap-4">
      <ReadOnlyField label="Node ID" value={nodeId} copyable />
      <ReadOnlyField label="Position" value={posStr} />
      <ReadOnlyField label="Dimensions" value={dimStr} />
      <ReadOnlyField label="Swimlane" value={swimlaneLabel} />

      {/* Connected To */}
      <Field label={`Connected To (${connectedTo.length})`}>
        {connectedTo.length === 0 ? (
          <span className="text-xs text-text-muted italic px-2 py-1.5">No connections</span>
        ) : (
          <div className="flex flex-col gap-1">
            {connectedTo.map((name, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-slate-50 border border-border text-text truncate"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Upstream (depends on) */}
      <Field label={`Upstream - Depends On (${upstream.length})`}>
        {upstream.length === 0 ? (
          <span className="text-xs text-text-muted italic px-2 py-1.5">None</span>
        ) : (
          <div className="flex flex-col gap-1">
            {upstream.map((name, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-blue-50 border border-blue-200 text-blue-700 truncate"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Downstream (blocked by) */}
      <Field label={`Downstream - Blocked By (${downstream.length})`}>
        {downstream.length === 0 ? (
          <span className="text-xs text-text-muted italic px-2 py-1.5">None</span>
        ) : (
          <div className="flex flex-col gap-1">
            {downstream.map((name, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-amber-50 border border-amber-200 text-amber-700 truncate"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
});

DataTab.displayName = 'DataTab';

// ---------------------------------------------------------------------------
// Lane palette for new lanes
// ---------------------------------------------------------------------------

const LANE_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ---------------------------------------------------------------------------
// SwimlanePanel (replaces placeholder)
// ---------------------------------------------------------------------------

const SwimlanePanel: React.FC = React.memo(() => {
  const config = useSwimlaneStore((s) => s.config);
  const addLane = useSwimlaneStore((s) => s.addLane);
  const removeLane = useSwimlaneStore((s) => s.removeLane);
  const updateLane = useSwimlaneStore((s) => s.updateLane);
  const setOrientation = useSwimlaneStore((s) => s.setOrientation);
  const setContainerTitle = useSwimlaneStore((s) => s.setContainerTitle);
  const setIsCreating = useSwimlaneStore((s) => s.setIsCreating);

  const hLanes = config.horizontal;
  const vLanes = config.vertical;
  const hasHLanes = hLanes.length > 0;
  const hasVLanes = vLanes.length > 0;
  const isMatrix = hasHLanes && hasVLanes;
  const hasAnyLanes = hasHLanes || hasVLanes;

  // Determine current mode string
  const modeLabel = isMatrix ? 'Matrix' : hasVLanes ? 'Vertical' : hasHLanes ? 'Horizontal' : 'None';

  const handleAddLane = useCallback(
    (orientation: SwimlaneOrientation) => {
      const lanes = orientation === 'horizontal' ? hLanes : vLanes;
      const prefix = orientation === 'horizontal' ? 'Row' : 'Column';
      const newLane: SwimlaneItem = {
        id: generateId('lane'),
        label: `${prefix} ${lanes.length + 1}`,
        color: LANE_PALETTE[lanes.length % LANE_PALETTE.length],
        collapsed: false,
        size: orientation === 'horizontal' ? 200 : 250,
        order: lanes.length,
      };
      addLane(orientation, newLane);
    },
    [hLanes, vLanes, addLane],
  );

  const handleToggleMatrix = useCallback(() => {
    if (isMatrix) {
      // Remove all vertical lanes to exit matrix mode
      for (const lane of vLanes) {
        removeLane('vertical', lane.id);
      }
    } else if (hasHLanes) {
      // Add vertical lanes to enter matrix mode
      for (let i = 0; i < 2; i++) {
        const newLane: SwimlaneItem = {
          id: generateId('lane'),
          label: `Col ${i + 1}`,
          color: LANE_PALETTE[(hLanes.length + i) % LANE_PALETTE.length],
          collapsed: false,
          size: 250,
          order: i,
        };
        addLane('vertical', newLane);
      }
    } else if (hasVLanes) {
      // Add horizontal lanes to enter matrix mode
      for (let i = 0; i < 2; i++) {
        const newLane: SwimlaneItem = {
          id: generateId('lane'),
          label: `Row ${i + 1}`,
          color: LANE_PALETTE[(vLanes.length + i) % LANE_PALETTE.length],
          collapsed: false,
          size: 200,
          order: i,
        };
        addLane('horizontal', newLane);
      }
    }
  }, [isMatrix, hasHLanes, hasVLanes, hLanes, vLanes, addLane, removeLane]);

  // Render a lane list for a given orientation
  const renderLaneList = (lanes: SwimlaneItem[], orientation: SwimlaneOrientation) => (
    <div className="flex flex-col gap-1.5">
      {[...lanes].sort((a, b) => a.order - b.order).map((lane) => (
        <div
          key={lane.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-white/50"
        >
          {/* Color picker */}
          <input
            type="color"
            value={lane.color}
            onChange={(e) => updateLane(orientation, lane.id, { color: e.target.value })}
            className="w-5 h-5 rounded border border-border cursor-pointer shrink-0"
          />
          {/* Label input */}
          <input
            type="text"
            value={lane.label}
            onChange={(e) => updateLane(orientation, lane.id, { label: e.target.value })}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs rounded border border-transparent
                       hover:border-border focus:border-primary focus:outline-none
                       bg-transparent"
          />
          {/* Remove button */}
          <button
            onClick={() => removeLane(orientation, lane.id)}
            className="p-0.5 rounded text-text-muted hover:text-danger hover:bg-danger/10
                       transition-colors cursor-pointer shrink-0"
            title="Remove lane"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {/* Add lane button */}
      <button
        onClick={() => handleAddLane(orientation)}
        disabled={lanes.length >= 10}
        className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium
                   text-primary hover:bg-primary/5 rounded-md border border-dashed border-primary/30
                   transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus size={12} />
        Add {orientation === 'horizontal' ? 'Row' : 'Column'}
      </button>
    </div>
  );

  if (!hasAnyLanes) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Rows3 size={20} className="text-text-muted" />
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          No swimlanes configured
        </p>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white
                     hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Create Swimlanes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current config info */}
      <Field label="Mode">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-border text-xs font-medium">
            {isMatrix ? (
              <Grid3X3 size={12} />
            ) : hasVLanes ? (
              <Columns3 size={12} />
            ) : (
              <Rows3 size={12} />
            )}
            {modeLabel}
          </span>
          {hasAnyLanes && (
            <button
              onClick={handleToggleMatrix}
              className="px-2 py-1 text-[10px] font-medium rounded border border-border
                         text-text-muted hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isMatrix ? 'Exit Matrix' : 'Matrix Mode'}
            </button>
          )}
        </div>
      </Field>

      {/* Container title */}
      <Field label="Container Title">
        <input
          type="text"
          value={config.containerTitle}
          onChange={(e) => setContainerTitle(e.target.value)}
          placeholder="Optional title"
          className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </Field>

      {/* Orientation toggle (only if not matrix) */}
      {!isMatrix && (
        <Field label="Orientation">
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (hasVLanes && !hasHLanes) {
                  // Switch vertical lanes to horizontal
                  const currentLanes = [...vLanes];
                  for (const lane of currentLanes) removeLane('vertical', lane.id);
                  for (const lane of currentLanes) {
                    addLane('horizontal', { ...lane, size: 200 });
                  }
                }
                setOrientation('horizontal');
              }}
              className={`
                flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium
                rounded-md border transition-colors cursor-pointer
                ${hasHLanes
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'border-border text-text-muted hover:bg-slate-50'
                }
              `}
            >
              <Rows3 size={12} /> Horizontal
            </button>
            <button
              onClick={() => {
                if (hasHLanes && !hasVLanes) {
                  // Switch horizontal lanes to vertical
                  const currentLanes = [...hLanes];
                  for (const lane of currentLanes) removeLane('horizontal', lane.id);
                  for (const lane of currentLanes) {
                    addLane('vertical', { ...lane, size: 250 });
                  }
                }
                setOrientation('vertical');
              }}
              className={`
                flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium
                rounded-md border transition-colors cursor-pointer
                ${hasVLanes
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'border-border text-text-muted hover:bg-slate-50'
                }
              `}
            >
              <Columns3 size={12} /> Vertical
            </button>
          </div>
        </Field>
      )}

      {/* Horizontal lanes */}
      {hasHLanes && (
        <Field label={`Rows (${hLanes.length})`}>
          {renderLaneList(hLanes, 'horizontal')}
        </Field>
      )}

      {/* Vertical lanes */}
      {hasVLanes && (
        <Field label={`Columns (${vLanes.length})`}>
          {renderLaneList(vLanes, 'vertical')}
        </Field>
      )}
    </div>
  );
});

SwimlanePanel.displayName = 'SwimlanePanel';

// ---------------------------------------------------------------------------
// Main PropertiesPanel
// ---------------------------------------------------------------------------

const PropertiesPanel: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const activePanelTab = useUIStore((s) => s.activePanelTab);
  const setActivePanelTab = useUIStore((s) => s.setActivePanelTab);
  const propertiesPanelOpen = useUIStore((s) => s.propertiesPanelOpen);

  // Selection
  const selectedNodes = useFlowStore((s) => s.selectedNodes);
  const selectedEdges = useFlowStore((s) => s.selectedEdges);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  // Find the first selected node
  const selectedNode = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    return nodes.find((n) => n.id === selectedNodes[0]) ?? null;
  }, [selectedNodes, nodes]);

  // Find the first selected edge
  const selectedEdge = useMemo(() => {
    if (selectedEdges.length === 0) return null;
    return edges.find((e) => e.id === selectedEdges[0]) ?? null;
  }, [selectedEdges, edges]);

  // Auto-switch to the Connector tab when an edge is selected
  useEffect(() => {
    if (selectedEdges.length > 0 && activePanelTab !== 'edge') {
      setActivePanelTab('edge');
    } else if (selectedNodes.length > 0 && selectedEdges.length === 0 && activePanelTab === 'edge') {
      setActivePanelTab('node');
    }
  }, [selectedEdges.length, selectedNodes.length, activePanelTab, setActivePanelTab]);

  if (!propertiesPanelOpen) return null;

  return (
    <div
      className={`
        flex flex-col w-[280px] shrink-0 border-l overflow-hidden
        ${darkMode
          ? 'bg-surface-alt-dark border-border-dark'
          : 'bg-surface-alt border-border'
        }
      `}
    >
      {/* Tab bar */}
      <div className="flex border-b border-inherit shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanelTab(tab.id)}
            className={`
              flex-1 py-2 text-[11px] font-medium tracking-wide uppercase
              transition-colors cursor-pointer
              ${activePanelTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto panel-scroll p-4 pb-8">
        {!selectedNode && activePanelTab === 'node' ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronRight size={20} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Select a node or connector to edit its properties
            </p>
          </div>
        ) : activePanelTab === 'node' && selectedNode ? (
          <NodePropsTab
            nodeId={selectedNode.id}
            data={selectedNode.data as FlowNodeData}
          />
        ) : activePanelTab === 'edge' ? (
          selectedEdge ? (
            <EdgePropertiesTab
              edgeId={selectedEdge.id}
              edgeData={(selectedEdge.data || {}) as FlowEdgeData}
              edgeType={selectedEdge.type}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronRight size={20} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Select a connector to edit its properties
              </p>
            </div>
          )
        ) : activePanelTab === 'deps' ? (
          selectedNode ? (
            <DependencyPanel
              nodeId={selectedNode.id}
              data={selectedNode.data as FlowNodeData}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronRight size={20} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Select a node to view its dependencies
              </p>
            </div>
          )
        ) : activePanelTab === 'lane' ? (
          <SwimlanePanel />
        ) : activePanelTab === 'data' ? (
          selectedNode ? (
            <DataTab
              nodeId={selectedNode.id}
              data={selectedNode.data as FlowNodeData}
              position={selectedNode.position}
              measured={selectedNode.measured}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronRight size={20} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Select a node to view its metadata
              </p>
            </div>
          )
        ) : (
          <PlaceholderTab name="Data" />
        )}
      </div>
    </div>
  );
};

export default React.memo(PropertiesPanel);
