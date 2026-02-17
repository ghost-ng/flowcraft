import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
  type NodeTypes,
  type IsValidConnection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore, type FlowNode, type FlowEdge, type FlowNodeData, type NodeShape } from '../../store/flowStore';
import { useUIStore } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';
import { useDependencyStore } from '../../store/dependencyStore';
import { diagramStyles } from '../../styles/diagramStyles';
import { useSwimlaneStore } from '../../store/swimlaneStore';
import GenericShapeNode from './GenericShapeNode';
import GroupNode from './GroupNode';
import Ruler, { RulerCorner } from './Ruler';
import { edgeTypes } from '../Edges';
import { SwimlaneLayer } from '../Swimlanes';
import { WalkModeBreadcrumb, ChainHighlight } from '../Dependencies';
import { CanvasContextMenu, NodeContextMenu, EdgeContextMenu, SelectionContextMenu } from '../ContextMenu';
import { log } from '../../utils/logger';
import {
  computeLaneBoundaries,
  getNodeLaneAssignment,
  type LaneDefinition,
} from '../../utils/swimlaneUtils';

// Custom paint-brush cursor for format painter mode (SVG data URL, hotspot at tip)
const FORMAT_PAINTER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z'/%3E%3Cpath d='M9 8 5.5 11.5a2.12 2.12 0 1 0 3 3L12 11'/%3E%3Cpath d='M5 15 2 22l7-3'/%3E%3C/svg%3E") 2 22, crosshair`;

// ---------------------------------------------------------------------------
// Node types registry
// ---------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
  shapeNode: GenericShapeNode,
  groupNode: GroupNode,
};

// ---------------------------------------------------------------------------
// Unique ID generator
// ---------------------------------------------------------------------------

let idCounter = 0;
const nextId = () => `node_${Date.now()}_${++idCounter}`;

// ---------------------------------------------------------------------------
// Context menu state types
// ---------------------------------------------------------------------------

interface CanvasMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

interface NodeMenuState {
  x: number;
  y: number;
  nodeId: string;
}

interface EdgeMenuState {
  x: number;
  y: number;
  edgeId: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FlowCanvasProps {
  /** Called when the ReactFlow instance is initialized, passing view control functions */
  onInit?: (controls: {
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
  }) => void;
}

// ---------------------------------------------------------------------------
// Inner canvas (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

const FlowCanvasInner: React.FC<FlowCanvasProps> = ({ onInit }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const rfInstance = useReactFlow();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = rfInstance;

  // Flow store
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const setNodes = useFlowStore((s) => s.setNodes);
  const setSelectedNodes = useFlowStore((s) => s.setSelectedNodes);
  const setSelectedEdges = useFlowStore((s) => s.setSelectedEdges);

  // UI store
  const minimapVisible = useUIStore((s) => s.minimapVisible);
  const gridVisible = useUIStore((s) => s.gridVisible);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const gridSpacing = useUIStore((s) => s.gridSpacing);
  const gridStyle = useUIStore((s) => s.gridStyle);
  const rulerVisible = useUIStore((s) => s.rulerVisible);
  const setIsEditingNode = useUIStore((s) => s.setIsEditingNode);

  // Style store
  const darkMode = useStyleStore((s) => s.darkMode);
  const activeStyleId = useStyleStore((s) => s.activeStyleId);
  const activeStyle = diagramStyles[activeStyleId] || diagramStyles.cleanMinimal;

  // Dependency store
  const walkModeActive = useDependencyStore((s) => s.walkModeActive);
  const highlightedChain = useDependencyStore((s) => s.highlightedChain);

  // Swimlane store
  const hLanes = useSwimlaneStore((s) => s.config.horizontal);
  const vLanes = useSwimlaneStore((s) => s.config.vertical);
  const hasLanes = hLanes.length > 0 || vLanes.length > 0;
  const setIsCreatingSwimlanes = useSwimlaneStore((s) => s.setIsCreating);

  // Hovered node tracking (for Ctrl+Wheel border-width adjustment)
  const hoveredNodeRef = useRef<string | null>(null);

  // Link group drag tracking
  const linkGroupDragRef = useRef<{
    linkGroupId: string;
    startPositions: Map<string, { x: number; y: number }>;
    dragNodeId: string;
    dragStartPos: { x: number; y: number };
  } | null>(null);

  // Context menu state
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState | null>(null);
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<EdgeMenuState | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; nodeIds: string[] } | null>(null);

  // ---- Helpers ------------------------------------------------------------

  const createNodeAtPosition = useCallback(
    (x: number, y: number, shapeType: string = 'rectangle') => {
      const position = screenToFlowPosition({ x, y });
      const newNode: FlowNode = {
        id: nextId(),
        type: 'shapeNode',
        position,
        data: {
          label: 'New Node',
          shape: shapeType as FlowNodeData['shape'],
        },
      };
      addNode(newNode);
      return newNode.id;
    },
    [screenToFlowPosition, addNode],
  );

  // ---- Drag & drop from palette -------------------------------------------

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const shapeType = event.dataTransfer.getData('application/flowcraft-shape');
      if (!shapeType) return;
      log.debug('onDrop shape', shapeType);

      // Handle group/container shape
      if (shapeType === 'group') {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode: FlowNode = {
          id: nextId(),
          type: 'groupNode',
          position,
          data: {
            label: 'Group',
            shape: 'group',
            width: 300,
            height: 200,
          },
        };
        addNode(newNode);
        return;
      }

      const iconName = event.dataTransfer.getData('application/flowcraft-icon');
      if (iconName) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const isIconOnly = shapeType === 'iconOnly';
        const newNode: FlowNode = {
          id: nextId(),
          type: 'shapeNode',
          position,
          data: {
            label: iconName,
            shape: isIconOnly ? 'circle' : (shapeType as FlowNodeData['shape']),
            icon: iconName,
            iconOnly: isIconOnly,
            ...(isIconOnly ? { width: 60, height: 60 } : {}),
          },
        };
        addNode(newNode);

        // Clear palette shape selection after icon drop
        useUIStore.getState().setSelectedPaletteShape(null);

        // Check if dropped inside a group
        const groupNodes = useFlowStore.getState().nodes.filter(
          (n) => n.type === 'groupNode' && n.id !== newNode.id,
        );
        for (const group of groupNodes) {
          const gw = group.data.width || 300;
          const gh = group.data.height || 200;
          if (
            position.x >= group.position.x &&
            position.y >= group.position.y &&
            position.x <= group.position.x + gw &&
            position.y <= group.position.y + gh
          ) {
            // Parent to this group
            const allNodes = useFlowStore.getState().nodes;
            const updated = allNodes.map((n) =>
              n.id === newNode.id
                ? {
                    ...n,
                    parentId: group.id,
                    extent: 'parent' as const,
                    position: { x: position.x - group.position.x, y: position.y - group.position.y },
                    data: { ...n.data, groupId: group.id },
                  }
                : n,
            );
            setNodes(updated);
            break;
          }
        }
      } else {
        const nodeId = createNodeAtPosition(event.clientX, event.clientY, shapeType);

        // Check if dropped inside a group
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const groupNodes = useFlowStore.getState().nodes.filter(
          (n) => n.type === 'groupNode' && n.id !== nodeId,
        );
        for (const group of groupNodes) {
          const gw = group.data.width || 300;
          const gh = group.data.height || 200;
          if (
            position.x >= group.position.x &&
            position.y >= group.position.y &&
            position.x <= group.position.x + gw &&
            position.y <= group.position.y + gh
          ) {
            const allNodes = useFlowStore.getState().nodes;
            const updated = allNodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    parentId: group.id,
                    extent: 'parent' as const,
                    position: { x: position.x - group.position.x, y: position.y - group.position.y },
                    data: { ...n.data, groupId: group.id },
                  }
                : n,
            );
            setNodes(updated);
            break;
          }
        }
      }
    },
    [createNodeAtPosition, screenToFlowPosition, addNode],
  );

  // ---- Double-click to add node -------------------------------------------

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Only if we clicked on the pane (not on a node)
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node')) return;
      const nodeId = createNodeAtPosition(event.clientX, event.clientY);
      // Start editing the label immediately
      setTimeout(() => setIsEditingNode(nodeId), 50);
    },
    [createNodeAtPosition, setIsEditingNode],
  );

  // ---- Right-click context menus ------------------------------------------

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      // Close any existing menus
      setNodeMenu(null);
      setEdgeMenu(null);

      // If multiple nodes are selected, show selection context menu
      const selectedNodes = useFlowStore.getState().selectedNodes;
      if (selectedNodes.length > 1) {
        setSelectionMenu({ x: event.clientX, y: event.clientY, nodeIds: selectedNodes });
        setCanvasMenu(null);
        return;
      }

      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setCanvasMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
      });
    },
    [screenToFlowPosition],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      const selectedNodes = useFlowStore.getState().selectedNodes;
      if (selectedNodes.length > 1 && selectedNodes.includes(node.id)) {
        setSelectionMenu({ x: event.clientX, y: event.clientY, nodeIds: selectedNodes });
        setNodeMenu(null);
        setCanvasMenu(null);
      } else {
        setNodeMenu({
          x: event.clientX,
          y: event.clientY,
          nodeId: node.id,
        });
        setSelectionMenu(null);
        setCanvasMenu(null);
      }
    },
    [],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: FlowEdge) => {
      event.preventDefault();
      setEdgeMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
      setCanvasMenu(null);
      setNodeMenu(null);
      setSelectionMenu(null);
    },
    [],
  );

  const closeContextMenus = useCallback(() => {
    setCanvasMenu(null);
    setNodeMenu(null);
    setEdgeMenu(null);
    setSelectionMenu(null);
    useUIStore.getState().clearPuckSelection();
  }, []);

  // ---- Canvas context menu handlers ----------------------------------------

  const handleAddNodeAtMenu = useCallback(() => {
    if (canvasMenu) {
      createNodeAtPosition(canvasMenu.x, canvasMenu.y);
    }
  }, [canvasMenu, createNodeAtPosition]);

  const handleSelectAll = useCallback(() => {
    const allNodeIds = nodes.map((n) => n.id);
    useFlowStore.getState().setSelectedNodes(allNodeIds);
  }, [nodes]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleInsertSwimlanes = useCallback(() => {
    setIsCreatingSwimlanes(true);
  }, [setIsCreatingSwimlanes]);

  // ---- Node context menu handlers ------------------------------------------

  const handleEditLabel = useCallback(() => {
    if (nodeMenu) {
      setIsEditingNode(nodeMenu.nodeId);
    }
  }, [nodeMenu, setIsEditingNode]);

  const handleDuplicateNode = useCallback(() => {
    if (!nodeMenu) return;
    const original = useFlowStore.getState().getNode(nodeMenu.nodeId);
    if (!original) return;
    const newNode: FlowNode = {
      id: nextId(),
      type: original.type,
      position: {
        x: original.position.x + 30,
        y: original.position.y + 30,
      },
      data: { ...original.data },
    };
    addNode(newNode);
  }, [nodeMenu, addNode]);

  const handleCopyNode = useCallback(() => {
    // Copy node data to clipboard as JSON
    if (!nodeMenu) return;
    const node = useFlowStore.getState().getNode(nodeMenu.nodeId);
    if (node) {
      navigator.clipboard.writeText(JSON.stringify(node)).catch((e) => log.error('Copy node to clipboard failed', e));
    }
  }, [nodeMenu]);

  const handleDeleteNode = useCallback(() => {
    if (nodeMenu) {
      removeNode(nodeMenu.nodeId);
    }
  }, [nodeMenu, removeNode]);

  const handleChangeShape = useCallback(
    (shape: NodeShape) => {
      if (!nodeMenu) return;
      const node = useFlowStore.getState().getNode(nodeMenu.nodeId);
      if (node?.type === 'groupNode') {
        // Convert group node to shape node, releasing children
        const currentNodes = useFlowStore.getState().nodes;
        const updated = currentNodes.map((n) => {
          if (n.id === nodeMenu.nodeId) {
            return {
              ...n,
              type: 'shapeNode',
              style: undefined,
              data: { ...n.data, shape, width: 160, height: 60 },
            };
          }
          // Release children from this group
          if (n.parentId === nodeMenu.nodeId) {
            return {
              ...n,
              parentId: undefined,
              extent: undefined,
              position: {
                x: n.position.x + node.position.x,
                y: n.position.y + node.position.y,
              },
              data: { ...n.data, groupId: undefined },
            };
          }
          return n;
        });
        setNodes(updated);
      } else {
        updateNodeData(nodeMenu.nodeId, { shape });
      }
    },
    [nodeMenu, updateNodeData, setNodes],
  );

  const handleChangeColor = useCallback(
    (color: string) => {
      if (nodeMenu) {
        updateNodeData(nodeMenu.nodeId, { color });
      }
    },
    [nodeMenu, updateNodeData],
  );

  const handleSendToBack = useCallback(() => {
    if (!nodeMenu) return;
    const currentNodes = useFlowStore.getState().nodes;
    const idx = currentNodes.findIndex((n) => n.id === nodeMenu.nodeId);
    if (idx > 0) {
      const moved = [...currentNodes];
      const [node] = moved.splice(idx, 1);
      moved.unshift(node);
      setNodes(moved);
    }
  }, [nodeMenu, setNodes]);

  const handleBringToFront = useCallback(() => {
    if (!nodeMenu) return;
    const currentNodes = useFlowStore.getState().nodes;
    const idx = currentNodes.findIndex((n) => n.id === nodeMenu.nodeId);
    if (idx < currentNodes.length - 1) {
      const moved = [...currentNodes];
      const [node] = moved.splice(idx, 1);
      moved.push(node);
      setNodes(moved);
    }
  }, [nodeMenu, setNodes]);

  // ---- Ungroup a group node -------------------------------------------------

  const handleUngroupNode = useCallback(() => {
    if (!nodeMenu) return;
    const currentNodes = useFlowStore.getState().nodes;
    const groupNode = currentNodes.find((n) => n.id === nodeMenu.nodeId);
    if (!groupNode || groupNode.type !== 'groupNode') return;

    // Convert child positions back to absolute and remove parentId
    const updatedNodes = currentNodes
      .filter((n) => n.id !== nodeMenu.nodeId)
      .map((n) => {
        if (n.parentId === nodeMenu.nodeId) {
          return {
            ...n,
            parentId: undefined,
            extent: undefined,
            position: {
              x: n.position.x + groupNode.position.x,
              y: n.position.y + groupNode.position.y,
            },
          };
        }
        return n;
      });
    setNodes(updatedNodes);
  }, [nodeMenu, setNodes]);

  // ---- Edge context menu handlers -------------------------------------------

  const handleEdgeChangeType = useCallback(
    (type: string) => {
      if (!edgeMenu) return;
      const currentEdges = useFlowStore.getState().edges;
      const updated = currentEdges.map((e) =>
        e.id === edgeMenu.edgeId ? { ...e, type } : e,
      );
      useFlowStore.getState().setEdges(updated);
    },
    [edgeMenu],
  );

  const handleEdgeChangeColor = useCallback(
    (color: string) => {
      if (!edgeMenu) return;
      const edge = useFlowStore.getState().getEdge(edgeMenu.edgeId);
      const existing = (edge?.data as Record<string, unknown>)?.styleOverrides as Record<string, unknown> | undefined;
      useFlowStore.getState().updateEdgeData(edgeMenu.edgeId, {
        color,
        styleOverrides: { ...existing, stroke: color },
      });
    },
    [edgeMenu],
  );

  const handleEdgeEditLabel = useCallback(() => {
    if (!edgeMenu) return;
    // Set label to trigger the label input in the properties panel
    const edge = useFlowStore.getState().getEdge(edgeMenu.edgeId);
    if (edge) {
      useFlowStore.getState().updateEdgeData(edgeMenu.edgeId, {
        label: edge.data?.label || 'Label',
      });
      // Select this edge so properties panel opens
      useFlowStore.getState().setSelectedEdges([edgeMenu.edgeId]);
    }
  }, [edgeMenu]);

  const handleEdgeDelete = useCallback(() => {
    if (!edgeMenu) return;
    const currentEdges = useFlowStore.getState().edges;
    useFlowStore.getState().setEdges(currentEdges.filter((e) => e.id !== edgeMenu.edgeId));
  }, [edgeMenu]);

  /** Check if the right-clicked node is a group node */
  const isNodeMenuGroupNode = nodeMenu
    ? nodes.find((n) => n.id === nodeMenu.nodeId)?.type === 'groupNode'
    : false;

  // ---- Valid connection check ----------------------------------------------

  const isValidConnection: IsValidConnection = useCallback((connection) => {
    // Prevent self-connections
    return connection.source !== connection.target;
  }, []);

  // ---- Expose view controls via onInit -----------------------------------

  const handleReactFlowInit = useCallback(
    (_instance: ReactFlowInstance<FlowNode>) => {
      onInit?.({
        zoomIn: () => zoomIn(),
        zoomOut: () => zoomOut(),
        fitView: () => fitView({ padding: 0.2 }),
      });
    },
    [onInit, zoomIn, zoomOut, fitView],
  );

  // ---- Format Painter: apply styles on node/edge click ----------------------

  const formatPainterActive = useUIStore((s) => s.formatPainterActive);
  const formatPainterNodeStyle = useUIStore((s) => s.formatPainterNodeStyle);
  const formatPainterEdgeStyle = useUIStore((s) => s.formatPainterEdgeStyle);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (!formatPainterActive || !formatPainterNodeStyle) return;
      log.debug('Format painter applied to node', node.id);
      // Build patch from copied style
      const patch: Record<string, unknown> = {};
      const s = formatPainterNodeStyle;
      if (s.color !== undefined) patch.color = s.color;
      if (s.borderColor !== undefined) patch.borderColor = s.borderColor;
      if (s.textColor !== undefined) patch.textColor = s.textColor;
      if (s.fontSize !== undefined) patch.fontSize = s.fontSize;
      if (s.fontWeight !== undefined) patch.fontWeight = s.fontWeight;
      if (s.fontFamily !== undefined) patch.fontFamily = s.fontFamily;
      if (s.borderStyle !== undefined) patch.borderStyle = s.borderStyle;
      if (s.borderWidth !== undefined) patch.borderWidth = s.borderWidth;
      if (s.borderRadius !== undefined) patch.borderRadius = s.borderRadius;
      if (s.opacity !== undefined) patch.opacity = s.opacity;
      if (s.textAlign !== undefined) patch.textAlign = s.textAlign;

      // Apply to the clicked node
      updateNodeData(node.id, patch as Partial<FlowNodeData>);

      // Also apply to all other selected nodes (bulk format)
      const { selectedNodes } = useFlowStore.getState();
      for (const id of selectedNodes) {
        if (id !== node.id) {
          updateNodeData(id, patch as Partial<FlowNodeData>);
        }
      }
    },
    [formatPainterActive, formatPainterNodeStyle, updateNodeData],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: FlowEdge) => {
      if (!formatPainterActive || !formatPainterEdgeStyle) return;
      const s = formatPainterEdgeStyle;
      const patch: Record<string, unknown> = {};
      if (s.color !== undefined) patch.color = s.color;
      if (s.thickness !== undefined) patch.thickness = s.thickness;
      if (s.opacity !== undefined) patch.opacity = s.opacity;
      if (s.strokeDasharray !== undefined) patch.strokeDasharray = s.strokeDasharray;
      if (s.labelColor !== undefined) patch.labelColor = s.labelColor;
      useFlowStore.getState().updateEdgeData(edge.id, patch);
    },
    [formatPainterActive, formatPainterEdgeStyle],
  );

  // Escape key to cancel format painter
  React.useEffect(() => {
    if (!formatPainterActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUIStore.getState().clearFormatPainter();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [formatPainterActive]);

  // ---- Link group drag handlers -----------------------------------------------

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      const lgId = (node.data as FlowNodeData).linkGroupId;
      if (!lgId) {
        linkGroupDragRef.current = null;
        return;
      }
      // Store start positions of all siblings in this link group
      const allNodes = useFlowStore.getState().nodes;
      const startPositions = new Map<string, { x: number; y: number }>();
      for (const n of allNodes) {
        if ((n.data as FlowNodeData).linkGroupId === lgId && n.id !== node.id) {
          startPositions.set(n.id, { ...n.position });
        }
      }
      linkGroupDragRef.current = {
        linkGroupId: lgId,
        startPositions,
        dragNodeId: node.id,
        dragStartPos: { ...node.position },
      };
    },
    [],
  );

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      const ref = linkGroupDragRef.current;
      if (!ref || node.id !== ref.dragNodeId) return;
      const dx = node.position.x - ref.dragStartPos.x;
      const dy = node.position.y - ref.dragStartPos.y;
      // Move all siblings by the same delta
      for (const [sibId, startPos] of ref.startPositions) {
        useFlowStore.getState().updateNodePosition(sibId, {
          x: startPos.x + dx,
          y: startPos.y + dy,
        });
      }
    },
    [],
  );

  // Assign swimlane ID when a node is dropped
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      const { config, containerOffset } = useSwimlaneStore.getState();
      const hLanes = config.horizontal;
      const vLanes = config.vertical;
      if (hLanes.length === 0 && vLanes.length === 0) return;

      // Convert node position to swimlane-local coordinates
      const localX = node.position.x - containerOffset.x;
      const localY = node.position.y - containerOffset.y;

      const nodeW = (node.data as FlowNodeData).width || 160;
      const nodeH = (node.data as FlowNodeData).height || 60;

      // Check horizontal lanes first, then vertical
      let assignedLaneId: string | null = null;
      if (hLanes.length > 0) {
        const headerOffset = vLanes.length > 0 ? 32 : 0; // V_HEADER_HEIGHT
        const laneDefs: LaneDefinition[] = hLanes.map((l) => ({
          id: l.id, label: l.label, size: l.size, collapsed: l.collapsed, order: l.order,
        }));
        const boundaries = computeLaneBoundaries(laneDefs, 'horizontal', headerOffset);
        assignedLaneId = getNodeLaneAssignment({ x: localX, y: localY }, { width: nodeW, height: nodeH }, boundaries);
      }
      if (!assignedLaneId && vLanes.length > 0) {
        const headerOffset = hLanes.length > 0 ? 40 : 0; // H_HEADER_WIDTH
        const laneDefs: LaneDefinition[] = vLanes.map((l) => ({
          id: l.id, label: l.label, size: l.size, collapsed: l.collapsed, order: l.order,
        }));
        const boundaries = computeLaneBoundaries(laneDefs, 'vertical', headerOffset);
        assignedLaneId = getNodeLaneAssignment({ x: localX, y: localY }, { width: nodeW, height: nodeH }, boundaries);
      }

      // Update node data if lane assignment changed
      const currentLaneId = (node.data as FlowNodeData).swimlaneId;
      if (assignedLaneId !== (currentLaneId || null)) {
        updateNodeData(node.id, { swimlaneId: assignedLaneId || undefined } as Partial<FlowNodeData>);
      }
    },
    [updateNodeData],
  );

  // Fallback context menu on wrapper to prevent browser menu for selection area
  // Reliable selection tracking via onSelectionChange
  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
    setSelectedNodes(selNodes.map((n) => n.id));
    setSelectedEdges(selEdges.map((e) => e.id));
    // Clear puck selection when its parent node is no longer selected
    const puckNode = useUIStore.getState().selectedPuckNodeId;
    if (puckNode && !selNodes.some((n) => n.id === puckNode)) {
      useUIStore.getState().clearPuckSelection();
    }
  }, [setSelectedNodes, setSelectedEdges]);

  const onWrapperContextMenu = useCallback((event: React.MouseEvent) => {
    // Only intercept if we have selected nodes and the right-click is in the flow area
    const selectedNodes = useFlowStore.getState().selectedNodes;
    if (selectedNodes.length > 1) {
      event.preventDefault();
      setSelectionMenu({ x: event.clientX, y: event.clientY, nodeIds: selectedNodes });
      setCanvasMenu(null);
      setNodeMenu(null);
      setEdgeMenu(null);
    }
  }, []);

  // ---- Ctrl+Wheel border-width on hovered node -----------------------------

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: FlowNode) => {
    hoveredNodeRef.current = node.id;
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    hoveredNodeRef.current = null;
  }, []);

  const onWheelHandler = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey || !hoveredNodeRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const nodeId = hoveredNodeRef.current;
    const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const currentWidth = node.data.borderWidth ?? 2;
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    const newWidth = Math.max(0, Math.min(8, currentWidth + delta));
    updateNodeData(nodeId, { borderWidth: newWidth });
  }, [updateNodeData]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative" onContextMenu={onWrapperContextMenu} onWheel={onWheelHandler} style={{ backgroundColor: activeStyle.canvas.background, cursor: formatPainterActive ? FORMAT_PAINTER_CURSOR : undefined }}>
      {/* Format painter active indicator */}
      {formatPainterActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white" />
          Format Painter Active — Click nodes to apply style
          <button
            onClick={() => useUIStore.getState().clearFormatPainter()}
            className="ml-2 px-2 py-0.5 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
          >
            Esc to cancel
          </button>
        </div>
      )}

      {/* Swimlane layer rendered behind the flow canvas */}
      {hasLanes && <SwimlaneLayer />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDoubleClick={onDoubleClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={closeContextMenus}
        onSelectionChange={onSelectionChange}
        onInit={handleReactFlowInit}
        isValidConnection={isValidConnection}
        snapToGrid={snapEnabled}
        snapGrid={[gridSpacing, gridSpacing]}
        selectionOnDrag={false}
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Control"
        panOnDrag={true}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        fitView
        attributionPosition="bottom-left"
        className={darkMode ? 'dark' : ''}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        {gridVisible && (
          <Background
            variant={
              gridStyle === 'lines' ? BackgroundVariant.Lines
              : gridStyle === 'cross' ? BackgroundVariant.Cross
              : BackgroundVariant.Dots
            }
            gap={gridSpacing}
            size={1}
            color={activeStyle.canvas.gridColor}
          />
        )}

        {minimapVisible && (
          <MiniMap
            style={{ backgroundColor: activeStyle.canvas.background }}
            nodeColor={() => activeStyle.nodeDefaults.fill === '#ffffff' || activeStyle.nodeDefaults.fill === '#fff' ? '#3b82f6' : activeStyle.nodeDefaults.fill}
            maskColor={activeStyle.dark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.7)'}
            pannable
            zoomable
          />
        )}

        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-left"
        />
      </ReactFlow>

      {/* Ruler overlays */}
      {rulerVisible && (
        <>
          <RulerCorner />
          <Ruler orientation="horizontal" />
          <Ruler orientation="vertical" />
        </>
      )}

      {/* Walk mode breadcrumb overlay */}
      {walkModeActive && <WalkModeBreadcrumb />}

      {/* Chain highlight overlay */}
      {highlightedChain.size > 0 && <ChainHighlight />}

      {/* Canvas context menu */}
      {canvasMenu && (
        <CanvasContextMenu
          x={canvasMenu.x}
          y={canvasMenu.y}
          onClose={closeContextMenus}
          onAddNode={handleAddNodeAtMenu}
          onSelectAll={handleSelectAll}
          onFitView={handleFitView}
          onInsertSwimlanes={handleInsertSwimlanes}
        />
      )}

      {/* Node context menu */}
      {nodeMenu && (
        <NodeContextMenu
          x={nodeMenu.x}
          y={nodeMenu.y}
          nodeId={nodeMenu.nodeId}
          onClose={closeContextMenus}
          onEditLabel={handleEditLabel}
          onDuplicate={handleDuplicateNode}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
          onChangeShape={handleChangeShape}
          onChangeColor={handleChangeColor}
          onSendToBack={handleSendToBack}
          onBringToFront={handleBringToFront}
          isGroupNode={isNodeMenuGroupNode}
          onUngroup={handleUngroupNode}
          hasMultipleSelected={useFlowStore.getState().selectedNodes.length > 1}
          onAlign={(fn) => {
            const { nodes, selectedNodes, updateNodePosition } = useFlowStore.getState();
            const idSet = new Set(selectedNodes);
            const selected = nodes.filter((n) => idSet.has(n.id));
            if (selected.length < 2) return;
            const positions = fn(selected);
            for (const [id, pos] of positions) {
              updateNodePosition(id, pos);
            }
          }}
        />
      )}

      {/* Edge context menu */}
      {edgeMenu && (
        <EdgeContextMenu
          x={edgeMenu.x}
          y={edgeMenu.y}
          edgeId={edgeMenu.edgeId}
          onClose={closeContextMenus}
          onChangeType={handleEdgeChangeType}
          onChangeColor={handleEdgeChangeColor}
          onEditLabel={handleEdgeEditLabel}
          onDelete={handleEdgeDelete}
        />
      )}

      {/* Selection context menu (multi-select) */}
      {selectionMenu && (
        <SelectionContextMenu
          x={selectionMenu.x}
          y={selectionMenu.y}
          nodeIds={selectionMenu.nodeIds}
          onClose={closeContextMenus}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exported wrapper with provider
// ---------------------------------------------------------------------------

const FlowCanvas: React.FC<FlowCanvasProps> = ({ onInit }) => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner onInit={onInit} />
    </ReactFlowProvider>
  );
};

export default React.memo(FlowCanvas);
