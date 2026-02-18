// ---------------------------------------------------------------------------
// ChainHighlight.tsx -- Visual overlay for dependency chain highlighting
// ---------------------------------------------------------------------------

import React, { useMemo, useEffect } from 'react';
import { GitBranch, X } from 'lucide-react';

import { useFlowStore } from '../../store/flowStore';
import { useDependencyStore } from '../../store/dependencyStore';
import { useStyleStore } from '../../store/styleStore';
import {
  buildAdjacencyList,
  getUpstream,
  getDownstream,
} from '../../utils/dependencyGraph';

// ---------------------------------------------------------------------------
// Depth mapping utilities
// ---------------------------------------------------------------------------

/** BFS to compute minimum hop distance from a node in a given direction. */
function computeHopDistances(
  startId: string,
  adjacencyList: Map<string, { upstream: string[]; downstream: string[] }>,
  direction: 'upstream' | 'downstream',
): Map<string, number> {
  const distances = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
  distances.set(startId, 0);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const entry = adjacencyList.get(id);
    if (!entry) continue;

    const neighbors = direction === 'upstream' ? entry.upstream : entry.downstream;
    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, depth + 1);
        queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }

  return distances;
}

/** Map hop distance to CSS opacity. */
function opacityForDepth(depth: number): number {
  if (depth <= 1) return 1.0;
  if (depth === 2) return 0.75;
  return 0.5;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChainHighlight: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const highlightedChain = useDependencyStore((s) => s.highlightedChain);
  const clearHighlightedChain = useDependencyStore((s) => s.clearHighlightedChain);
  const setHighlightedChain = useDependencyStore((s) => s.setHighlightedChain);

  const edges = useFlowStore((s) => s.edges);
  const selectedNodes = useFlowStore((s) => s.selectedNodes);

  // Build adjacency list
  const adjacencyList = useMemo(
    () => buildAdjacencyList(edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))),
    [edges],
  );

  // Handle Ctrl+click to set highlighted chain
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && highlightedChain.size > 0) {
        clearHighlightedChain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightedChain.size, clearHighlightedChain]);

  // When Ctrl+click on a node, compute and set the chain
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      // Look for a clicked node in the selected nodes
      const target = e.target as HTMLElement;
      const nodeEl = target.closest('.react-flow__node');
      if (!nodeEl) return;

      const nodeId = nodeEl.getAttribute('data-id');
      if (!nodeId) return;

      // Compute full chain
      const upstream = getUpstream(nodeId, adjacencyList);
      const downstream = getDownstream(nodeId, adjacencyList);
      const chain = new Set([...upstream, nodeId, ...downstream]);
      setHighlightedChain(chain);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [adjacencyList, setHighlightedChain]);

  // Compute chain stats
  const chainStats = useMemo(() => {
    if (highlightedChain.size === 0) return null;

    // Find the "origin" node -- the first selected node that's in the chain
    let originId: string | null = null;
    for (const id of selectedNodes) {
      if (highlightedChain.has(id)) {
        originId = id;
        break;
      }
    }
    // Fallback: pick any node in the chain
    if (!originId) {
      originId = highlightedChain.values().next().value ?? null;
    }
    if (!originId) return null;

    const upstream = getUpstream(originId, adjacencyList);
    const downstream = getDownstream(originId, adjacencyList);

    return {
      total: highlightedChain.size,
      upstream: upstream.size,
      downstream: downstream.size,
      originId,
    };
  }, [highlightedChain, selectedNodes, adjacencyList]);

  // Apply opacity overlay via CSS custom properties on nodes
  // This component injects a style tag to handle the opacity
  const styleContent = useMemo(() => {
    if (highlightedChain.size === 0) return '';

    const originId = chainStats?.originId;
    if (!originId) return '';

    // Compute hop distances from the origin
    const upDist = computeHopDistances(originId, adjacencyList, 'upstream');
    const downDist = computeHopDistances(originId, adjacencyList, 'downstream');

    // Merge: use minimum distance from either direction
    const allDistances = new Map<string, number>();
    allDistances.set(originId, 0);
    for (const [id, d] of upDist) {
      allDistances.set(id, Math.min(d, allDistances.get(id) ?? Infinity));
    }
    for (const [id, d] of downDist) {
      allDistances.set(id, Math.min(d, allDistances.get(id) ?? Infinity));
    }

    // Build CSS rules
    const rules: string[] = [];

    // Dim all nodes first
    rules.push(`.react-flow__node { opacity: 0.1 !important; transition: opacity 0.3s ease !important; }`);
    // Dim all edges
    rules.push(`.react-flow__edge { opacity: 0.1 !important; transition: opacity 0.3s ease !important; }`);

    // Set opacity for chain nodes
    for (const id of highlightedChain) {
      const depth = allDistances.get(id) ?? 3;
      const opacity = opacityForDepth(depth);
      rules.push(`.react-flow__node[data-id="${id}"] { opacity: ${opacity} !important; }`);
    }

    // Highlight edges within the chain
    for (const edge of edges) {
      if (highlightedChain.has(edge.source) && highlightedChain.has(edge.target)) {
        const srcDepth = allDistances.get(edge.source) ?? 3;
        const tgtDepth = allDistances.get(edge.target) ?? 3;
        const opacity = opacityForDepth(Math.max(srcDepth, tgtDepth));
        rules.push(`.react-flow__edge[data-testid="rf__edge-${edge.id}"] { opacity: ${opacity} !important; }`);
      }
    }

    return rules.join('\n');
  }, [highlightedChain, chainStats, adjacencyList, edges]);

  if (highlightedChain.size === 0) return null;

  const bgPanel = darkMode
    ? 'bg-slate-800/95 border-slate-600 text-slate-200'
    : 'bg-white/95 border-slate-300 text-slate-700';

  return (
    <>
      {/* Inject dynamic opacity styles */}
      {styleContent && <style>{styleContent}</style>}

      {/* Chain info counter */}
      <div
        className={`
          absolute top-14 left-1/2 -translate-x-1/2 z-50
          flex items-center gap-2 px-4 py-2 rounded-full
          border shadow-lg backdrop-blur-sm
          ${bgPanel}
        `}
      >
        <GitBranch size={14} className="shrink-0" />
        <span className="text-xs font-semibold whitespace-nowrap">
          {chainStats
            ? `${chainStats.total} nodes in chain (${chainStats.upstream} upstream, ${chainStats.downstream} downstream)`
            : `${highlightedChain.size} nodes in chain`}
        </span>
        <button
          onClick={clearHighlightedChain}
          className={`
            ml-1 p-0.5 rounded-full transition-colors cursor-pointer
            ${darkMode
              ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }
          `}
          data-tooltip="Clear chain highlight (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
};

export default React.memo(ChainHighlight);
