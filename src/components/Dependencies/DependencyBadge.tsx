// ---------------------------------------------------------------------------
// DependencyBadge.tsx -- Small overlay badges on nodes showing dependency counts
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { useDependencyStore } from '../../store/dependencyStore';
import { useFlowStore, type FlowNodeData, getStatusIndicators } from '../../store/flowStore';
import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DependencyBadgeProps {
  nodeId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DependencyBadge: React.FC<DependencyBadgeProps> = ({ nodeId }) => {
  const showBadges = useDependencyStore((s) => s.showBadges);
  const showReadyBlocked = useDependencyStore((s) => s.showReadyBlocked);
  const dependencyCounts = useDependencyStore((s) => s.dependencyCounts);
  const darkMode = useStyleStore((s) => s.darkMode);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  // Compute upstream / downstream counts from dependencyCounts map or edges
  const counts = useMemo(() => {
    const stored = dependencyCounts.get(nodeId);
    if (stored) return stored;

    // Fallback: compute from edges
    let inCount = 0;
    let outCount = 0;
    for (const edge of edges) {
      if (edge.target === nodeId) inCount++;
      if (edge.source === nodeId) outCount++;
    }
    return { in: inCount, out: outCount };
  }, [dependencyCounts, nodeId, edges]);

  // Determine ready/blocked status from node data
  const isBlocked = useMemo(() => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    const data = node.data as FlowNodeData;
    // Only blocked if explicitly marked with blockedBy data
    if (data.blockedBy && data.blockedBy.length > 0) return true;
    // Or if there are incoming dependency edges of type 'blocks'
    return edges.some(
      (e) => e.target === nodeId && e.data?.dependencyType === 'blocks'
    );
  }, [nodes, nodeId, edges]);

  // Check if there are status pucks at the same corners as the badges
  const puckOffset = useMemo(() => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { left: 0, right: 0 };
    const pucks = getStatusIndicators(node.data as FlowNodeData);
    let leftMax = 0;
    let rightMax = 0;
    for (const p of pucks) {
      const pos = p.position ?? 'top-right';
      const sz = (p.size ?? 12) + ((p.borderWidth ?? 1) * 2) + 4; // diameter + border + gap
      if (pos === 'top-left') leftMax = Math.max(leftMax, sz);
      if (pos === 'top-right') rightMax = Math.max(rightMax, sz);
    }
    return { left: leftMax, right: rightMax };
  }, [nodes, nodeId]);

  if (!showBadges) return null;
  if (counts.in === 0 && counts.out === 0) return null;

  const bgBase = darkMode ? 'bg-dk-panel' : 'bg-white';
  const textBase = darkMode ? 'text-dk-text' : 'text-slate-700';
  const borderBase = darkMode ? 'border-dk-border' : 'border-slate-300';
  const shadowClass = darkMode ? 'shadow-md shadow-black/20' : 'shadow-sm';

  return (
    <>
      {/* Upstream count badge (top-left) — elevated above pucks if present */}
      {counts.in > 0 && (
        <div
          className={`
            absolute -left-2.5 z-10
            flex items-center justify-center
            min-w-[22px] h-[22px] px-1
            rounded-full border text-[10px] font-semibold leading-none
            ${bgBase} ${textBase} ${borderBase} ${shadowClass}
          `}
          style={{ top: -(10 + puckOffset.left) }}
          title={`${counts.in} upstream dependency${counts.in > 1 ? 'ies' : ''}`}
        >
          {counts.in}
          <span className="text-[8px] ml-px">&#8593;</span>
        </div>
      )}

      {/* Downstream count badge (top-right) — elevated above pucks if present */}
      {counts.out > 0 && (
        <div
          className={`
            absolute -right-2.5 z-10
            flex items-center justify-center
            min-w-[22px] h-[22px] px-1
            rounded-full border text-[10px] font-semibold leading-none
            ${bgBase} ${textBase} ${borderBase} ${shadowClass}
          `}
          style={{ top: -(10 + puckOffset.right) }}
          title={`${counts.out} downstream dependency${counts.out > 1 ? 'ies' : ''}`}
        >
          {counts.out}
          <span className="text-[8px] ml-px">&#8595;</span>
        </div>
      )}

      {/* Ready/Blocked indicator dot (bottom-center) */}
      {showReadyBlocked && (
        <div
          className={`
            absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10
            w-3 h-3 rounded-full border-2
            ${isBlocked
              ? 'bg-red-500 border-red-300'
              : 'bg-emerald-500 border-emerald-300'
            }
            ${shadowClass}
          `}
          title={isBlocked ? 'Blocked' : 'Ready'}
        />
      )}
    </>
  );
};

export default React.memo(DependencyBadge);
