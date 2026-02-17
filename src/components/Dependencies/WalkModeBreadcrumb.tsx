// ---------------------------------------------------------------------------
// WalkModeBreadcrumb.tsx -- Breadcrumb trail shown at top of canvas during walk mode
// ---------------------------------------------------------------------------

import React, { useMemo, useCallback } from 'react';
import { ChevronRight, X, Footprints } from 'lucide-react';

import { useFlowStore, type FlowNodeData } from '../../store/flowStore';
import { useDependencyStore } from '../../store/dependencyStore';
import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WalkModeBreadcrumb: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);

  const walkModeActive = useDependencyStore((s) => s.walkModeActive);
  const walkModeNodeId = useDependencyStore((s) => s.walkModeNodeId);
  const walkModePath = useDependencyStore((s) => s.walkModePath);
  const walkTo = useDependencyStore((s) => s.walkTo);
  const stopWalkMode = useDependencyStore((s) => s.stopWalkMode);

  const nodes = useFlowStore((s) => s.nodes);
  const setSelectedNodes = useFlowStore((s) => s.setSelectedNodes);

  // Build a label lookup for path nodes
  const nodeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      map.set(n.id, (n.data as FlowNodeData).label || n.id);
    }
    return map;
  }, [nodes]);

  // Build breadcrumb items
  const breadcrumbs = useMemo(() => {
    return walkModePath.map((nid) => ({
      id: nid,
      label: nodeLabelMap.get(nid) || nid,
      isCurrent: nid === walkModeNodeId,
    }));
  }, [walkModePath, walkModeNodeId, nodeLabelMap]);

  const handleCrumbClick = useCallback(
    (nodeId: string) => {
      walkTo(nodeId);
      setSelectedNodes([nodeId]);
    },
    [walkTo, setSelectedNodes],
  );

  const handleExit = useCallback(() => {
    stopWalkMode();
  }, [stopWalkMode]);

  if (!walkModeActive || walkModePath.length === 0) return null;

  // Style classes
  const barBg = darkMode
    ? 'bg-slate-800/95 border-slate-600'
    : 'bg-white/95 border-slate-200';
  const pillBase = darkMode
    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-slate-100'
    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800';
  const pillActive = darkMode
    ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40'
    : 'bg-blue-500 text-white border-blue-400 ring-2 ring-blue-300/40';
  const chevronClr = darkMode ? 'text-slate-500' : 'text-slate-400';
  const exitBtnClr = darkMode
    ? 'bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border-slate-600'
    : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-200';

  return (
    <div
      className={`
        absolute top-3 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-1.5 px-3 py-2
        rounded-xl border shadow-lg backdrop-blur-sm
        max-w-[90vw] overflow-x-auto
        ${barBg}
      `}
    >
      {/* Walk mode icon */}
      <Footprints
        size={16}
        className={`shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}
      />

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            {idx > 0 && (
              <ChevronRight size={12} className={`shrink-0 ${chevronClr}`} />
            )}
            <button
              onClick={() => handleCrumbClick(crumb.id)}
              className={`
                shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium
                border transition-all cursor-pointer whitespace-nowrap
                ${crumb.isCurrent ? pillActive : pillBase}
              `}
              title={
                crumb.isCurrent
                  ? `${crumb.label} (current)`
                  : `Jump to ${crumb.label}`
              }
            >
              {crumb.label}
              {crumb.isCurrent && (
                <span className="ml-1 text-[9px] opacity-80">&#9668;</span>
              )}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Separator */}
      <div
        className={`
          w-px h-5 mx-1 shrink-0
          ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}
        `}
      />

      {/* Exit walk mode button */}
      <button
        onClick={handleExit}
        className={`
          shrink-0 flex items-center gap-1 px-2.5 py-1
          rounded-full text-[11px] font-medium border
          transition-colors cursor-pointer whitespace-nowrap
          ${exitBtnClr}
        `}
        title="Exit Walk Mode"
      >
        <X size={12} />
        Exit
      </button>
    </div>
  );
};

export default React.memo(WalkModeBreadcrumb);
