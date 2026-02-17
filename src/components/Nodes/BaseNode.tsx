// ---------------------------------------------------------------------------
// BaseNode.tsx -- Shared wrapper for all FlowCraft node shapes
// ---------------------------------------------------------------------------

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

// ---------------------------------------------------------------------------
// Style-override shape used by the node data
// ---------------------------------------------------------------------------

export interface NodeStyleOverrides {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  textColor?: string;
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Data shape that BaseNode expects (union of both FlowNodeData variants)
// ---------------------------------------------------------------------------

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  styleOverrides?: NodeStyleOverrides;
  // flowStore variant fields
  color?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  // dependency data
  dependsOn?: string[];
  blockedBy?: string[];
  dependencyStatus?: string;
  // auto-size
  isAutoSized?: boolean;
  // secondary text
  description?: string;
}

// ---------------------------------------------------------------------------
// Resize handle positions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BaseNode props
// ---------------------------------------------------------------------------

export interface BaseNodeProps {
  /** The React Flow node props (id, data, selected, etc.) */
  nodeProps: NodeProps;
  /** The shape element rendered behind the text */
  children: ReactNode;
  /** Node width – used for positioning */
  width: number;
  /** Node height – used for positioning */
  height: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BaseNode: React.FC<BaseNodeProps> = ({
  nodeProps,
  children,
  width,
  height,
}) => {
  const { id, data, selected } = nodeProps;
  const nodeData = data as BaseNodeData;

  // ---- Inline editing state -----------------------------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  // Sync edit value when label changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(nodeData.label);
    }
  }, [nodeData.label, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // ---- Handlers -----------------------------------------------------------

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== nodeData.label) {
      updateNodeData(id, { label: trimmed || nodeData.label });
    }
  }, [editValue, nodeData.label, id, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
      if (e.key === 'Escape') {
        setEditValue(nodeData.label);
        setIsEditing(false);
      }
    },
    [commitEdit, nodeData.label],
  );

  // ---- Resolved styles ----------------------------------------------------

  const so = nodeData.styleOverrides;
  const textColor =
    so?.textColor ?? nodeData.textColor ?? '#334155';
  const fontSize = so?.fontSize ?? nodeData.fontSize ?? 14;
  const fontFamily = so?.fontFamily ?? nodeData.fontFamily ?? 'inherit';

  // ---- Dependency badges --------------------------------------------------

  const upstreamCount = nodeData.dependsOn?.length ?? 0;
  const downstreamCount = nodeData.blockedBy?.length ?? 0;
  const showBadges = upstreamCount > 0 || downstreamCount > 0;

  // ---- Render -------------------------------------------------------------

  return (
    <div
      className="relative group"
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* ---- Shape background ---- */}
      <div className="absolute inset-0 pointer-events-none">{children}</div>

      {/* ---- Selection ring ---- */}
      {selected && (
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            boxShadow: '0 0 0 2px #3b82f6',
            borderRadius: so?.borderRadius ?? 0,
          }}
        />
      )}

      {/* ---- Text / editing overlay ---- */}
      <div
        className="absolute inset-0 flex items-center justify-center px-2 overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full text-center bg-transparent border-none outline-none resize-none"
            style={{
              color: textColor,
              fontSize,
              fontFamily,
              lineHeight: 1.3,
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            rows={Math.max(1, Math.ceil(editValue.length / 18))}
          />
        ) : (
          <span
            className="text-center leading-tight select-none truncate w-full text-sm"
            style={{
              color: textColor,
              fontSize,
              fontFamily,
              fontWeight: so?.fontWeight ?? 400,
            }}
          >
            {nodeData.label}
          </span>
        )}
      </div>

      {/* ---- Auto-size indicator on hover ---- */}
      {isHovered && nodeData.isAutoSized && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 whitespace-nowrap pointer-events-none">
          auto
        </div>
      )}

      {/* ---- Dependency badges ---- */}
      {showBadges && (
        <>
          {upstreamCount > 0 && (
            <div
              className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-500 text-white
                         text-[10px] flex items-center justify-center shadow-sm
                         pointer-events-none z-10"
              title={`${upstreamCount} upstream`}
            >
              {upstreamCount}
            </div>
          )}
          {downstreamCount > 0 && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white
                         text-[10px] flex items-center justify-center shadow-sm
                         pointer-events-none z-10"
              title={`${downstreamCount} downstream`}
            >
              {downstreamCount}
            </div>
          )}
        </>
      )}

      {/* ---- Connection handles ---- */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ right: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ bottom: -4 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ left: -4 }}
      />

      {/* Target handles (same positions, allow incoming connections) */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ top: -4 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ right: -4 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ bottom: -4 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2 !bg-slate-400 !border-white !border !rounded-full !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ left: -4 }}
      />
    </div>
  );
};

export default BaseNode;
