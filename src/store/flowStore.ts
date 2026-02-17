import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Viewport,
  type Node,
  type Edge,
  type XYPosition,
} from '@xyflow/react';
import { suggestEdgeType } from '../utils/edgeRoutingUtils';
import { log } from '../utils/logger';

// ---------------------------------------------------------------------------
// Inline types  (will move to ../types/ later)
// ---------------------------------------------------------------------------

/** Possible node shape identifiers */
export type NodeShape =
  | 'rectangle'
  | 'roundedRectangle'
  | 'diamond'
  | 'circle'
  | 'ellipse'
  | 'parallelogram'
  | 'hexagon'
  | 'triangle'
  | 'star'
  | 'cloud'
  | 'arrow'
  | 'callout'
  | 'document'
  | 'predefinedProcess'
  | 'manualInput'
  | 'preparation'
  | 'data'
  | 'database'
  | 'internalStorage'
  | 'display'
  | 'blockArrow'
  | 'chevronArrow'
  | 'doubleArrow'
  | 'circularArrow'
  | 'group';

/** Status indicator for tracking node progress */
export interface StatusIndicator {
  id: string;
  status: 'none' | 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'review';
  color?: string;
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  icon?: string;
}

/** Generate a unique puck ID */
export const newPuckId = () => `puck_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/** Migrate legacy singular statusIndicator → statusIndicators array */
export function getStatusIndicators(data: FlowNodeData): StatusIndicator[] {
  if (data.statusIndicators && data.statusIndicators.length > 0) return data.statusIndicators;
  if (data.statusIndicator) {
    return [{ ...data.statusIndicator, id: (data.statusIndicator as StatusIndicator).id || newPuckId() }];
  }
  return [];
}

/** Data payload stored on every FlowCraft node */
export interface FlowNodeData {
  label: string;
  shape: NodeShape;
  description?: string;
  color?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  iconBorderColor?: string;
  iconBorderWidth?: number;
  iconSize?: number;
  iconPosition?: 'left' | 'right';
  layerId?: string;
  swimlaneId?: string;
  width?: number;
  height?: number;
  opacity?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  /** Corner radius override (px) */
  borderRadius?: number;
  /** Icon-only mode: render just the icon with no shape background */
  iconOnly?: boolean;
  /** ID of the group node this node belongs to */
  groupId?: string;
  /** Link group ID for logical grouping (move-together) */
  linkGroupId?: string;
  /** @deprecated Use statusIndicators instead */
  statusIndicator?: StatusIndicator;
  /** Array of status indicator badges on the node */
  statusIndicators?: StatusIndicator[];
  /** Dependency metadata */
  dependsOn?: string[];
  blockedBy?: string[];
  [key: string]: unknown;
}

/** A typed React Flow node used throughout FlowCraft */
export type FlowNode = Node<FlowNodeData, string>;

/** Data payload stored on every FlowCraft edge */
export interface FlowEdgeData {
  label?: string;
  color?: string;
  thickness?: number;
  animated?: boolean;
  opacity?: number;
  labelColor?: string;
  /** Position of the label along the edge (0 = source, 0.5 = center, 1 = target). Default 0.5. */
  labelPosition?: number;
  dependencyType?: 'depends-on' | 'blocks' | 'related';
  [key: string]: unknown;
}

/** A typed React Flow edge used throughout FlowCraft */
export type FlowEdge = Edge<FlowEdgeData>;

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface FlowState {
  // ---- state --------------------------------------------------
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
  selectedNodes: string[];
  selectedEdges: string[];

  // ---- React Flow event handlers ------------------------------
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // ---- node CRUD ----------------------------------------------
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  updateNodePosition: (nodeId: string, position: XYPosition) => void;
  setNodes: (nodes: FlowNode[]) => void;
  getNode: (nodeId: string) => FlowNode | undefined;

  // ---- edge CRUD ----------------------------------------------
  setEdges: (edges: FlowEdge[]) => void;
  getEdge: (edgeId: string) => FlowEdge | undefined;
  updateEdgeData: (edgeId: string, data: Partial<FlowEdgeData>) => void;

  // ---- status puck CRUD --------------------------------------
  addStatusPuck: (nodeId: string, puck: StatusIndicator) => void;
  updateStatusPuck: (nodeId: string, puckId: string, patch: Partial<StatusIndicator>) => void;
  removeStatusPuck: (nodeId: string, puckId: string) => void;

  // ---- link group helpers ------------------------------------
  createLinkGroup: (nodeIds: string[]) => string;
  removeLinkGroup: (linkGroupId: string) => void;

  // ---- selection helpers --------------------------------------
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearSelection: () => void;

  // ---- viewport -----------------------------------------------
  setViewport: (vp: Viewport) => void;
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

// ---------------------------------------------------------------------------
// Store creation (immer middleware for easy immutable updates)
// ---------------------------------------------------------------------------

export const useFlowStore = create<FlowState>()(
  immer((set, get) => ({
    // -- initial state -------------------------------------------
    nodes: [],
    edges: [],
    viewport: DEFAULT_VIEWPORT,
    selectedNodes: [],
    selectedEdges: [],

    // -- React Flow handlers ------------------------------------
    onNodesChange: (changes) => {
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes) as FlowNode[];

        // Keep selectedNodes in sync with selection changes
        const selectionChanges = changes.filter(
          (c): c is NodeChange<FlowNode> & { type: 'select' } => c.type === 'select',
        );
        if (selectionChanges.length > 0) {
          const selected = new Set(state.selectedNodes);
          for (const change of selectionChanges) {
            if (change.selected) {
              selected.add(change.id);
            } else {
              selected.delete(change.id);
            }
          }
          state.selectedNodes = Array.from(selected);
        }
      });
    },

    onEdgesChange: (changes) => {
      set((state) => {
        // Find edges being removed before applying changes
        const removedEdges = changes
          .filter((c): c is EdgeChange<FlowEdge> & { type: 'remove' } => c.type === 'remove')
          .map(c => state.edges.find(e => e.id === c.id))
          .filter(Boolean);

        state.edges = applyEdgeChanges(changes, state.edges) as FlowEdge[];

        // Clean up dependency metadata for removed edges
        for (const edge of removedEdges) {
          if (!edge) continue;
          const targetNode = state.nodes.find(n => n.id === edge.target);
          const sourceNode = state.nodes.find(n => n.id === edge.source);
          if (targetNode && targetNode.data.dependsOn) {
            targetNode.data = {
              ...targetNode.data,
              dependsOn: targetNode.data.dependsOn.filter(id => id !== edge.source),
            };
          }
          if (sourceNode && sourceNode.data.blockedBy) {
            sourceNode.data = {
              ...sourceNode.data,
              blockedBy: sourceNode.data.blockedBy.filter(id => id !== edge.target),
            };
          }
        }

        const selectionChanges = changes.filter(
          (c): c is EdgeChange<FlowEdge> & { type: 'select' } => c.type === 'select',
        );
        if (selectionChanges.length > 0) {
          const selected = new Set(state.selectedEdges);
          for (const change of selectionChanges) {
            if (change.selected) {
              selected.add(change.id);
            } else {
              selected.delete(change.id);
            }
          }
          state.selectedEdges = Array.from(selected);
        }
      });
    },

    onConnect: (connection) => {
      log.debug('onConnect', connection.source, '->', connection.target);
      set((state) => {
        state.edges = addEdge(connection, state.edges) as FlowEdge[];

        // Auto-update dependency metadata on connected nodes
        if (connection.source && connection.target) {
          const targetNode = state.nodes.find(n => n.id === connection.target);
          const sourceNode = state.nodes.find(n => n.id === connection.source);
          if (targetNode) {
            const deps = new Set(targetNode.data.dependsOn || []);
            deps.add(connection.source);
            targetNode.data = { ...targetNode.data, dependsOn: Array.from(deps) };
          }
          if (sourceNode) {
            const blocked = new Set(sourceNode.data.blockedBy || []);
            blocked.add(connection.target);
            sourceNode.data = { ...sourceNode.data, blockedBy: Array.from(blocked) };
          }
        }

        // Auto-detect edge type based on node alignment
        if (connection.source && connection.target) {
          const source = state.nodes.find(n => n.id === connection.source);
          const target = state.nodes.find(n => n.id === connection.target);
          if (source && target) {
            const suggested = suggestEdgeType(source.position, target.position);
            if (suggested === 'straight') {
              const newEdge = state.edges[state.edges.length - 1];
              if (newEdge) {
                newEdge.type = 'straight';
              }
            }
          }
        }
      });
    },

    // -- node CRUD -----------------------------------------------
    addNode: (node) => {
      log.debug('addNode', node.id, node.data?.shape);
      set((state) => {
        state.nodes.push(node);
      });
    },

    removeNode: (nodeId) => {
      log.debug('removeNode', nodeId);
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        // Also remove connected edges
        state.edges = state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );
        state.selectedNodes = state.selectedNodes.filter((id) => id !== nodeId);

        // Clean up dependency references from remaining nodes
        for (const node of state.nodes) {
          if (node.data.dependsOn?.includes(nodeId)) {
            node.data = {
              ...node.data,
              dependsOn: node.data.dependsOn.filter(id => id !== nodeId),
            };
          }
          if (node.data.blockedBy?.includes(nodeId)) {
            node.data = {
              ...node.data,
              blockedBy: node.data.blockedBy.filter(id => id !== nodeId),
            };
          }
        }
      });
    },

    updateNodeData: (nodeId, data) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = { ...node.data, ...data };
        }
      });
    },

    updateNodePosition: (nodeId, position) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.position = position;
        }
      });
    },

    setNodes: (nodes) => {
      set((state) => {
        state.nodes = nodes;
      });
    },

    getNode: (nodeId) => {
      return get().nodes.find((n) => n.id === nodeId);
    },

    // -- edge CRUD -----------------------------------------------
    setEdges: (edges) => {
      set((state) => {
        state.edges = edges;
      });
    },

    getEdge: (edgeId) => {
      return get().edges.find((e) => e.id === edgeId);
    },

    updateEdgeData: (edgeId, data) => {
      set((state) => {
        const edge = state.edges.find((e) => e.id === edgeId);
        if (edge) {
          edge.data = { ...edge.data, ...data };
        }
      });
    },

    // -- status puck CRUD ------------------------------------------
    addStatusPuck: (nodeId, puck) => {
      log.debug('addStatusPuck', nodeId, puck.id);
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          const existing = node.data.statusIndicators || [];
          node.data = { ...node.data, statusIndicators: [...existing, puck], statusIndicator: undefined };
        }
      });
    },

    updateStatusPuck: (nodeId, puckId, patch) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node && node.data.statusIndicators) {
          node.data = {
            ...node.data,
            statusIndicators: node.data.statusIndicators.map((p) =>
              p.id === puckId ? { ...p, ...patch } : p,
            ),
          };
        }
      });
    },

    removeStatusPuck: (nodeId, puckId) => {
      log.debug('removeStatusPuck', nodeId, puckId);
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node && node.data.statusIndicators) {
          node.data = {
            ...node.data,
            statusIndicators: node.data.statusIndicators.filter((p) => p.id !== puckId),
          };
        }
      });
    },

    // -- link group -----------------------------------------------
    createLinkGroup: (nodeIds) => {
      const linkGroupId = `lg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((state) => {
        for (const node of state.nodes) {
          if (nodeIds.includes(node.id)) {
            node.data = { ...node.data, linkGroupId };
          }
        }
      });
      return linkGroupId;
    },

    removeLinkGroup: (linkGroupId) => {
      set((state) => {
        for (const node of state.nodes) {
          if (node.data.linkGroupId === linkGroupId) {
            node.data = { ...node.data, linkGroupId: undefined };
          }
        }
      });
    },

    // -- selection ------------------------------------------------
    setSelectedNodes: (ids) => {
      set((state) => {
        state.selectedNodes = ids;
        const idSet = new Set(ids);
        state.nodes.forEach((n) => {
          n.selected = idSet.has(n.id);
        });
      });
    },

    setSelectedEdges: (ids) => {
      set((state) => {
        state.selectedEdges = ids;
        const idSet = new Set(ids);
        state.edges.forEach((e) => {
          e.selected = idSet.has(e.id);
        });
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedNodes = [];
        state.selectedEdges = [];
        state.nodes.forEach((n) => { n.selected = false; });
        state.edges.forEach((e) => { e.selected = false; });
      });
    },

    // -- viewport -------------------------------------------------
    setViewport: (vp) => {
      set((state) => {
        state.viewport = vp;
      });
    },
  })),
);

/** Direct access to the store (useful outside of React components) */
export const flowStore: StoreApi<FlowState> = useFlowStore;
