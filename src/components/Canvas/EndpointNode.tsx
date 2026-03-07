// ---------------------------------------------------------------------------
// EndpointNode.tsx — Tiny handle-dot node used as connector endpoints
// ---------------------------------------------------------------------------

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useFlowStore } from '../../store/flowStore';
import { CURSOR_OPEN_HAND } from '../../assets/cursors/cursors';

const EndpointNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const selectionColor = useUIStore((s) => s.selectionColor);
  const presentationMode = useUIStore((s) => s.presentationMode);

  // Show the dot only when the endpoint node OR its parent edge is selected
  const connectorEdgeId = (data as Record<string, unknown>)?.connectorEdgeId as string | undefined;
  const edgeSelected = useFlowStore((s) =>
    connectorEdgeId ? s.edges.some((e) => e.id === connectorEdgeId && e.selected) : false,
  );
  void id; // used by React Flow internally

  const size = 12;
  const isSelected = !!selected && !presentationMode;
  const visible = (isSelected || edgeSelected) && !presentationMode;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'white',
        border: `1.5px solid ${selectionColor}`,
        boxShadow: isSelected ? `0 0 0 2px ${selectionColor}` : undefined,
        cursor: CURSOR_OPEN_HAND,
        opacity: visible ? 1 : 0,
        pointerEvents: presentationMode ? 'none' : 'auto',
      }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Single centered handle for both source and target connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="center"
        className="charthero-handle"
        style={{
          width: 1,
          height: 1,
          opacity: 0,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="center"
        className="charthero-handle"
        style={{
          width: 1,
          height: 1,
          opacity: 0,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

export default memo(EndpointNode);
