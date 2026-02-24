// ---------------------------------------------------------------------------
// AI Tool Executor — maps tool calls to Zustand store actions
// ---------------------------------------------------------------------------

import { useFlowStore, newPuckId } from '@/store/flowStore';
import type { FlowNode, FlowEdge, FlowNodeData, FlowEdgeData, StatusIndicator } from '@/store/flowStore';
import { useStyleStore } from '@/store/styleStore';
import { useSwimlaneStore } from '@/store/swimlaneStore';
import type { SwimlaneOrientation, SwimlaneItem } from '@/store/swimlaneStore';
import { importFromJson } from '@/utils/exportUtils';
import { applyDagreLayout } from '@/utils/layoutEngine';
import type { LayoutDirection } from '@/utils/layoutEngine';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface ToolResult {
  success: boolean;
  result: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique node ID. */
function genNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Generate a unique edge ID. */
function genEdgeId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Generate a unique lane ID. */
function genLaneId(): string {
  return `lane_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Get the canvas center in flow coordinates. */
function getViewportCenter(): { x: number; y: number } {
  const { viewport } = useFlowStore.getState();
  return {
    x: (-viewport.x + window.innerWidth / 2) / viewport.zoom,
    y: (-viewport.y + window.innerHeight / 2) / viewport.zoom,
  };
}

/** Status-to-color mapping for pucks when no explicit color is provided. */
const STATUS_COLORS: Record<string, string> = {
  'not-started': '#9ca3af',
  'in-progress': '#3b82f6',
  'completed': '#22c55e',
  'blocked': '#ef4444',
  'review': '#eab308',
};

// ---------------------------------------------------------------------------
// Shorthand accessors (all outside React via .getState())
// ---------------------------------------------------------------------------

function flowState() {
  return useFlowStore.getState();
}

function styleState() {
  return useStyleStore.getState();
}

function swimlaneState() {
  return useSwimlaneStore.getState();
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

type ToolHandler = (args: Record<string, unknown>) => ToolResult;

const handlers: Record<string, ToolHandler> = {
  // =========================================================================
  // Category 1: Canvas
  // =========================================================================

  generate_diagram: (args) => {
    const diagram = args.diagram as Record<string, unknown>;
    if (!diagram) {
      return { success: false, result: 'Error: Missing diagram object' };
    }
    const result = importFromJson(diagram);
    const warnings = result.warnings.length > 0 ? `, ${result.warnings.length} warnings` : '';
    return {
      success: true,
      result: `Generated diagram: ${result.nodeCount} nodes, ${result.edgeCount} edges${warnings}`,
    };
  },

  clear_canvas: () => {
    const { setNodes, setEdges } = flowState();
    setNodes([]);
    setEdges([]);
    return { success: true, result: 'Canvas cleared' };
  },

  auto_layout: (args) => {
    const direction = (args.direction as LayoutDirection) || 'TB';
    const spacingX = (args.spacing_x as number) || 80;
    const spacingY = (args.spacing_y as number) || 100;
    const { nodes, edges, batchUpdatePositions } = flowState();

    if (nodes.length === 0) {
      return { success: true, result: 'Nothing to layout — canvas is empty' };
    }

    const laidOut = applyDagreLayout(nodes, edges, direction, spacingX, spacingY);
    const positions = new Map<string, { x: number; y: number }>();
    for (const node of laidOut) {
      positions.set(node.id, node.position);
    }
    batchUpdatePositions(positions);

    return {
      success: true,
      result: `Auto-layout applied (${direction}) to ${nodes.length} nodes`,
    };
  },

  // =========================================================================
  // Category 2: Nodes
  // =========================================================================

  add_node: (args) => {
    const label = args.label as string;
    if (!label) {
      return { success: false, result: 'Error: label is required' };
    }

    const shape = (args.shape as string) || 'rectangle';
    const center = getViewportCenter();
    const x = (args.x as number) ?? center.x;
    const y = (args.y as number) ?? center.y;
    const id = genNodeId();

    const data: FlowNodeData = {
      label,
      shape: shape as FlowNodeData['shape'],
    };

    // Apply optional properties
    if (args.color !== undefined) data.color = args.color as string;
    if (args.borderColor !== undefined) data.borderColor = args.borderColor as string;
    if (args.textColor !== undefined) data.textColor = args.textColor as string;
    if (args.width !== undefined) data.width = args.width as number;
    if (args.height !== undefined) data.height = args.height as number;
    if (args.icon !== undefined) data.icon = args.icon as string;
    if (args.fontSize !== undefined) data.fontSize = args.fontSize as number;
    if (args.description !== undefined) data.description = args.description as string;
    if (args.notes !== undefined) data.notes = args.notes as string;

    const node: FlowNode = {
      id,
      type: shape,
      position: { x, y },
      data,
    };

    flowState().addNode(node);

    return {
      success: true,
      result: `Added node '${label}' (id: ${id}) at position (${Math.round(x)}, ${Math.round(y)})`,
    };
  },

  update_node: (args) => {
    const nodeId = args.node_id as string;
    if (!nodeId) {
      return { success: false, result: 'Error: node_id is required' };
    }

    const node = flowState().getNode(nodeId);
    if (!node) {
      return { success: false, result: `Error: Node '${nodeId}' not found` };
    }

    const patch: Partial<FlowNodeData> = {};
    const changes: string[] = [];

    const fields: Array<{ key: string; dataKey: keyof FlowNodeData }> = [
      { key: 'label', dataKey: 'label' },
      { key: 'shape', dataKey: 'shape' },
      { key: 'color', dataKey: 'color' },
      { key: 'borderColor', dataKey: 'borderColor' },
      { key: 'textColor', dataKey: 'textColor' },
      { key: 'width', dataKey: 'width' },
      { key: 'height', dataKey: 'height' },
      { key: 'icon', dataKey: 'icon' },
      { key: 'fontSize', dataKey: 'fontSize' },
      { key: 'fontWeight', dataKey: 'fontWeight' },
      { key: 'opacity', dataKey: 'opacity' },
      { key: 'borderStyle', dataKey: 'borderStyle' },
      { key: 'borderWidth', dataKey: 'borderWidth' },
      { key: 'borderRadius', dataKey: 'borderRadius' },
      { key: 'description', dataKey: 'description' },
      { key: 'notes', dataKey: 'notes' },
    ];

    for (const { key, dataKey } of fields) {
      if (args[key] !== undefined) {
        (patch as Record<string, unknown>)[dataKey] = args[key];
        changes.push(`${key} → ${String(args[key])}`);
      }
    }

    if (changes.length === 0) {
      return { success: true, result: `No changes specified for node '${node.data.label}'` };
    }

    flowState().updateNodeData(nodeId, patch);

    // If shape changed, also update the node type for React Flow
    if (args.shape !== undefined) {
      flowState().updateNodeData(nodeId, { shape: args.shape as FlowNodeData['shape'] });
    }

    return {
      success: true,
      result: `Updated node '${node.data.label}': ${changes.join(', ')}`,
    };
  },

  remove_nodes: (args) => {
    const nodeIds = args.node_ids as string[];
    if (!nodeIds || nodeIds.length === 0) {
      return { success: false, result: 'Error: node_ids array is required' };
    }

    const { removeNode } = flowState();
    let removed = 0;
    for (const id of nodeIds) {
      const node = flowState().getNode(id);
      if (node) {
        removeNode(id);
        removed++;
      }
    }

    return { success: true, result: `Removed ${removed} node${removed !== 1 ? 's' : ''}` };
  },

  list_nodes: (args) => {
    const includePositions = (args.include_positions as boolean) !== false;
    const includeStyles = (args.include_styles as boolean) === true;
    const { nodes } = flowState();

    if (nodes.length === 0) {
      return { success: true, result: 'No nodes on the canvas' };
    }

    const lines: string[] = [];
    for (const n of nodes) {
      let line = `- ${n.id}: "${n.data.label}" (${n.data.shape})`;
      if (includePositions) {
        line += ` at (${Math.round(n.position.x)}, ${Math.round(n.position.y)})`;
      }
      if (includeStyles) {
        if (n.data.color) line += ` color=${n.data.color}`;
        if (n.data.fontSize) line += ` fontSize=${n.data.fontSize}`;
        if (n.data.borderColor) line += ` border=${n.data.borderColor}`;
      }
      lines.push(line);
    }

    return {
      success: true,
      result: `${nodes.length} nodes:\n${lines.join('\n')}`,
    };
  },

  move_node: (args) => {
    const nodeId = args.node_id as string;
    const x = args.x as number;
    const y = args.y as number;

    if (!nodeId) return { success: false, result: 'Error: node_id is required' };
    if (x === undefined || y === undefined) {
      return { success: false, result: 'Error: x and y are required' };
    }

    const node = flowState().getNode(nodeId);
    if (!node) {
      return { success: false, result: `Error: Node '${nodeId}' not found` };
    }

    flowState().updateNodePosition(nodeId, { x, y });

    return {
      success: true,
      result: `Moved node '${node.data.label}' to (${Math.round(x)}, ${Math.round(y)})`,
    };
  },

  resize_node: (args) => {
    const nodeId = args.node_id as string;
    const width = args.width as number;
    const height = args.height as number;

    if (!nodeId) return { success: false, result: 'Error: node_id is required' };

    const node = flowState().getNode(nodeId);
    if (!node) {
      return { success: false, result: `Error: Node '${nodeId}' not found` };
    }

    flowState().updateNodeData(nodeId, { width, height });

    return {
      success: true,
      result: `Resized node '${node.data.label}' to ${width}x${height}`,
    };
  },

  duplicate_node: (args) => {
    const sourceId = args.node_id as string;
    if (!sourceId) return { success: false, result: 'Error: node_id is required' };

    const source = flowState().getNode(sourceId);
    if (!source) {
      return { success: false, result: `Error: Node '${sourceId}' not found` };
    }

    const offsetX = (args.offset_x as number) ?? 50;
    const offsetY = (args.offset_y as number) ?? 50;
    const newId = genNodeId();

    const newNode: FlowNode = {
      id: newId,
      type: source.type,
      position: {
        x: source.position.x + offsetX,
        y: source.position.y + offsetY,
      },
      data: { ...source.data },
    };

    flowState().addNode(newNode);

    return {
      success: true,
      result: `Duplicated '${source.data.label}' → new node (id: ${newId}) at (${Math.round(newNode.position.x)}, ${Math.round(newNode.position.y)})`,
    };
  },

  // =========================================================================
  // Category 3: Edges
  // =========================================================================

  add_edge: (args) => {
    const source = args.source as string;
    const target = args.target as string;

    if (!source || !target) {
      return { success: false, result: 'Error: source and target are required' };
    }
    if (source === target) {
      return { success: false, result: 'Error: Cannot connect node to itself' };
    }

    // Verify both nodes exist
    const sourceNode = flowState().getNode(source);
    const targetNode = flowState().getNode(target);
    if (!sourceNode) return { success: false, result: `Error: Source node '${source}' not found` };
    if (!targetNode) return { success: false, result: `Error: Target node '${target}' not found` };

    const edgeId = genEdgeId();
    const edgeType = (args.type as string) || 'smoothstep';

    const edgeData: FlowEdgeData = {};
    if (args.label !== undefined) edgeData.label = args.label as string;
    if (args.color !== undefined) edgeData.color = args.color as string;
    if (args.animated !== undefined) edgeData.animated = args.animated as boolean;
    if (args.thickness !== undefined) edgeData.thickness = args.thickness as number;

    const newEdge: FlowEdge = {
      id: edgeId,
      source,
      target,
      type: edgeType,
      data: edgeData,
    };

    const { edges, setEdges } = flowState();
    setEdges([...edges, newEdge]);

    const labelInfo = args.label ? ` "${args.label}"` : '';
    return {
      success: true,
      result: `Added edge${labelInfo} from '${source}' to '${target}' (id: ${edgeId})`,
    };
  },

  update_edge: (args) => {
    const edgeId = args.edge_id as string;
    if (!edgeId) return { success: false, result: 'Error: edge_id is required' };

    const edge = flowState().getEdge(edgeId);
    if (!edge) {
      return { success: false, result: `Error: Edge '${edgeId}' not found` };
    }

    const dataPatch: Partial<FlowEdgeData> = {};
    const changes: string[] = [];

    if (args.label !== undefined) {
      dataPatch.label = args.label as string;
      changes.push(`label → "${args.label}"`);
    }
    if (args.color !== undefined) {
      dataPatch.color = args.color as string;
      changes.push(`color → ${args.color}`);
    }
    if (args.thickness !== undefined) {
      dataPatch.thickness = args.thickness as number;
      changes.push(`thickness → ${args.thickness}`);
    }
    if (args.animated !== undefined) {
      dataPatch.animated = args.animated as boolean;
      changes.push(`animated → ${args.animated}`);
    }
    if (args.opacity !== undefined) {
      dataPatch.opacity = args.opacity as number;
      changes.push(`opacity → ${args.opacity}`);
    }

    if (Object.keys(dataPatch).length > 0) {
      flowState().updateEdgeData(edgeId, dataPatch);
    }

    // Edge type is a top-level field, not inside data
    if (args.type !== undefined) {
      flowState().updateEdge(edgeId, { type: args.type as string });
      changes.push(`type → ${args.type}`);
    }

    if (changes.length === 0) {
      return { success: true, result: `No changes specified for edge '${edgeId}'` };
    }

    return {
      success: true,
      result: `Updated edge '${edgeId}': ${changes.join(', ')}`,
    };
  },

  remove_edges: (args) => {
    const edgeIds = args.edge_ids as string[];
    if (!edgeIds || edgeIds.length === 0) {
      return { success: false, result: 'Error: edge_ids array is required' };
    }

    const removeSet = new Set(edgeIds);
    const { edges, setEdges } = flowState();
    const before = edges.length;
    setEdges(edges.filter((e) => !removeSet.has(e.id)));
    const removed = before - flowState().edges.length;

    return { success: true, result: `Removed ${removed} edge${removed !== 1 ? 's' : ''}` };
  },

  list_edges: () => {
    const { edges } = flowState();

    if (edges.length === 0) {
      return { success: true, result: 'No edges on the canvas' };
    }

    const lines = edges.map((e) => {
      const label = e.data?.label ? ` "${e.data.label}"` : '';
      return `- ${e.id}: ${e.source} → ${e.target}${label} (${e.type || 'smoothstep'})`;
    });

    return {
      success: true,
      result: `${edges.length} edges:\n${lines.join('\n')}`,
    };
  },

  // =========================================================================
  // Category 4: Selection
  // =========================================================================

  select_nodes: (args) => {
    const nodeIds = args.node_ids as string[];
    if (!nodeIds) return { success: false, result: 'Error: node_ids is required' };

    flowState().setSelectedNodes(nodeIds);
    return { success: true, result: `Selected ${nodeIds.length} node${nodeIds.length !== 1 ? 's' : ''}` };
  },

  select_edges: (args) => {
    const edgeIds = args.edge_ids as string[];
    if (!edgeIds) return { success: false, result: 'Error: edge_ids is required' };

    flowState().setSelectedEdges(edgeIds);
    return { success: true, result: `Selected ${edgeIds.length} edge${edgeIds.length !== 1 ? 's' : ''}` };
  },

  clear_selection: () => {
    flowState().clearSelection();
    return { success: true, result: 'Selection cleared' };
  },

  get_selection: () => {
    const { selectedNodes, selectedEdges, nodes, edges } = flowState();

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return { success: true, result: 'Nothing is selected' };
    }

    const parts: string[] = [];
    if (selectedNodes.length > 0) {
      const nodeDescs = selectedNodes.map((id) => {
        const n = nodes.find((node) => node.id === id);
        return n ? `${id} ("${n.data.label}")` : id;
      });
      parts.push(`Nodes: ${nodeDescs.join(', ')}`);
    }
    if (selectedEdges.length > 0) {
      const edgeDescs = selectedEdges.map((id) => {
        const e = edges.find((edge) => edge.id === id);
        return e ? `${id} (${e.source} → ${e.target})` : id;
      });
      parts.push(`Edges: ${edgeDescs.join(', ')}`);
    }

    return { success: true, result: parts.join('\n') };
  },

  // =========================================================================
  // Category 5: Style
  // =========================================================================

  set_diagram_style: (args) => {
    const styleId = args.style_id as string;
    if (!styleId) return { success: false, result: 'Error: style_id is required' };

    styleState().setStyle(styleId);
    return { success: true, result: `Diagram style set to '${styleId}'` };
  },

  set_color_palette: (args) => {
    const paletteId = args.palette_id as string;
    if (!paletteId) return { success: false, result: 'Error: palette_id is required' };

    styleState().setPalette(paletteId);
    return { success: true, result: `Color palette set to '${paletteId}'` };
  },

  set_node_color: (args) => {
    const nodeIds = args.node_ids as string[];
    const color = args.color as string;

    if (!nodeIds || nodeIds.length === 0) {
      return { success: false, result: 'Error: node_ids is required' };
    }
    if (!color) return { success: false, result: 'Error: color is required' };

    const { updateNodeData } = flowState();
    let updated = 0;
    for (const id of nodeIds) {
      const node = flowState().getNode(id);
      if (node) {
        updateNodeData(id, { color });
        updated++;
      }
    }

    return {
      success: true,
      result: `Set color ${color} on ${updated} node${updated !== 1 ? 's' : ''}`,
    };
  },

  toggle_dark_mode: (args) => {
    const enabled = args.enabled as boolean | undefined;
    if (enabled !== undefined) {
      styleState().setDarkMode(enabled);
      return { success: true, result: `Dark mode ${enabled ? 'enabled' : 'disabled'}` };
    }
    styleState().toggleDarkMode();
    const newState = styleState().darkMode;
    return { success: true, result: `Dark mode ${newState ? 'enabled' : 'disabled'}` };
  },

  // =========================================================================
  // Category 6: Swimlanes
  // =========================================================================

  add_swimlane: (args) => {
    const label = args.label as string;
    if (!label) return { success: false, result: 'Error: label is required' };

    const orientation = (args.orientation as SwimlaneOrientation) || 'horizontal';
    const color = (args.color as string) || '#e0f2fe';
    const laneId = genLaneId();

    const lane: SwimlaneItem = {
      id: laneId,
      label,
      color,
      collapsed: false,
      size: 200,
      order: 0,
    };

    swimlaneState().addLane(orientation, lane);

    return {
      success: true,
      result: `Added ${orientation} swimlane '${label}' (id: ${laneId})`,
    };
  },

  update_swimlane: (args) => {
    const laneId = args.lane_id as string;
    if (!laneId) return { success: false, result: 'Error: lane_id is required' };

    const orientation = (args.orientation as SwimlaneOrientation) || 'horizontal';
    const patch: Partial<Omit<SwimlaneItem, 'id'>> = {};
    const changes: string[] = [];

    if (args.label !== undefined) {
      patch.label = args.label as string;
      changes.push(`label → "${args.label}"`);
    }
    if (args.color !== undefined) {
      patch.color = args.color as string;
      changes.push(`color → ${args.color}`);
    }

    if (changes.length === 0) {
      return { success: true, result: `No changes specified for swimlane '${laneId}'` };
    }

    swimlaneState().updateLane(orientation, laneId, patch);

    return {
      success: true,
      result: `Updated swimlane '${laneId}': ${changes.join(', ')}`,
    };
  },

  remove_swimlane: (args) => {
    const laneId = args.lane_id as string;
    const orientation = args.orientation as SwimlaneOrientation;

    if (!laneId) return { success: false, result: 'Error: lane_id is required' };
    if (!orientation) return { success: false, result: 'Error: orientation is required' };

    swimlaneState().removeLane(orientation, laneId);

    return { success: true, result: `Removed swimlane '${laneId}'` };
  },

  assign_node_to_lane: (args) => {
    const nodeId = args.node_id as string;
    const laneId = args.lane_id as string;

    if (!nodeId) return { success: false, result: 'Error: node_id is required' };
    if (!laneId) return { success: false, result: 'Error: lane_id is required' };

    const node = flowState().getNode(nodeId);
    if (!node) {
      return { success: false, result: `Error: Node '${nodeId}' not found` };
    }

    flowState().updateNodeData(nodeId, { swimlaneId: laneId });

    return {
      success: true,
      result: `Assigned node '${node.data.label}' to swimlane '${laneId}'`,
    };
  },

  // =========================================================================
  // Category 7: Layout
  // =========================================================================

  align_nodes: (args) => {
    const alignment = args.alignment as string;
    if (!alignment) return { success: false, result: 'Error: alignment is required' };

    let nodeIds = args.node_ids as string[] | undefined;
    if (!nodeIds || nodeIds.length === 0) {
      nodeIds = flowState().selectedNodes;
    }
    if (nodeIds.length < 2) {
      return { success: false, result: 'Error: At least 2 nodes are needed for alignment' };
    }

    const { nodes, batchUpdatePositions } = flowState();
    const targetNodes = nodes.filter((n) => nodeIds!.includes(n.id));

    if (targetNodes.length < 2) {
      return { success: false, result: 'Error: Could not find enough nodes to align' };
    }

    const positions = new Map<string, { x: number; y: number }>();

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...targetNodes.map((n) => n.position.x));
        for (const n of targetNodes) {
          positions.set(n.id, { x: minX, y: n.position.y });
        }
        break;
      }
      case 'right': {
        const maxRight = Math.max(
          ...targetNodes.map((n) => n.position.x + (n.data.width || 160)),
        );
        for (const n of targetNodes) {
          positions.set(n.id, {
            x: maxRight - (n.data.width || 160),
            y: n.position.y,
          });
        }
        break;
      }
      case 'center-h': {
        const avgCenterX =
          targetNodes.reduce(
            (sum, n) => sum + n.position.x + (n.data.width || 160) / 2,
            0,
          ) / targetNodes.length;
        for (const n of targetNodes) {
          positions.set(n.id, {
            x: avgCenterX - (n.data.width || 160) / 2,
            y: n.position.y,
          });
        }
        break;
      }
      case 'top': {
        const minY = Math.min(...targetNodes.map((n) => n.position.y));
        for (const n of targetNodes) {
          positions.set(n.id, { x: n.position.x, y: minY });
        }
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(
          ...targetNodes.map((n) => n.position.y + (n.data.height || 60)),
        );
        for (const n of targetNodes) {
          positions.set(n.id, {
            x: n.position.x,
            y: maxBottom - (n.data.height || 60),
          });
        }
        break;
      }
      case 'center-v': {
        const avgCenterY =
          targetNodes.reduce(
            (sum, n) => sum + n.position.y + (n.data.height || 60) / 2,
            0,
          ) / targetNodes.length;
        for (const n of targetNodes) {
          positions.set(n.id, {
            x: n.position.x,
            y: avgCenterY - (n.data.height || 60) / 2,
          });
        }
        break;
      }
      default:
        return { success: false, result: `Error: Invalid alignment '${alignment}'` };
    }

    batchUpdatePositions(positions);
    return {
      success: true,
      result: `Aligned ${targetNodes.length} nodes (${alignment})`,
    };
  },

  distribute_nodes: (args) => {
    const direction = args.direction as string;
    if (!direction) return { success: false, result: 'Error: direction is required' };

    let nodeIds = args.node_ids as string[] | undefined;
    if (!nodeIds || nodeIds.length === 0) {
      nodeIds = flowState().selectedNodes;
    }
    if (nodeIds.length < 3) {
      return {
        success: false,
        result: 'Error: At least 3 nodes are needed for distribution',
      };
    }

    const { nodes, batchUpdatePositions } = flowState();
    const targetNodes = nodes
      .filter((n) => nodeIds!.includes(n.id))
      .sort((a, b) =>
        direction === 'horizontal'
          ? a.position.x - b.position.x
          : a.position.y - b.position.y,
      );

    if (targetNodes.length < 3) {
      return { success: false, result: 'Error: Could not find enough nodes to distribute' };
    }

    const positions = new Map<string, { x: number; y: number }>();

    if (direction === 'horizontal') {
      const first = targetNodes[0];
      const last = targetNodes[targetNodes.length - 1];
      const totalSpace =
        last.position.x +
        (last.data.width || 160) -
        first.position.x;
      const totalNodeWidth = targetNodes.reduce(
        (sum, n) => sum + (n.data.width || 160),
        0,
      );
      const gap = (totalSpace - totalNodeWidth) / (targetNodes.length - 1);

      let currentX = first.position.x;
      for (const n of targetNodes) {
        positions.set(n.id, { x: currentX, y: n.position.y });
        currentX += (n.data.width || 160) + gap;
      }
    } else {
      const first = targetNodes[0];
      const last = targetNodes[targetNodes.length - 1];
      const totalSpace =
        last.position.y +
        (last.data.height || 60) -
        first.position.y;
      const totalNodeHeight = targetNodes.reduce(
        (sum, n) => sum + (n.data.height || 60),
        0,
      );
      const gap = (totalSpace - totalNodeHeight) / (targetNodes.length - 1);

      let currentY = first.position.y;
      for (const n of targetNodes) {
        positions.set(n.id, { x: n.position.x, y: currentY });
        currentY += (n.data.height || 60) + gap;
      }
    }

    batchUpdatePositions(positions);
    return {
      success: true,
      result: `Distributed ${targetNodes.length} nodes ${direction}ly`,
    };
  },

  // =========================================================================
  // Category 8: Status & Dependencies
  // =========================================================================

  set_status_puck: (args) => {
    const nodeId = args.node_id as string;
    const status = args.status as string;

    if (!nodeId) return { success: false, result: 'Error: node_id is required' };
    if (!status) return { success: false, result: 'Error: status is required' };

    const node = flowState().getNode(nodeId);
    if (!node) {
      return { success: false, result: `Error: Node '${nodeId}' not found` };
    }

    // "none" removes all pucks
    if (status === 'none') {
      flowState().updateNodeData(nodeId, { statusIndicators: [] });
      return {
        success: true,
        result: `Removed status indicators from node '${node.data.label}'`,
      };
    }

    const position = (args.position as StatusIndicator['position']) || 'top-right';
    const color = (args.color as string) || STATUS_COLORS[status] || '#9ca3af';
    const icon = args.icon as string | undefined;

    const puck: StatusIndicator = {
      id: newPuckId(),
      status: status as StatusIndicator['status'],
      color,
      position,
      size: 16,
    };
    if (icon) puck.icon = icon;

    flowState().addStatusPuck(nodeId, puck);

    return {
      success: true,
      result: `Set status '${status}' on node '${node.data.label}'`,
    };
  },

  add_dependency: (args) => {
    const sourceId = args.source_id as string;
    const targetId = args.target_id as string;
    const depType = (args.type as string) || 'depends-on';

    if (!sourceId) return { success: false, result: 'Error: source_id is required' };
    if (!targetId) return { success: false, result: 'Error: target_id is required' };

    const sourceNode = flowState().getNode(sourceId);
    const targetNode = flowState().getNode(targetId);
    if (!sourceNode) return { success: false, result: `Error: Source node '${sourceId}' not found` };
    if (!targetNode) return { success: false, result: `Error: Target node '${targetId}' not found` };

    // Update dependency metadata on target node
    const existingDeps = targetNode.data.dependsOn || [];
    if (!existingDeps.includes(sourceId)) {
      flowState().updateNodeData(targetId, {
        dependsOn: [...existingDeps, sourceId],
      });
    }

    // Add a dependency edge
    const edgeId = `dep_${sourceId}_${targetId}`;
    const depEdge: FlowEdge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'smoothstep',
      data: {
        dependencyType: depType as FlowEdgeData['dependencyType'],
        label: depType,
      },
      style: { strokeDasharray: '5 5' },
    };

    const { edges, setEdges } = flowState();
    setEdges([...edges, depEdge]);

    return {
      success: true,
      result: `Added '${depType}' dependency: '${sourceNode.data.label}' → '${targetNode.data.label}'`,
    };
  },

  export_diagram: (args) => {
    const format = args.format as string;
    if (!format) return { success: false, result: 'Error: format is required' };

    if (format === 'json') {
      // JSON export can be done programmatically
      const { nodes, edges } = flowState();
      return {
        success: true,
        result: `Diagram has ${nodes.length} nodes and ${edges.length} edges. Please use the Export dialog (File > Export) to download the JSON file.`,
      };
    }

    // Other formats require DOM access for rendering
    return {
      success: true,
      result: `Export triggered for ${format.toUpperCase()}. Please use the Export dialog (File > Export > ${format.toUpperCase()}) to complete the export.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Execute a tool call by dispatching to the appropriate handler.
 *
 * @param name  The tool name (must match a key in the handler map)
 * @param args  Arguments parsed from the AI tool call
 * @returns     A ToolResult with success status and a human-readable message
 */
export function executeTool(name: string, args: Record<string, unknown>): ToolResult {
  const handler = handlers[name];
  if (!handler) {
    return { success: false, result: `Error: Unknown tool '${name}'` };
  }

  try {
    return handler(args);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, result: `Error: ${message}` };
  }
}
