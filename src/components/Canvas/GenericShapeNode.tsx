import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { icons } from 'lucide-react';
import { useFlowStore, type FlowNodeData, type StatusIndicator, getStatusIndicators } from '../../store/flowStore';
import { useUIStore } from '../../store/uiStore';
import { DependencyBadge } from '../Dependencies';
import { ensureReadableText, darkenColor } from '../../utils/colorUtils';

// ---------------------------------------------------------------------------
// Shape SVG paths (clip-path / outline)
// ---------------------------------------------------------------------------

const ARROW_SHAPES = new Set(['blockArrow', 'chevronArrow', 'doubleArrow', 'circularArrow']);

// ---------------------------------------------------------------------------
// Inline SVG renderers for arrow shapes (all pointing right, viewBox 0 0 160 80)
// ---------------------------------------------------------------------------

interface ArrowSvgProps {
  fill: string;
  stroke: string;
  strokeW: number;
}

const ArrowSvgs: Record<string, React.FC<ArrowSvgProps>> = {
  blockArrow: ({ fill, stroke, strokeW }) => (
    <path
      d="M 0 20 L 100 20 L 100 5 L 155 40 L 100 75 L 100 60 L 0 60 Z"
      fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
    />
  ),
  chevronArrow: ({ fill, stroke, strokeW }) => (
    <path
      d="M 0 5 L 115 5 L 155 40 L 115 75 L 0 75 L 40 40 Z"
      fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
    />
  ),
  doubleArrow: ({ fill, stroke, strokeW }) => (
    <path
      d="M 40 5 L 0 40 L 40 75 L 40 55 L 120 55 L 120 75 L 160 40 L 120 5 L 120 25 L 40 25 Z"
      fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
    />
  ),
  circularArrow: ({ fill, stroke, strokeW }) => (
    <>
      <path
        d="M 75 12 A 32 32 0 1 1 38 20"
        fill="none" stroke={fill} strokeWidth={6} strokeLinecap="round"
      />
      <polygon
        points="24,4 48,20 22,28"
        fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
      />
    </>
  ),
};

// ---------------------------------------------------------------------------
// Inline SVG renderers for non-rectangular shapes (viewBox 0 0 160 80)
// ---------------------------------------------------------------------------

const SVG_SHAPES = new Set(['parallelogram', 'cloud', 'hexagon', 'document']);

interface ShapeSvgProps {
  fill: string;
  stroke: string;
  strokeW: number;
}

const ShapeSvgs: Record<string, React.FC<ShapeSvgProps>> = {
  parallelogram: ({ fill, stroke, strokeW }) => (
    <polygon points="25,0 160,0 135,80 0,80" fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
  ),
  cloud: ({ fill, stroke, strokeW }) => (
    <path
      d="M 30 60 C 5 60 0 45 10 35 C 0 20 15 5 35 10 C 40 -5 65 -5 75 10 C 85 0 110 0 115 15 C 135 10 155 20 145 40 C 160 50 150 65 130 60 Z"
      fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
      transform="translate(0, 5) scale(1, 0.95)"
    />
  ),
  hexagon: ({ fill, stroke, strokeW }) => (
    <polygon points="25,0 135,0 160,40 135,80 25,80 0,40" fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
  ),
  document: ({ fill, stroke, strokeW }) => (
    <path
      d="M 0 0 L 160 0 L 160 65 Q 120 55 80 65 Q 40 75 0 65 Z"
      fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round"
    />
  ),
};

const shapeStyles: Record<string, React.CSSProperties> = {
  rectangle: { borderRadius: 4 },
  roundedRectangle: { borderRadius: 12 },
  diamond: { borderRadius: 4, transform: 'rotate(45deg)' },
  circle: { borderRadius: '50%' },
  parallelogram: { borderRadius: 4 },
  hexagon: { borderRadius: 4 },
  document: { borderRadius: 4 },
  cloud: { borderRadius: 24 },
  stickyNote: { borderRadius: 2 },
};

const shapeColors: Record<string, string> = {
  rectangle: '#3b82f6',
  roundedRectangle: '#3b82f6',
  diamond: '#f59e0b',
  circle: '#10b981',
  parallelogram: '#8b5cf6',
  hexagon: '#ef4444',
  document: '#ec4899',
  cloud: '#6366f1',
  stickyNote: '#fbbf24',
  blockArrow: '#3b82f6',
  chevronArrow: '#8b5cf6',
  doubleArrow: '#f59e0b',
  circularArrow: '#10b981',
};

// ---------------------------------------------------------------------------
// StatusBadge – renders a small status indicator circle on a node corner
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  'not-started': '#94a3b8',
  'in-progress': '#3b82f6',
  'completed': '#10b981',
  'blocked': '#ef4444',
  'review': '#f59e0b',
};

interface StatusBadgeProps {
  statusIndicator?: StatusIndicator;
  nodeId?: string;
  puckId: string;
  shape?: string;
  onUpdatePosition?: (position: string) => void;
}

const CLICK_THRESHOLD = 4; // px – movement below this is treated as a click, not a drag

const StatusBadge: React.FC<StatusBadgeProps & { nodeId: string; puckId: string; onUpdatePosition?: (position: string) => void; onUpdateSize?: (size: number) => void }> = ({ statusIndicator, nodeId, puckId, shape, onUpdatePosition, onUpdateSize }) => {
  const isSelected = useUIStore((s) => s.selectedPuckIds.includes(puckId));
  const selectionColor = useUIStore((s) => s.selectionColor);

  if (!statusIndicator || statusIndicator.status === 'none') return null;

  const { status, color, size: badgeSize, position = 'top-right' } = statusIndicator;
  const size = badgeSize ?? 12;
  const bgColor = color || STATUS_COLORS[status] || '#94a3b8';
  const offset = -(size / 2);

  // Border customisation
  const bColor = statusIndicator.borderColor ?? '#ffffff';
  const bWidth = statusIndicator.borderWidth ?? 2;
  const bStyle = statusIndicator.borderStyle ?? 'solid';
  const borderStr = bStyle === 'none' ? 'none' : `${bWidth}px ${bStyle} ${bColor}`;

  // For diamonds, position pucks at the midpoint of each diamond edge
  // instead of at the bounding box corners (which are outside the shape).
  const isDiamondShape = shape === 'diamond';
  const positionStyle: React.CSSProperties = {};
  if (isDiamondShape) {
    // Diamond edge midpoints: TL→(25%,25%), TR→(75%,25%), BL→(25%,75%), BR→(75%,75%)
    positionStyle.transform = 'translate(-50%, -50%)';
    if (position === 'top-right')        { positionStyle.left = '75%'; positionStyle.top = '25%'; }
    else if (position === 'top-left')    { positionStyle.left = '25%'; positionStyle.top = '25%'; }
    else if (position === 'bottom-right'){ positionStyle.left = '75%'; positionStyle.top = '75%'; }
    else                                 { positionStyle.left = '25%'; positionStyle.top = '75%'; }
  } else {
    if (position === 'top-right' || position === 'bottom-right') {
      positionStyle.right = offset;
    } else {
      positionStyle.left = offset;
    }
    if (position === 'top-right' || position === 'top-left') {
      positionStyle.top = offset;
    } else {
      positionStyle.bottom = offset;
    }
  }

  // Helper: compute which corner the cursor is closest to
  const getSnapCorner = (clientX: number, clientY: number, rect: DOMRect) => {
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    if (relX < midX && relY < midY) return 'top-left';
    if (relX >= midX && relY < midY) return 'top-right';
    if (relX < midX && relY >= midY) return 'bottom-left';
    return 'bottom-right';
  };

  // Normal drag → snap to corners; Shift+drag → resize; Click → select
  //
  // NOTE: We never move the real badge element — position: fixed is broken
  // inside React Flow's CSS-transformed container. Instead we hide the badge
  // and create overlay elements on document.body for the drag preview + ghost.
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const isResize = e.ctrlKey || e.metaKey; // Ctrl+drag to resize
    const isMultiSelect = e.shiftKey;         // Shift+click to add to selection
    const startSize = size;
    const badge = e.currentTarget as HTMLElement;
    const nodeEl = badge.parentElement;
    if (!nodeEl) return;

    let didDrag = false;
    let ghost: HTMLElement | null = null;     // snap-target indicator
    let dragPreview: HTMLElement | null = null; // follows cursor

    // Position a fixed element at a node corner (using fresh rect)
    const positionAtCorner = (el: HTMLElement, corner: string) => {
      const rect = nodeEl.getBoundingClientRect();
      const half = size / 2;
      let x: number, y: number;
      if (corner === 'top-left')      { x = rect.left - half; y = rect.top - half; }
      else if (corner === 'top-right') { x = rect.right - half; y = rect.top - half; }
      else if (corner === 'bottom-left') { x = rect.left - half; y = rect.bottom - half; }
      else                              { x = rect.right - half; y = rect.bottom - half; }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    // Create the drag preview (solid, follows cursor) on document.body
    const startDrag = () => {
      dragPreview = document.createElement('div');
      dragPreview.style.cssText = `
        position: fixed; width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${bgColor}; border: ${bWidth}px ${bStyle} ${bColor};
        pointer-events: none; z-index: 100000; cursor: grabbing;
        box-sizing: content-box;
      `;
      document.body.appendChild(dragPreview);

      ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed; width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${bgColor}; opacity: 0.35; border: 2px dashed ${useUIStore.getState().selectionColor};
        pointer-events: none; z-index: 99999; transition: top 0.08s, left 0.08s;
      `;
      document.body.appendChild(ghost);

      badge.style.opacity = '0'; // hide original
    };

    const handleMove = (moveE: PointerEvent) => {
      moveE.preventDefault();
      const dx = moveE.clientX - startX;
      const dy = moveE.clientY - startY;

      if (!didDrag && Math.sqrt(dx * dx + dy * dy) >= CLICK_THRESHOLD) {
        didDrag = true;
        if (!isResize) startDrag();
      }

      if (isResize && onUpdateSize) {
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
        const newSize = Math.round(Math.max(6, Math.min(40, startSize + delta)));
        onUpdateSize(newSize);
      } else if (didDrag && dragPreview && ghost) {
        // Move drag preview to follow cursor
        dragPreview.style.left = `${moveE.clientX - size / 2}px`;
        dragPreview.style.top = `${moveE.clientY - size / 2}px`;
        // Show ghost at the snap-target corner (fresh rect each time)
        const rect = nodeEl.getBoundingClientRect();
        const corner = getSnapCorner(moveE.clientX, moveE.clientY, rect);
        positionAtCorner(ghost, corner);
      }
    };

    const handleUp = (upE: PointerEvent) => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);

      // Clean up overlays
      if (dragPreview) { dragPreview.remove(); dragPreview = null; }
      if (ghost) { ghost.remove(); ghost = null; }
      badge.style.opacity = ''; // restore original

      // Click (no drag) → select puck only (deselect everything else)
      if (!didDrag && !isResize) {
        if (isMultiSelect) {
          useUIStore.getState().togglePuckSelection(puckId, nodeId);
        } else {
          useUIStore.getState().selectPuck(puckId, nodeId);
        }
        // Deselect all nodes and edges so only the puck is selected
        const { selectedNodes, selectedEdges, setSelectedNodes, setSelectedEdges } = useFlowStore.getState();
        if (selectedNodes.length > 0) setSelectedNodes([]);
        if (selectedEdges.length > 0) setSelectedEdges([]);
        return;
      }

      if (isResize) return;

      // Snap to the closest corner using a fresh bounding rect
      const freshRect = nodeEl.getBoundingClientRect();
      const newPosition = getSnapCorner(upE.clientX, upE.clientY, freshRect);
      if (onUpdatePosition) {
        onUpdatePosition(newPosition);
      }
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [position, onUpdatePosition, onUpdateSize, size, bgColor, bColor, bWidth, bStyle, puckId, nodeId]);

  // Selection ring via box-shadow
  const selectionShadow = isSelected ? `0 0 0 2px ${selectionColor}` : undefined;

  // Minimum 24×24 invisible hit zone for easier clicking
  const hitSize = Math.max(24, size + bWidth * 2);
  const hitOffset = -(hitSize / 2); // centre the hit zone on the node corner

  // Position the hit zone (same logic as original, but with hitOffset)
  const hitPositionStyle: React.CSSProperties = {};
  if (position === 'top-right' || position === 'bottom-right') {
    hitPositionStyle.right = hitOffset;
  } else {
    hitPositionStyle.left = hitOffset;
  }
  if (position === 'top-right' || position === 'top-left') {
    hitPositionStyle.top = hitOffset;
  } else {
    hitPositionStyle.bottom = hitOffset;
  }

  return (
    /* Invisible hit zone – larger clickable area centred on the same corner
       as the puck.  z-index 50 keeps it above React Flow interaction layers. */
    <div
      className="nodrag nopan"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      title="Click to select · Shift+click multi-select · Drag to move · Ctrl+drag to resize"
      style={{
        position: 'absolute',
        ...hitPositionStyle,
        width: hitSize,
        height: hitSize,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
      }}
    >
      {/* Visible puck circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: borderStr,
          boxSizing: 'content-box',
          boxShadow: selectionShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Only render icon if explicitly set (not default blank pucks) */}
        {statusIndicator.icon && statusIndicator.icon !== '' && statusIndicator.icon !== 'blank' && (() => {
          const CustomIcon = (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[statusIndicator.icon];
          return CustomIcon ? <CustomIcon size={Math.round(size * 0.6)} className="text-white block" /> : null;
        })()}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GenericShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const isEditingNode = useUIStore((s) => s.isEditingNode);
  const setIsEditingNode = useUIStore((s) => s.setIsEditingNode);
  const selectionColor = useUIStore((s) => s.selectionColor);

  const isEditing = isEditingNode === id;
  const iconPosition = nodeData.iconPosition || 'left';
  const [editValue, setEditValue] = useState(nodeData.label);
  const [autoFitFontSize, setAutoFitFontSize] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const shape = nodeData.shape || 'rectangle';
  const isIconOnly = !!nodeData.iconOnly;
  const fillColor = isIconOnly ? 'transparent' : (nodeData.color || shapeColors[shape] || '#3b82f6');
  const borderColor = isIconOnly ? 'transparent' : (nodeData.borderColor || darkenColor(fillColor, 0.25));
  const baseTextColor = nodeData.textColor || (isIconOnly ? '#475569' : '#ffffff');
  // Auto-contrast: ensure text is readable against the fill colour
  const textColor = (!isIconOnly && fillColor && fillColor !== 'transparent')
    ? ensureReadableText(fillColor, baseTextColor)
    : baseTextColor;
  const fontSize = nodeData.fontSize || 14;

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

  // Build wrapper styles based on shape
  const isArrowShape = ARROW_SHAPES.has(shape);
  const isSvgShape = SVG_SHAPES.has(shape);
  const isDiamond = shape === 'diamond';
  const isCircle = shape === 'circle';
  const isCircularArrow = shape === 'circularArrow';
  const defaultWidth = isArrowShape
    ? (isCircularArrow ? 100 : 160)
    : isCircle ? 100 : isDiamond ? 100 : 160;
  const defaultHeight = isArrowShape
    ? (isCircularArrow ? 100 : 80)
    : isCircle ? 100 : isDiamond ? 100 : 60;

  const width = nodeData.width || defaultWidth;
  const height = nodeData.height || defaultHeight;

  // Scale font size proportionally with node dimensions
  const widthRatio = width / defaultWidth;
  const heightRatio = height / defaultHeight;
  const sizeRatio = Math.min(widthRatio, heightRatio);
  const proportionalFontSize = Math.max(8, Math.min(48, Math.round(fontSize * sizeRatio)));
  const scaledFontSize = autoFitFontSize ?? proportionalFontSize;

  // Auto-shrink font if text overflows the node
  useEffect(() => {
    if (isEditing || !labelRef.current) {
      setAutoFitFontSize(null);
      return;
    }
    const el = labelRef.current;
    let trySize = proportionalFontSize;
    const minSize = 8;
    // Reset to measure at the proportional size
    el.style.fontSize = `${trySize}px`;
    // Shrink until text fits or we hit minimum
    while (trySize > minSize && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      trySize -= 1;
      el.style.fontSize = `${trySize}px`;
    }
    if (trySize < proportionalFontSize) {
      setAutoFitFontSize(trySize);
    } else {
      setAutoFitFontSize(null);
    }
  }, [nodeData.label, width, height, proportionalFontSize, isEditing]);

  // For arrow / SVG / icon-only shapes, we use transparent background
  const noBox = isArrowShape || isSvgShape || isIconOnly;
  const opacity = nodeData.opacity ?? 1;
  const borderStyleProp = nodeData.borderStyle || 'solid';
  const borderW = nodeData.borderWidth ?? 2;
  const hasDashedBorder = borderStyleProp !== 'solid' && !noBox && borderColor !== 'transparent';
  // User-configurable corner radius (overrides shape defaults)
  const userBorderRadius = nodeData.borderRadius;

  // Build box-shadow layers
  const borderShadow = (!noBox && borderColor !== 'transparent' && !hasDashedBorder)
    ? `0 0 0 ${borderW}px ${borderColor}`
    : '';
  const selectionShadow = selected
    ? `0 0 0 2.5px ${selectionColor}, 0 0 8px 2px ${selectionColor}40`
    : '';
  const dropShadow = (!noBox && !selected)
    ? '0 1px 3px rgba(0,0,0,0.1)'
    : '';
  const combinedShadow = [borderShadow, selectionShadow, dropShadow].filter(Boolean).join(', ') || 'none';

  // Outer wrapper: holds resizer + handles, never clips
  const wrapperStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    overflow: 'visible',
  };

  // Inner shape: has the visual styling, clips text overflow
  const nodeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: noBox ? 'transparent' : fillColor,
    border: 'none',
    outline: hasDashedBorder ? `${borderW}px ${borderStyleProp} ${borderColor}` : 'none',
    outlineOffset: hasDashedBorder ? '0px' : undefined,
    opacity,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: textColor,
    fontSize: scaledFontSize,
    fontWeight: nodeData.fontWeight || 500,
    fontFamily: nodeData.fontFamily || "'Inter', sans-serif",
    boxShadow: combinedShadow,
    transition: 'box-shadow 0.15s',
    overflow: noBox ? 'visible' : 'hidden',
    position: 'relative',
    ...(noBox ? {} : shapeStyles[shape]),
    // User-set border radius overrides the shape default
    ...(userBorderRadius !== undefined && !noBox ? { borderRadius: userBorderRadius } : {}),
  };

  const labelStyle: React.CSSProperties = isDiamond
    ? { transform: 'rotate(-45deg)', fontSize: Math.min(12, scaledFontSize) }
    : {};

  const ArrowSvg = isArrowShape ? ArrowSvgs[shape] : null;
  const arrowViewBox = isCircularArrow ? '0 0 100 80' : '0 0 160 80';
  const ShapeSvg = isSvgShape ? ShapeSvgs[shape] : null;

  return (
    <div style={wrapperStyle} onDoubleClick={handleDoubleClick}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={40}
        minHeight={30}
        lineStyle={{ borderColor: selectionColor, borderWidth: 1 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', border: `1.5px solid ${selectionColor}` }}
        onResize={(_event, params) => {
          updateNodeData(id, { width: params.width, height: params.height });
          // Propagate resize to all other selected nodes
          const { selectedNodes } = useFlowStore.getState();
          if (selectedNodes.length > 1) {
            for (const nid of selectedNodes) {
              if (nid !== id) {
                updateNodeData(nid, { width: params.width, height: params.height });
              }
            }
          }
        }}
      />

      {/* Dependency badges overlay */}
      <DependencyBadge nodeId={id} />
      {getStatusIndicators(nodeData).map((puck) => (
        <StatusBadge
          key={puck.id}
          statusIndicator={puck}
          nodeId={id}
          puckId={puck.id!}
          shape={shape}
          onUpdatePosition={(pos) => {
            useFlowStore.getState().updateStatusPuck(id, puck.id!, { position: pos as any });
          }}
          onUpdateSize={(newSize) => {
            useFlowStore.getState().updateStatusPuck(id, puck.id!, { size: newSize });
          }}
        />
      ))}

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Inner shape div */}
      <div style={nodeStyle}>

      {/* Arrow shape SVG layer */}
      {isArrowShape && ArrowSvg && (
        <svg
          width="100%"
          height="100%"
          viewBox={arrowViewBox}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 pointer-events-none"
        >
          <ArrowSvg
            fill={fillColor}
            stroke={selected ? selectionColor : borderColor}
            strokeW={selected ? Math.max(borderW, 2) : borderColor !== 'transparent' ? borderW : 0}
          />
        </svg>
      )}

      {/* Non-rectangular shape SVG layer */}
      {isSvgShape && ShapeSvg && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 160 80"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 pointer-events-none"
        >
          <ShapeSvg
            fill={fillColor}
            stroke={selected ? selectionColor : borderColor}
            strokeW={selected ? Math.max(borderW, 2) : borderColor !== 'transparent' ? borderW : 0}
          />
        </svg>
      )}

      {/* Label with optional icon */}
      {(() => {
        const IconComponent = nodeData.icon
          ? (icons as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[nodeData.icon]
          : null;

        // Icon styling props
        const iColor = nodeData.iconColor || textColor;
        const iBgColor = nodeData.iconBgColor;
        const iBorderColor = nodeData.iconBorderColor;
        const iBorderWidth = nodeData.iconBorderWidth ?? 0;

        const renderStyledIcon = (iconSz: number) => {
          if (!IconComponent) return null;
          const hasWrapper = iBgColor || (iBorderColor && iBorderWidth > 0);
          const iconEl = <IconComponent size={iconSz} className="shrink-0 block" style={{ color: iColor }} />;
          if (!hasWrapper) return iconEl;
          return (
            <span
              className="inline-flex items-center justify-center shrink-0 rounded"
              style={{
                backgroundColor: iBgColor || 'transparent',
                border: iBorderWidth > 0 && iBorderColor ? `${iBorderWidth}px solid ${iBorderColor}` : undefined,
                padding: 2,
              }}
            >
              {iconEl}
            </span>
          );
        };

        // Icon-only mode: render just the icon centered, no label text
        if (isIconOnly && IconComponent) {
          const iconSize = nodeData.iconSize || Math.min(width, height) * 0.6;
          return (
            <div className="flex items-center justify-center w-full h-full relative z-10">
              {renderStyledIcon(iconSize)}
            </div>
          );
        }

        const actualIconSize = nodeData.iconSize || (scaledFontSize + 2);

        return (
          <div
            ref={labelRef}
            className={`flex items-center gap-1.5 w-full h-full relative z-10 overflow-hidden px-2 ${iconPosition === 'right' ? 'flex-row-reverse' : ''} ${
              (nodeData as Record<string, unknown>).textAlign === 'left' ? 'justify-start' :
              (nodeData as Record<string, unknown>).textAlign === 'right' ? 'justify-end' :
              'justify-center'
            }`}
            style={{ ...labelStyle, fontSize: scaledFontSize }}
          >
            {IconComponent && renderStyledIcon(actualIconSize)}
            {isEditing ? (
              <input
                ref={inputRef}
                className="bg-transparent text-center outline-none border-none w-full px-1"
                style={{ color: textColor, fontSize: scaledFontSize }}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <span className="text-center select-none break-words leading-tight" style={{ wordBreak: 'break-word' }}>
                {nodeData.label}
              </span>
            )}
          </div>
        );
      })()}
      </div>{/* end inner shape div */}
    </div>
  );
};

export default React.memo(GenericShapeNode);
