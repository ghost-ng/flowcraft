// ---------------------------------------------------------------------------
// RemoteSelectionHighlight — Visual feedback for nodes/edges selected by
// remote users. Shows a colored ring/glow around nodes that other users
// have selected, plus a small name badge.
//
// Positions are in flow-space. We apply the viewport transform (pan + zoom)
// to map them to screen-space, matching the ReactFlow viewport pane.
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { useViewport } from '@xyflow/react';
import { useCollabStore } from '../../store/collabStore';
import { useFlowStore } from '../../store/flowStore';

interface RemoteNodeHighlight {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  userName: string;
  userColor: string;
}

const RemoteSelectionHighlight: React.FC = () => {
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const nodes = useFlowStore((s) => s.nodes);
  const viewport = useViewport();

  const highlights = useMemo(() => {
    const result: RemoteNodeHighlight[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const user of remoteUsers) {
      for (const nodeId of user.selectedNodeIds) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;
        const w = (node.data?.width as number) || (node.measured?.width) || 160;
        const h = (node.data?.height as number) || (node.measured?.height) || 60;
        result.push({
          nodeId,
          x: node.position.x,
          y: node.position.y,
          width: w,
          height: h,
          userName: user.name,
          userColor: user.color,
        });
      }
    }
    return result;
  }, [remoteUsers, nodes]);

  if (highlights.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[99]" style={{ overflow: 'visible' }}>
      {/* Apply viewport transform so flow-space coords match the canvas */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {highlights.map((h) => (
          <div
            key={`${h.nodeId}-${h.userColor}`}
            className="absolute"
            style={{
              left: h.x - 4,
              top: h.y - 4,
              width: h.width + 8,
              height: h.height + 8,
              borderRadius: 8,
              border: `2px solid ${h.userColor}`,
              boxShadow: `0 0 8px ${h.userColor}40`,
              transition: 'left 100ms ease-out, top 100ms ease-out, width 100ms ease-out, height 100ms ease-out',
            }}
          >
            {/* User name badge — inverse scale so it stays constant screen-size */}
            <div
              className="absolute -top-5 left-0 px-1 py-0.5 rounded text-[8px] font-medium whitespace-nowrap"
              style={{
                backgroundColor: h.userColor,
                color: '#ffffff',
                lineHeight: 1,
                transform: `scale(${1 / viewport.zoom})`,
                transformOrigin: '0 100%',
              }}
            >
              {h.userName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(RemoteSelectionHighlight);
