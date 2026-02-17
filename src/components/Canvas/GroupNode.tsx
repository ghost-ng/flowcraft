import React from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { useFlowStore, type FlowNodeData } from '../../store/flowStore';
import { useUIStore } from '../../store/uiStore';

const GroupNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const selectionColor = useUIStore((s) => s.selectionColor);
  const label = nodeData.label || 'Group';
  const fillColor = nodeData.color || '#f1f5f9';
  const borderColor = nodeData.borderColor || '#94a3b8';
  const textColor = nodeData.textColor || '#475569';
  const width = nodeData.width || 300;
  const height = nodeData.height || 200;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: fillColor,
        border: `2px ${selected ? `solid ${selectionColor}` : `dashed ${borderColor}`}`,
        borderRadius: 8,
        opacity: nodeData.opacity ?? 0.6,
        position: 'relative',
      }}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={100}
        minHeight={80}
        lineStyle={{ borderColor: selectionColor, borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'white',
          border: `1.5px solid ${selectionColor}`,
        }}
        onResize={(_event, params) => {
          useFlowStore
            .getState()
            .updateNodeData(id, { width: params.width, height: params.height });
        }}
      />

      {/* Group label at top */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 8,
          fontSize: 12,
          fontWeight: 600,
          color: textColor,
          fontFamily: "'Inter', sans-serif",
          userSelect: 'none',
        }}
      >
        {label}
      </div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(GroupNode);
