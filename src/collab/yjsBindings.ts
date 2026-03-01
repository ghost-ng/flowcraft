// ---------------------------------------------------------------------------
// yjsBindings.ts — Bidirectional Zustand ↔ Yjs sync layer
//
// This is the core of the collaboration system. It:
// 1. Watches Zustand store changes and writes diffs to the Y.Doc
// 2. Watches Y.Doc changes and applies them to Zustand stores
// 3. Uses a guard flag (_isRemoteUpdate) to prevent infinite loops
// ---------------------------------------------------------------------------

import * as Y from 'yjs';
import { useFlowStore, type FlowNode, type FlowEdge, type FlowNodeData, type FlowEdgeData } from '../store/flowStore';
import { useSwimlaneStore } from '../store/swimlaneStore';
import { useLegendStore } from '../store/legendStore';
import { useBannerStore } from '../store/bannerStore';
import { useLayerStore } from '../store/layerStore';
import { useStyleStore } from '../store/styleStore';
import {
  getNodesMap,
  getEdgesMap,
  getSwimlanesMap,
  getLegendsMap,
  getBannersMap,
  getLayersMap,
  getStylesMap,
} from './yjsDoc';
import { POSITION_FLUSH_INTERVAL } from './constants';

// ---------------------------------------------------------------------------
// Remote update guard
// ---------------------------------------------------------------------------

let _isRemoteUpdate = false;

/** Check if the current store update originated from a remote peer */
export function isRemoteUpdate(): boolean {
  return _isRemoteUpdate;
}

// ---------------------------------------------------------------------------
// Conversion helpers: FlowNode/FlowEdge ↔ Y.Map
// ---------------------------------------------------------------------------

function nodeToYMap(node: FlowNode, _doc: Y.Doc): Y.Map<unknown> {
  const yNode = new Y.Map<unknown>();
  yNode.set('id', node.id);
  yNode.set('type', node.type ?? 'rectangle');

  const yPos = new Y.Map<number>();
  yPos.set('x', node.position.x);
  yPos.set('y', node.position.y);
  yNode.set('position', yPos);

  // Store data as a plain JSON object (property-level CRDT for top-level data keys)
  const yData = new Y.Map<unknown>();
  const data = node.data as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    yData.set(key, JSON.parse(JSON.stringify(value ?? null)));
  }
  yNode.set('data', yData);

  // Store optional fields
  if (node.measured) yNode.set('measured', JSON.parse(JSON.stringify(node.measured)));
  if (node.parentId) yNode.set('parentId', node.parentId);
  if (node.extent) yNode.set('extent', node.extent);
  if (node.style) yNode.set('style', JSON.parse(JSON.stringify(node.style)));

  return yNode;
}

function yMapToNode(yNode: Y.Map<unknown>): FlowNode {
  const yPos = yNode.get('position') as Y.Map<number>;
  const yData = yNode.get('data') as Y.Map<unknown>;

  const data: Record<string, unknown> = {};
  if (yData) {
    yData.forEach((value, key) => {
      data[key] = value instanceof Y.AbstractType
        ? JSON.parse(JSON.stringify(value.toJSON()))
        : value;
    });
  }

  const node: FlowNode = {
    id: yNode.get('id') as string,
    type: yNode.get('type') as string,
    position: {
      x: yPos?.get('x') ?? 0,
      y: yPos?.get('y') ?? 0,
    },
    data: data as FlowNodeData,
  };

  const measured = yNode.get('measured');
  if (measured) node.measured = measured as FlowNode['measured'];
  const parentId = yNode.get('parentId');
  if (parentId) node.parentId = parentId as string;
  const extent = yNode.get('extent');
  if (extent) node.extent = extent as FlowNode['extent'];
  const style = yNode.get('style');
  if (style) node.style = style as FlowNode['style'];

  return node;
}

function edgeToYMap(edge: FlowEdge, _doc: Y.Doc): Y.Map<unknown> {
  const yEdge = new Y.Map<unknown>();
  yEdge.set('id', edge.id);
  yEdge.set('type', edge.type ?? 'smoothstep');
  yEdge.set('source', edge.source);
  yEdge.set('target', edge.target);
  if (edge.sourceHandle) yEdge.set('sourceHandle', edge.sourceHandle);
  if (edge.targetHandle) yEdge.set('targetHandle', edge.targetHandle);
  if (edge.markerEnd) yEdge.set('markerEnd', JSON.parse(JSON.stringify(edge.markerEnd)));
  if (edge.markerStart) yEdge.set('markerStart', JSON.parse(JSON.stringify(edge.markerStart)));
  if (edge.style) yEdge.set('style', JSON.parse(JSON.stringify(edge.style)));

  const yData = new Y.Map<unknown>();
  const data = (edge.data ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    yData.set(key, JSON.parse(JSON.stringify(value ?? null)));
  }
  yEdge.set('data', yData);

  return yEdge;
}

function yMapToEdge(yEdge: Y.Map<unknown>): FlowEdge {
  const yData = yEdge.get('data') as Y.Map<unknown> | undefined;

  const data: Record<string, unknown> = {};
  if (yData) {
    yData.forEach((value, key) => {
      data[key] = value instanceof Y.AbstractType
        ? JSON.parse(JSON.stringify(value.toJSON()))
        : value;
    });
  }

  const edge: FlowEdge = {
    id: yEdge.get('id') as string,
    type: yEdge.get('type') as string,
    source: yEdge.get('source') as string,
    target: yEdge.get('target') as string,
    data: data as FlowEdgeData,
  };

  const sh = yEdge.get('sourceHandle');
  if (sh) edge.sourceHandle = sh as string;
  const th = yEdge.get('targetHandle');
  if (th) edge.targetHandle = th as string;
  const me = yEdge.get('markerEnd');
  if (me) edge.markerEnd = me as FlowEdge['markerEnd'];
  const ms = yEdge.get('markerStart');
  if (ms) edge.markerStart = ms as FlowEdge['markerStart'];
  const style = yEdge.get('style');
  if (style) edge.style = style as FlowEdge['style'];

  return edge;
}

// ---------------------------------------------------------------------------
// Throttled position updates during drag
// ---------------------------------------------------------------------------

const positionBuffer = new Map<string, { x: number; y: number }>();
let positionFlushTimer: ReturnType<typeof setTimeout> | null = null;

function flushPositionBuffer(doc: Y.Doc): void {
  if (positionBuffer.size === 0) return;
  const nodesMap = getNodesMap(doc);
  doc.transact(() => {
    for (const [id, pos] of positionBuffer) {
      const yNode = nodesMap.get(id);
      if (yNode) {
        const yPos = yNode.get('position') as Y.Map<number> | undefined;
        if (yPos) {
          yPos.set('x', pos.x);
          yPos.set('y', pos.y);
        }
      }
    }
  }, 'local');
  positionBuffer.clear();
}

// ---------------------------------------------------------------------------
// Diffing: Zustand → Yjs (only write what changed)
// ---------------------------------------------------------------------------

function syncNodesToYjs(
  current: FlowNode[],
  previous: FlowNode[],
  nodesMap: Y.Map<Y.Map<unknown>>,
  doc: Y.Doc,
): void {
  const currentById = new Map(current.map((n) => [n.id, n]));
  const previousById = new Map(previous.map((n) => [n.id, n]));

  // Additions
  for (const [id, node] of currentById) {
    if (!previousById.has(id)) {
      nodesMap.set(id, nodeToYMap(node, doc));
    }
  }

  // Deletions
  for (const [id] of previousById) {
    if (!currentById.has(id)) {
      nodesMap.delete(id);
    }
  }

  // Updates (reference equality — immer gives new references on change)
  for (const [id, node] of currentById) {
    const prev = previousById.get(id);
    if (prev && prev !== node) {
      const yNode = nodesMap.get(id);
      if (!yNode) continue;

      // Position changes (buffered for drag performance)
      if (prev.position !== node.position) {
        positionBuffer.set(id, { x: node.position.x, y: node.position.y });
        if (!positionFlushTimer) {
          positionFlushTimer = setTimeout(() => {
            positionFlushTimer = null;
            flushPositionBuffer(doc);
          }, POSITION_FLUSH_INTERVAL);
        }
      }

      // Data changes
      if (prev.data !== node.data) {
        const yData = yNode.get('data') as Y.Map<unknown>;
        if (yData) {
          const newData = node.data as Record<string, unknown>;
          const oldData = prev.data as Record<string, unknown>;
          for (const key of Object.keys(newData)) {
            if (newData[key] !== oldData[key]) {
              yData.set(key, JSON.parse(JSON.stringify(newData[key] ?? null)));
            }
          }
          // Handle deleted keys
          for (const key of Object.keys(oldData)) {
            if (!(key in newData)) {
              yData.delete(key);
            }
          }
        }
      }

      // Type changes
      if (prev.type !== node.type) {
        yNode.set('type', node.type);
      }
    }
  }
}

function syncEdgesToYjs(
  current: FlowEdge[],
  previous: FlowEdge[],
  edgesMap: Y.Map<Y.Map<unknown>>,
  doc: Y.Doc,
): void {
  const currentById = new Map(current.map((e) => [e.id, e]));
  const previousById = new Map(previous.map((e) => [e.id, e]));

  // Additions
  for (const [id, edge] of currentById) {
    if (!previousById.has(id)) {
      edgesMap.set(id, edgeToYMap(edge, doc));
    }
  }

  // Deletions
  for (const [id] of previousById) {
    if (!currentById.has(id)) {
      edgesMap.delete(id);
    }
  }

  // Updates
  for (const [id, edge] of currentById) {
    const prev = previousById.get(id);
    if (prev && prev !== edge) {
      const yEdge = edgesMap.get(id);
      if (!yEdge) continue;

      if (prev.data !== edge.data) {
        const yData = yEdge.get('data') as Y.Map<unknown>;
        if (yData) {
          const newData = (edge.data ?? {}) as Record<string, unknown>;
          const oldData = (prev.data ?? {}) as Record<string, unknown>;
          for (const key of Object.keys(newData)) {
            if (newData[key] !== oldData[key]) {
              yData.set(key, JSON.parse(JSON.stringify(newData[key] ?? null)));
            }
          }
          for (const key of Object.keys(oldData)) {
            if (!(key in newData)) {
              yData.delete(key);
            }
          }
        }
      }

      if (prev.type !== edge.type) yEdge.set('type', edge.type);
      if (prev.source !== edge.source) yEdge.set('source', edge.source);
      if (prev.target !== edge.target) yEdge.set('target', edge.target);
      if (prev.sourceHandle !== edge.sourceHandle) yEdge.set('sourceHandle', edge.sourceHandle);
      if (prev.targetHandle !== edge.targetHandle) yEdge.set('targetHandle', edge.targetHandle);
      if (prev.markerEnd !== edge.markerEnd) yEdge.set('markerEnd', edge.markerEnd ? JSON.parse(JSON.stringify(edge.markerEnd)) : null);
      if (prev.markerStart !== edge.markerStart) yEdge.set('markerStart', edge.markerStart ? JSON.parse(JSON.stringify(edge.markerStart)) : null);
    }
  }
}

// ---------------------------------------------------------------------------
// Apply Yjs → Zustand
// ---------------------------------------------------------------------------

function applyYjsNodesToZustand(nodesMap: Y.Map<Y.Map<unknown>>): void {
  const nodes: FlowNode[] = [];
  nodesMap.forEach((yNode) => {
    nodes.push(yMapToNode(yNode));
  });
  useFlowStore.getState().setNodes(nodes);
}

function applyYjsEdgesToZustand(edgesMap: Y.Map<Y.Map<unknown>>): void {
  const edges: FlowEdge[] = [];
  edgesMap.forEach((yEdge) => {
    edges.push(yMapToEdge(yEdge));
  });
  useFlowStore.getState().setEdges(edges);
}

// ---------------------------------------------------------------------------
// Seed the Y.Doc with current store state (first peer in the room)
// ---------------------------------------------------------------------------

export function seedDocFromStores(doc: Y.Doc): void {
  const { nodes, edges } = useFlowStore.getState();
  const nodesMap = getNodesMap(doc);
  const edgesMap = getEdgesMap(doc);

  doc.transact(() => {
    for (const node of nodes) {
      nodesMap.set(node.id, nodeToYMap(node, doc));
    }
    for (const edge of edges) {
      edgesMap.set(edge.id, edgeToYMap(edge, doc));
    }

    // Sync secondary stores as atomic JSON
    const swimlanesMap = getSwimlanesMap(doc);
    const swimState = useSwimlaneStore.getState();
    swimlanesMap.set('config', JSON.parse(JSON.stringify(swimState.config)));
    swimlanesMap.set('containerOffset', JSON.parse(JSON.stringify(swimState.containerOffset)));

    const legendsMap = getLegendsMap(doc);
    const legendState = useLegendStore.getState();
    legendsMap.set('nodeLegend', JSON.parse(JSON.stringify(legendState.nodeLegend)));
    legendsMap.set('swimlaneLegend', JSON.parse(JSON.stringify(legendState.swimlaneLegend)));

    const bannersMap = getBannersMap(doc);
    const bannerState = useBannerStore.getState();
    bannersMap.set('topBanner', JSON.parse(JSON.stringify(bannerState.topBanner)));
    bannersMap.set('bottomBanner', JSON.parse(JSON.stringify(bannerState.bottomBanner)));

    const layersMap = getLayersMap(doc);
    const layerState = useLayerStore.getState();
    layersMap.set('layers', JSON.parse(JSON.stringify(layerState.layers)));
    layersMap.set('activeLayerId', layerState.activeLayerId);

    const stylesMap = getStylesMap(doc);
    const styleState = useStyleStore.getState();
    stylesMap.set('activeStyleId', styleState.activeStyleId);
    stylesMap.set('activePaletteId', styleState.activePaletteId);
    stylesMap.set('darkMode', styleState.darkMode);
  }, 'local');
}

// ---------------------------------------------------------------------------
// Main binding function — call once when joining a room
// ---------------------------------------------------------------------------

export function bindStores(doc: Y.Doc): () => void {
  const nodesMap = getNodesMap(doc);
  const edgesMap = getEdgesMap(doc);
  const swimlanesMap = getSwimlanesMap(doc);
  const legendsMap = getLegendsMap(doc);
  const bannersMap = getBannersMap(doc);
  const layersMap = getLayersMap(doc);
  const stylesMap = getStylesMap(doc);

  const disposers: (() => void)[] = [];

  // Track previous state for diffing
  let prevNodes = useFlowStore.getState().nodes;
  let prevEdges = useFlowStore.getState().edges;

  // --- Direction 1: Local Zustand → Yjs ---

  const unsubFlow = useFlowStore.subscribe((state) => {
    if (_isRemoteUpdate) return;

    const { nodes, edges } = state;

    doc.transact(() => {
      if (nodes !== prevNodes) {
        syncNodesToYjs(nodes, prevNodes, nodesMap, doc);
        prevNodes = nodes;
      }
      if (edges !== prevEdges) {
        syncEdgesToYjs(edges, prevEdges, edgesMap, doc);
        prevEdges = edges;
      }
    }, 'local');
  });
  disposers.push(unsubFlow);

  const unsubSwimlane = useSwimlaneStore.subscribe((state, prevState) => {
    if (_isRemoteUpdate) return;
    if (state.config !== prevState.config) {
      swimlanesMap.set('config', JSON.parse(JSON.stringify(state.config)));
    }
    if (state.containerOffset !== prevState.containerOffset) {
      swimlanesMap.set('containerOffset', JSON.parse(JSON.stringify(state.containerOffset)));
    }
  });
  disposers.push(unsubSwimlane);

  const unsubLegend = useLegendStore.subscribe((state, prevState) => {
    if (_isRemoteUpdate) return;
    if (state.nodeLegend !== prevState.nodeLegend) {
      legendsMap.set('nodeLegend', JSON.parse(JSON.stringify(state.nodeLegend)));
    }
    if (state.swimlaneLegend !== prevState.swimlaneLegend) {
      legendsMap.set('swimlaneLegend', JSON.parse(JSON.stringify(state.swimlaneLegend)));
    }
  });
  disposers.push(unsubLegend);

  const unsubBanner = useBannerStore.subscribe((state, prevState) => {
    if (_isRemoteUpdate) return;
    if (state.topBanner !== prevState.topBanner) {
      bannersMap.set('topBanner', JSON.parse(JSON.stringify(state.topBanner)));
    }
    if (state.bottomBanner !== prevState.bottomBanner) {
      bannersMap.set('bottomBanner', JSON.parse(JSON.stringify(state.bottomBanner)));
    }
  });
  disposers.push(unsubBanner);

  const unsubLayer = useLayerStore.subscribe((state, prevState) => {
    if (_isRemoteUpdate) return;
    if (state.layers !== prevState.layers) {
      layersMap.set('layers', JSON.parse(JSON.stringify(state.layers)));
    }
    if (state.activeLayerId !== prevState.activeLayerId) {
      layersMap.set('activeLayerId', state.activeLayerId);
    }
  });
  disposers.push(unsubLayer);

  const unsubStyle = useStyleStore.subscribe((state, prevState) => {
    if (_isRemoteUpdate) return;
    if (state.activeStyleId !== prevState.activeStyleId) {
      stylesMap.set('activeStyleId', state.activeStyleId);
    }
    if (state.activePaletteId !== prevState.activePaletteId) {
      stylesMap.set('activePaletteId', state.activePaletteId);
    }
    if (state.darkMode !== prevState.darkMode) {
      stylesMap.set('darkMode', state.darkMode);
    }
  });
  disposers.push(unsubStyle);

  // --- Direction 2: Yjs → Local Zustand ---

  const nodesObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      applyYjsNodesToZustand(nodesMap);
      prevNodes = useFlowStore.getState().nodes;
    } finally {
      _isRemoteUpdate = false;
    }
  };
  nodesMap.observeDeep(nodesObserver);
  disposers.push(() => nodesMap.unobserveDeep(nodesObserver));

  const edgesObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      applyYjsEdgesToZustand(edgesMap);
      prevEdges = useFlowStore.getState().edges;
    } finally {
      _isRemoteUpdate = false;
    }
  };
  edgesMap.observeDeep(edgesObserver);
  disposers.push(() => edgesMap.unobserveDeep(edgesObserver));

  const swimlaneObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      const config = swimlanesMap.get('config');
      const offset = swimlanesMap.get('containerOffset');
      if (config) {
        useSwimlaneStore.setState({ config: JSON.parse(JSON.stringify(config)) });
      }
      if (offset) {
        useSwimlaneStore.setState({ containerOffset: JSON.parse(JSON.stringify(offset)) });
      }
    } finally {
      _isRemoteUpdate = false;
    }
  };
  swimlanesMap.observeDeep(swimlaneObserver);
  disposers.push(() => swimlanesMap.unobserveDeep(swimlaneObserver));

  const legendObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      const nodeLegend = legendsMap.get('nodeLegend');
      const swimlaneLegend = legendsMap.get('swimlaneLegend');
      if (nodeLegend) {
        useLegendStore.setState({ nodeLegend: JSON.parse(JSON.stringify(nodeLegend)) });
      }
      if (swimlaneLegend) {
        useLegendStore.setState({ swimlaneLegend: JSON.parse(JSON.stringify(swimlaneLegend)) });
      }
    } finally {
      _isRemoteUpdate = false;
    }
  };
  legendsMap.observeDeep(legendObserver);
  disposers.push(() => legendsMap.unobserveDeep(legendObserver));

  const bannerObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      const top = bannersMap.get('topBanner');
      const bottom = bannersMap.get('bottomBanner');
      if (top) useBannerStore.setState({ topBanner: JSON.parse(JSON.stringify(top)) });
      if (bottom) useBannerStore.setState({ bottomBanner: JSON.parse(JSON.stringify(bottom)) });
    } finally {
      _isRemoteUpdate = false;
    }
  };
  bannersMap.observeDeep(bannerObserver);
  disposers.push(() => bannersMap.unobserveDeep(bannerObserver));

  const layerObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      const layers = layersMap.get('layers');
      const activeId = layersMap.get('activeLayerId');
      if (layers) useLayerStore.setState({ layers: JSON.parse(JSON.stringify(layers)) });
      if (activeId) useLayerStore.setState({ activeLayerId: activeId as string });
    } finally {
      _isRemoteUpdate = false;
    }
  };
  layersMap.observeDeep(layerObserver);
  disposers.push(() => layersMap.unobserveDeep(layerObserver));

  const styleObserver = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;
    _isRemoteUpdate = true;
    try {
      const styleId = stylesMap.get('activeStyleId');
      const paletteId = stylesMap.get('activePaletteId');
      const darkMode = stylesMap.get('darkMode');
      if (styleId !== undefined) useStyleStore.setState({ activeStyleId: styleId as string | null });
      if (paletteId !== undefined) useStyleStore.setState({ activePaletteId: paletteId as string });
      if (darkMode !== undefined) useStyleStore.setState({ darkMode: darkMode as boolean });
    } finally {
      _isRemoteUpdate = false;
    }
  };
  stylesMap.observeDeep(styleObserver);
  disposers.push(() => stylesMap.unobserveDeep(styleObserver));

  // --- Cleanup ---
  return () => {
    // Flush any pending position updates
    if (positionFlushTimer) {
      clearTimeout(positionFlushTimer);
      positionFlushTimer = null;
      flushPositionBuffer(doc);
    }
    disposers.forEach((fn) => fn());
  };
}
