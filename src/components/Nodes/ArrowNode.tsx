// ---------------------------------------------------------------------------
// ArrowNode.tsx -- Standalone arrow-shaped nodes (block arrows, chevrons, etc.)
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowStore, type FlowNodeData } from '../../store/flowStore';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Arrow direction type
// ---------------------------------------------------------------------------

type ArrowDirection = 'right' | 'left' | 'up' | 'down';

// ---------------------------------------------------------------------------
// Rotation map for directions
// ---------------------------------------------------------------------------

const directionRotation: Record<ArrowDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

// ---------------------------------------------------------------------------
// SVG Arrow shape renderers (all drawn pointing right in a 160x80 viewBox)
// ---------------------------------------------------------------------------

interface ArrowSvgProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

/** Block Arrow: thick filled arrow body with triangular head */
const BlockArrowSvg: React.FC<ArrowSvgProps> = ({ fill, stroke, strokeWidth }) => (
  <path
    d="M 0 20 L 100 20 L 100 5 L 155 40 L 100 75 L 100 60 L 0 60 Z"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
  />
);

/** Chevron Arrow: wide chevron/ribbon shape */
const ChevronArrowSvg: React.FC<ArrowSvgProps> = ({ fill, stroke, strokeWidth }) => (
  <path
    d="M 0 5 L 115 5 L 155 40 L 115 75 L 0 75 L 40 40 Z"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
  />
);

/** Double Arrow: arrowheads on both ends */
const DoubleArrowSvg: React.FC<ArrowSvgProps> = ({ fill, stroke, strokeWidth }) => (
  <path
    d="M 40 5 L 0 40 L 40 75 L 40 55 L 120 55 L 120 75 L 160 40 L 120 5 L 120 25 L 40 25 Z"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
  />
);

/** Circular Arrow: partial circle with arrowhead (for cycles) */
const CircularArrowSvg: React.FC<ArrowSvgProps> = ({ fill, stroke, strokeWidth }) => (
  <>
    <path
      d="M 80 8 A 35 35 0 1 1 42 18"
      fill="none"
      stroke={fill}
      strokeWidth={12}
      strokeLinecap="round"
    />
    <polygon
      points="30,2 50,18 28,26"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </>
);

// ---------------------------------------------------------------------------
// Shape mapping
// ---------------------------------------------------------------------------

const arrowShapeMap: Record<string, React.FC<ArrowSvgProps>> = {
  blockArrow: BlockArrowSvg,
  chevronArrow: ChevronArrowSvg,
  doubleArrow: DoubleArrowSvg,
  circularArrow: CircularArrowSvg,
};

const arrowDefaultColors: Record<string, string> = {
  blockArrow: '#3b82f6',
  chevronArrow: '#8b5cf6',
  doubleArrow: '#f59e0b',
  circularArrow: '#10b981',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ArrowNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const isEditingNode = useUIStore((s) => s.isEditingNode);
  const setIsEditingNode = useUIStore((s) => s.setIsEditingNode);

  const isEditing = isEditingNode === id;
  const [editValue, setEditValue] = useState(nodeData.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const shape = nodeData.shape || 'blockArrow';
  const fillColor = nodeData.color || arrowDefaultColors[shape] || '#3b82f6';
  const borderColor = nodeData.borderColor || 'transparent';
  const textColor = nodeData.textColor || '#ffffff';
  const fontSize = nodeData.fontSize || 13;
  const direction: ArrowDirection =
    (nodeData.direction as ArrowDirection) || 'right';

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when data changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(nodeData.label);
    }
  }, [nodeData.label, isEditing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditingNode(id);
    },
    [id, setIsEditingNode],
  );

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== nodeData.label) {
      updateNodeData(id, { label: trimmed });
    } else {
      setEditValue(nodeData.label);
    }
    setIsEditingNode(null);
  }, [editValue, nodeData.label, id, updateNodeData, setIsEditingNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        setEditValue(nodeData.label);
        setIsEditingNode(null);
      }
    },
    [commitEdit, nodeData.label, setIsEditingNode],
  );

  // Determine dimensions -- circular arrow is square
  const isCircular = shape === 'circularArrow';
  const width = isCircular ? 100 : 160;
  const height = isCircular ? 100 : 80;

  const ArrowShape = arrowShapeMap[shape] || BlockArrowSvg;
  const rotation = directionRotation[direction];
  const viewBox = isCircular ? '0 0 100 80' : '0 0 160 80';

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        boxShadow: selected
          ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: 4,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* SVG arrow shape */}
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        }}
      >
        <ArrowShape
          fill={fillColor}
          stroke={selected ? '#3b82f6' : borderColor}
          strokeWidth={selected ? 2 : borderColor !== 'transparent' ? 1.5 : 0}
        />
      </svg>

      {/* Label overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          color: textColor,
          fontSize,
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            className="bg-transparent text-center outline-none border-none w-3/4 px-1"
            style={{ color: textColor, fontSize }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="text-center px-2 select-none truncate max-w-[90%]">
            {nodeData.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(ArrowNode);
