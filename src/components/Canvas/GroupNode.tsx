import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { icons } from 'lucide-react';
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
  const borderWidth = nodeData.borderWidth ?? 2;
  const borderStyle = selected ? 'solid' : (nodeData.borderStyle || 'dashed');
  const borderRadius = nodeData.borderRadius ?? 8;
  const fontSize = nodeData.fontSize ?? 12;
  const fontWeight = nodeData.fontWeight ?? 600;
  const fontFamily = nodeData.fontFamily || "'Inter', sans-serif";

  // Icon support
  const IconComponent = nodeData.icon
    ? (icons as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[nodeData.icon]
    : null;
  const iconColor = nodeData.iconColor || textColor;
  const iconBgColor = nodeData.iconBgColor;
  const iconBorderColor = nodeData.iconBorderColor;
  const iconBorderWidth = nodeData.iconBorderWidth ?? 0;
  const iconSize = nodeData.iconSize || (fontSize + 2);

  const renderIcon = () => {
    if (!IconComponent) return null;
    const iconEl = <IconComponent size={iconSize} className="shrink-0 block" style={{ color: iconColor }} />;
    const hasWrapper = iconBgColor || (iconBorderColor && iconBorderWidth > 0);
    if (!hasWrapper) return iconEl;
    return (
      <span
        className="inline-flex items-center justify-center shrink-0 rounded"
        style={{
          backgroundColor: iconBgColor || 'transparent',
          border: iconBorderWidth > 0 && iconBorderColor ? `${iconBorderWidth}px solid ${iconBorderColor}` : undefined,
          padding: 2,
        }}
      >
        {iconEl}
      </span>
    );
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      useFlowStore.getState().updateNodeData(id, { label: trimmed });
    }
    setIsEditing(false);
  }, [editValue, label, id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(label);
    setIsEditing(true);
  }, [label]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { commitEdit(); }
    if (e.key === 'Escape') { setIsEditing(false); }
  }, [commitEdit]);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: fillColor,
        border: `${borderWidth}px ${selected ? `solid ${selectionColor}` : `${borderStyle} ${borderColor}`}`,
        borderRadius,
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

      {/* Group label at top — double-click to edit */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: 2,
            left: 6,
            fontSize,
            fontWeight,
            color: textColor,
            fontFamily,
            backgroundColor: 'transparent',
            border: `1px solid ${selectionColor || '#3b82f6'}`,
            borderRadius: 3,
            outline: 'none',
            padding: '1px 3px',
            minWidth: 40,
            maxWidth: width - 16,
          }}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            top: 4,
            left: 8,
            fontSize,
            fontWeight,
            color: textColor,
            fontFamily,
            userSelect: 'none',
            cursor: 'var(--cursor-select)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {renderIcon()}
          {label}
        </div>
      )}

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(GroupNode);
