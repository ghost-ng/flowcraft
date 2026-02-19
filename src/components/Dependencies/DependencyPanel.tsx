// ---------------------------------------------------------------------------
// DependencyPanel.tsx -- Full dependency tab for the Properties Panel
// ---------------------------------------------------------------------------

import React, { useMemo, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Link2,
  X,
  Plus,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';

import { useFlowStore, type FlowNode, type FlowNodeData } from '../../store/flowStore';
import { useDependencyStore, type DependencyLinkType } from '../../store/dependencyStore';
import { useStyleStore } from '../../store/styleStore';
import {
  buildAdjacencyList,
  getUpstream,
  getDownstream,
  criticalPath,
} from '../../utils/dependencyGraph';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DependencyPanelProps {
  nodeId: string;
  data: FlowNodeData;
}

interface DependencyRow {
  nodeId: string;
  nodeLabel: string;
  edgeId: string;
  type: DependencyLinkType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Upstream: selected node depends on X → "Prerequisite", "Blocked By", "Related"
const UPSTREAM_TYPE_OPTIONS: { value: DependencyLinkType; label: string }[] = [
  { value: 'depends-on', label: 'Prerequisite' },
  { value: 'blocks', label: 'Blocked By' },
  { value: 'related', label: 'Related' },
];

// Downstream: X depends on selected node → "Enables", "Blocks", "Related"
const DOWNSTREAM_TYPE_OPTIONS: { value: DependencyLinkType; label: string }[] = [
  { value: 'depends-on', label: 'Enables' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'related', label: 'Related' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DepRowProps {
  row: DependencyRow;
  darkMode: boolean;
  direction: 'upstream' | 'downstream';
  onRemove: (edgeId: string) => void;
  onChangeType: (edgeId: string, newType: DependencyLinkType) => void;
}

const DepRow: React.FC<DepRowProps> = React.memo(
  ({ row, darkMode, direction, onRemove, onChangeType }) => {
    const typeOptions = direction === 'upstream' ? UPSTREAM_TYPE_OPTIONS : DOWNSTREAM_TYPE_OPTIONS;
    const bgHover = darkMode ? 'hover:bg-dk-hover/50' : 'hover:bg-slate-50';
    const borderClr = darkMode ? 'border-dk-border' : 'border-slate-200';
    const textClr = darkMode ? 'text-dk-text' : 'text-slate-700';
    const mutedClr = darkMode ? 'text-dk-muted' : 'text-slate-500';

    return (
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-md border
          transition-colors ${bgHover} ${borderClr}
        `}
      >
        {/* Node label */}
        <span className={`flex-1 text-xs font-medium truncate ${textClr}`}>
          {row.nodeLabel}
        </span>

        {/* Type dropdown */}
        <select
          value={row.type}
          onChange={(e) =>
            onChangeType(row.edgeId, e.target.value as DependencyLinkType)
          }
          className={`
            text-[10px] px-1 py-0.5 rounded border cursor-pointer
            ${darkMode
              ? 'bg-dk-panel border-dk-border text-dk-muted'
              : 'bg-white border-slate-300 text-slate-600'
            }
            focus:outline-none focus:ring-1 focus:ring-blue-400
          `}
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Remove button */}
        <button
          onClick={() => onRemove(row.edgeId)}
          className={`
            p-0.5 rounded transition-colors cursor-pointer
            ${mutedClr} hover:text-red-500
            ${darkMode ? 'hover:bg-dk-hover' : 'hover:bg-red-50'}
          `}
          data-tooltip-left="Remove dependency"
        >
          <X size={12} />
        </button>
      </div>
    );
  },
);

DepRow.displayName = 'DepRow';

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  darkMode: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  count,
  darkMode,
}) => {
  const textClr = darkMode ? 'text-dk-muted' : 'text-slate-600';
  const countBg = darkMode ? 'bg-dk-hover text-dk-muted' : 'bg-slate-100 text-slate-500';

  return (
    <div className={`flex items-center gap-1.5 mb-1.5 ${textClr}`}>
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wide">
        {title}
      </span>
      <span
        className={`
          ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${countBg}
        `}
      >
        {count}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DependencyPanel: React.FC<DependencyPanelProps> = ({ nodeId }) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const setEdges = useFlowStore((s) => s.setEdges);
  const addNode = useFlowStore((s) => s.addNode);
  const onConnect = useFlowStore((s) => s.onConnect);
  const criticalPathEnabled = useDependencyStore((s) => s.criticalPathEnabled);

  // Build a node label lookup map
  const nodeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      map.set(n.id, (n.data as FlowNodeData).label || n.id);
    }
    return map;
  }, [nodes]);

  // Build adjacency list from all edges
  const adjacencyList = useMemo(
    () => buildAdjacencyList(edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))),
    [edges],
  );

  // Compute critical path nodes
  const criticalPathNodes = useMemo(() => {
    if (!criticalPathEnabled) return new Set<string>();
    const cp = criticalPath(adjacencyList);
    return new Set(cp);
  }, [adjacencyList, criticalPathEnabled]);

  // Upstream: edges where this node is the target (something -> this node)
  const upstreamRows = useMemo<DependencyRow[]>(() => {
    return edges
      .filter((e) => e.target === nodeId)
      .map((e) => ({
        nodeId: e.source,
        nodeLabel: nodeLabelMap.get(e.source) || e.source,
        edgeId: e.id,
        type: (e.data?.dependencyType as DependencyLinkType) || 'depends-on',
      }));
  }, [edges, nodeId, nodeLabelMap]);

  // Downstream: edges where this node is the source (this node -> something)
  const downstreamRows = useMemo<DependencyRow[]>(() => {
    return edges
      .filter((e) => e.source === nodeId)
      .map((e) => ({
        nodeId: e.target,
        nodeLabel: nodeLabelMap.get(e.target) || e.target,
        edgeId: e.id,
        type: (e.data?.dependencyType as DependencyLinkType) || 'depends-on',
      }));
  }, [edges, nodeId, nodeLabelMap]);

  // Related: edges with type 'related' that touch this node
  const relatedRows = useMemo<DependencyRow[]>(() => {
    return edges
      .filter(
        (e) =>
          (e.source === nodeId || e.target === nodeId) &&
          e.data?.dependencyType === 'related',
      )
      .map((e) => {
        const otherId = e.source === nodeId ? e.target : e.source;
        return {
          nodeId: otherId,
          nodeLabel: nodeLabelMap.get(otherId) || otherId,
          edgeId: e.id,
          type: 'related' as DependencyLinkType,
        };
      });
  }, [edges, nodeId, nodeLabelMap]);

  // Chain depth info
  const chainDepth = useMemo(() => {
    const upstream = getUpstream(nodeId, adjacencyList);
    const downstream = getDownstream(nodeId, adjacencyList);
    return {
      upstreamDepth: upstream.size,
      downstreamDepth: downstream.size,
      total: upstream.size + downstream.size + 1,
    };
  }, [nodeId, adjacencyList]);

  const isOnCriticalPath = criticalPathNodes.has(nodeId);

  // -- Handlers ---------------------------------------------------------------

  const handleRemove = useCallback(
    (edgeId: string) => {
      setEdges(edges.filter((e) => e.id !== edgeId));
    },
    [edges, setEdges],
  );

  const handleChangeType = useCallback(
    (edgeId: string, newType: DependencyLinkType) => {
      setEdges(
        edges.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...e.data, dependencyType: newType } }
            : e,
        ),
      );
    },
    [edges, setEdges],
  );

  const handleAddUpstream = useCallback(() => {
    // Create a placeholder node and connect it as upstream
    const newId = `node_${Date.now()}_dep`;
    const newNode: FlowNode = {
      id: newId,
      type: 'shapeNode',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: 'New Dep', shape: 'rectangle' },
    };
    addNode(newNode);
    onConnect({
      source: newId,
      target: nodeId,
      sourceHandle: null,
      targetHandle: null,
    });
  }, [nodeId, addNode, onConnect]);

  const handleAddDownstream = useCallback(() => {
    const newId = `node_${Date.now()}_dep`;
    const newNode: FlowNode = {
      id: newId,
      type: 'shapeNode',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: 'New Dep', shape: 'rectangle' },
    };
    addNode(newNode);
    onConnect({
      source: nodeId,
      target: newId,
      sourceHandle: null,
      targetHandle: null,
    });
  }, [nodeId, addNode, onConnect]);

  // -- Styles -----------------------------------------------------------------

  const sectionBorder = darkMode ? 'border-dk-border' : 'border-slate-200';
  const mutedText = darkMode ? 'text-dk-muted' : 'text-slate-500';
  const btnClasses = darkMode
    ? 'bg-dk-hover hover:bg-dk-border text-dk-text border-dk-border'
    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300';

  return (
    <div className="flex flex-col gap-4">
      {/* Critical Path Indicator */}
      {criticalPathEnabled && isOnCriticalPath && (
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border
            ${darkMode
              ? 'bg-red-900/30 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
            }
          `}
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span className="text-xs font-semibold">On Critical Path</span>
        </div>
      )}

      {/* Chain Depth Info */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border
          ${darkMode
            ? 'bg-dk-panel border-dk-border text-dk-muted'
            : 'bg-slate-50 border-slate-200 text-slate-600'
          }
        `}
      >
        <GitBranch size={14} className="shrink-0" />
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold">Chain Depth</span>
          <span className={`text-[10px] ${mutedText}`}>
            {chainDepth.upstreamDepth} upstream &middot; {chainDepth.downstreamDepth} downstream &middot; {chainDepth.total} total
          </span>
        </div>
      </div>

      {/* UPSTREAM Section */}
      <div className={`pb-3 border-b ${sectionBorder}`}>
        <SectionHeader
          icon={<ArrowUp size={13} />}
          title="Upstream (prerequisites)"
          count={upstreamRows.length}
          darkMode={darkMode}
        />
        {upstreamRows.length === 0 ? (
          <p className={`text-[11px] ${mutedText} italic px-1`}>
            No upstream dependencies
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {upstreamRows.map((row) => (
              <DepRow
                key={row.edgeId}
                row={row}
                darkMode={darkMode}
                direction="upstream"
                onRemove={handleRemove}
                onChangeType={handleChangeType}
              />
            ))}
          </div>
        )}
        <button
          onClick={handleAddUpstream}
          className={`
            mt-2 flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border
            transition-colors cursor-pointer ${btnClasses}
          `}
        >
          <Plus size={12} />
          Add Upstream
        </button>
      </div>

      {/* DOWNSTREAM Section */}
      <div className={`pb-3 border-b ${sectionBorder}`}>
        <SectionHeader
          icon={<ArrowDown size={13} />}
          title="Downstream (this enables)"
          count={downstreamRows.length}
          darkMode={darkMode}
        />
        {downstreamRows.length === 0 ? (
          <p className={`text-[11px] ${mutedText} italic px-1`}>
            No downstream dependencies
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {downstreamRows.map((row) => (
              <DepRow
                key={row.edgeId}
                row={row}
                darkMode={darkMode}
                direction="downstream"
                onRemove={handleRemove}
                onChangeType={handleChangeType}
              />
            ))}
          </div>
        )}
        <button
          onClick={handleAddDownstream}
          className={`
            mt-2 flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border
            transition-colors cursor-pointer ${btnClasses}
          `}
        >
          <Plus size={12} />
          Add Downstream
        </button>
      </div>

      {/* RELATED Section */}
      <div>
        <SectionHeader
          icon={<Link2 size={13} />}
          title="Related"
          count={relatedRows.length}
          darkMode={darkMode}
        />
        {relatedRows.length === 0 ? (
          <p className={`text-[11px] ${mutedText} italic px-1`}>
            No related nodes
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {relatedRows.map((row) => (
              <DepRow
                key={row.edgeId}
                row={row}
                darkMode={darkMode}
                direction="downstream"
                onRemove={handleRemove}
                onChangeType={handleChangeType}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DependencyPanel);
