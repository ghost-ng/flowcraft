// ---------------------------------------------------------------------------
// AI Tool Definitions — 37 tools in 11 categories
// ---------------------------------------------------------------------------

import type { ToolDefinition } from '@/lib/ai/client';

// ---------------------------------------------------------------------------
// Shared enum constants
// ---------------------------------------------------------------------------

const SHAPE_ENUM = [
  'rectangle', 'roundedRectangle', 'diamond', 'circle', 'ellipse',
  'parallelogram', 'hexagon', 'triangle', 'star', 'cloud', 'arrow',
  'callout', 'document', 'predefinedProcess', 'manualInput', 'preparation',
  'data', 'database', 'internalStorage', 'display', 'blockArrow',
  'chevronArrow', 'doubleArrow', 'circularArrow', 'stickyNote', 'textbox',
];

const EDGE_TYPE_ENUM = ['smoothstep', 'bezier', 'straight', 'step'];

const DIAGRAM_STYLE_ENUM = [
  'cleanMinimal', 'corporateProfessional', 'blueprint', 'whiteboardSketch',
  'neonDark', 'pastelSoft', 'flatMaterial', 'monochromeInk', 'retroTerminal',
  'watercolor', 'glassMorphism', 'wireframe', 'militaryC2', 'infographicBold',
  'colorfulGradient', 'darkNeonGlow', 'notebook', 'gradientCards', 'cyberC2',
  'zincModern', 'softGradient', 'midnightLuxe', 'paperPrint', 'auroraBorealis',
  'neonGlass', 'osxAqua', 'solarizedDark', 'claudeAI', 'openAI',
];

const PALETTE_ENUM = [
  'ocean', 'berry', 'forest', 'sunset', 'grayscale', 'cyber', 'pastelDream',
  'earthTone', 'military', 'accessible', 'cyberC2', 'midnightAurora', 'roseGold',
  'nordicFrost', 'terracotta', 'lavenderFields', 'tropical', 'candyPop',
  'tokyoNight', 'coralReef', 'vintageSage',
];

// ---------------------------------------------------------------------------
// Category 1: Canvas Operations
// ---------------------------------------------------------------------------

const generate_diagram: ToolDefinition = {
  name: 'generate_diagram',
  description:
    'Generate a complete diagram from scratch. Returns a JSON object with nodes and edges arrays that will replace the current canvas content. Use this for "create a flowchart" or "make a diagram" requests. The diagram is imported via the standard Chart Hero JSON format.',
  inputSchema: {
    type: 'object',
    properties: {
      diagram: {
        type: 'object',
        description: 'Complete diagram in Chart Hero JSON format',
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                position: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                  },
                  required: ['x', 'y'],
                },
                data: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    shape: { type: 'string', enum: SHAPE_ENUM },
                    color: { type: 'string', description: 'Hex color (e.g. #3b82f6)' },
                    borderColor: { type: 'string' },
                    textColor: { type: 'string' },
                    fontSize: { type: 'number' },
                    icon: {
                      type: 'string',
                      description: "Lucide icon name (e.g. 'check', 'alert-triangle')",
                    },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    description: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['label', 'shape'],
                },
              },
              required: ['id', 'position', 'data'],
            },
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                source: { type: 'string' },
                target: { type: 'string' },
                type: { type: 'string', enum: EDGE_TYPE_ENUM },
                data: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    color: { type: 'string' },
                    animated: { type: 'boolean' },
                  },
                },
              },
              required: ['id', 'source', 'target'],
            },
          },
        },
        required: ['nodes', 'edges'],
      },
    },
    required: ['diagram'],
  },
};

const clear_canvas: ToolDefinition = {
  name: 'clear_canvas',
  description: 'Remove all nodes and edges from the canvas, starting fresh.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const auto_layout: ToolDefinition = {
  name: 'auto_layout',
  description:
    'Automatically arrange all nodes in the diagram using a hierarchical layout algorithm.',
  inputSchema: {
    type: 'object',
    properties: {
      direction: {
        type: 'string',
        enum: ['TB', 'LR', 'BT', 'RL'],
        description:
          'Layout direction: TB=top-to-bottom, LR=left-to-right, BT=bottom-to-top, RL=right-to-left. Default: TB',
      },
      spacing_x: {
        type: 'number',
        description: 'Horizontal spacing between nodes (default: 80)',
      },
      spacing_y: {
        type: 'number',
        description: 'Vertical spacing between nodes (default: 100)',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Category 2: Node Operations
// ---------------------------------------------------------------------------

const add_node: ToolDefinition = {
  name: 'add_node',
  description: 'Add a single node to the diagram.',
  inputSchema: {
    type: 'object',
    properties: {
      label: { type: 'string', description: 'Text displayed on the node' },
      shape: {
        type: 'string',
        enum: SHAPE_ENUM,
        description: 'Shape type. Default: rectangle',
      },
      x: { type: 'number', description: 'X position on canvas. Default: center of viewport' },
      y: { type: 'number', description: 'Y position on canvas. Default: center of viewport' },
      color: { type: 'string', description: 'Fill color (hex). Example: #3b82f6' },
      borderColor: { type: 'string', description: 'Border color (hex)' },
      textColor: { type: 'string', description: 'Label text color (hex)' },
      width: { type: 'number', description: 'Width in pixels' },
      height: { type: 'number', description: 'Height in pixels' },
      icon: {
        type: 'string',
        description: "Lucide icon name (e.g. 'check', 'user', 'database')",
      },
      fontSize: { type: 'number', description: 'Font size in pixels' },
      description: { type: 'string', description: 'Description text for the node' },
      notes: { type: 'string', description: 'Notes/annotations' },
    },
    required: ['label'],
  },
};

const update_node: ToolDefinition = {
  name: 'update_node',
  description: 'Update properties of an existing node. Only specified properties are changed.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: { type: 'string', description: 'ID of the node to update' },
      label: { type: 'string' },
      shape: { type: 'string', enum: SHAPE_ENUM },
      color: { type: 'string' },
      borderColor: { type: 'string' },
      textColor: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
      icon: { type: 'string' },
      fontSize: { type: 'number' },
      fontWeight: { type: 'number', enum: [300, 400, 500, 600, 700] },
      opacity: { type: 'number', minimum: 0, maximum: 1 },
      borderStyle: { type: 'string', enum: ['solid', 'dashed', 'dotted'] },
      borderWidth: { type: 'number' },
      borderRadius: { type: 'number' },
      description: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['node_id'],
  },
};

const remove_nodes: ToolDefinition = {
  name: 'remove_nodes',
  description:
    'Remove one or more nodes from the diagram. Connected edges are automatically removed.',
  inputSchema: {
    type: 'object',
    properties: {
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of node IDs to remove',
      },
    },
    required: ['node_ids'],
  },
};

const list_nodes: ToolDefinition = {
  name: 'list_nodes',
  description:
    'Get a list of all nodes currently on the diagram with their properties. Use this to understand the current diagram state before making changes.',
  inputSchema: {
    type: 'object',
    properties: {
      include_positions: {
        type: 'boolean',
        description: 'Include x,y positions (default: true)',
      },
      include_styles: {
        type: 'boolean',
        description: 'Include color/font styling (default: false)',
      },
    },
  },
};

const move_node: ToolDefinition = {
  name: 'move_node',
  description: 'Move a node to a new position on the canvas.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: { type: 'string' },
      x: { type: 'number', description: 'New X position' },
      y: { type: 'number', description: 'New Y position' },
    },
    required: ['node_id', 'x', 'y'],
  },
};

const resize_node: ToolDefinition = {
  name: 'resize_node',
  description: 'Resize a node to specific dimensions.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
    },
    required: ['node_id', 'width', 'height'],
  },
};

const duplicate_node: ToolDefinition = {
  name: 'duplicate_node',
  description: 'Create a copy of an existing node with an offset position.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'ID of the node to duplicate',
      },
      offset_x: {
        type: 'number',
        description: 'X offset from original (default: 50)',
      },
      offset_y: {
        type: 'number',
        description: 'Y offset from original (default: 50)',
      },
    },
    required: ['node_id'],
  },
};

// ---------------------------------------------------------------------------
// Category 3: Edge Operations
// ---------------------------------------------------------------------------

const add_edge: ToolDefinition = {
  name: 'add_edge',
  description: 'Add a connector/edge between two nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'ID of the source node' },
      target: { type: 'string', description: 'ID of the target node' },
      label: { type: 'string', description: 'Label text on the connector' },
      type: {
        type: 'string',
        enum: EDGE_TYPE_ENUM,
        description: 'Connector routing style. Default: smoothstep',
      },
      color: { type: 'string', description: 'Connector color (hex)' },
      animated: { type: 'boolean', description: 'Show flowing animation' },
      thickness: { type: 'number', description: 'Line thickness in pixels' },
      strokeDasharray: {
        type: 'string',
        description: 'SVG dash pattern for dashed/dotted lines. Examples: "6 4" (dashed), "2 4" (dotted), "10 4 2 4" (dash-dot). Omit for solid lines.',
      },
      sourceHandle: {
        type: 'string',
        enum: ['top', 'bottom', 'left', 'right'],
        description: 'Which handle on the source node the edge exits from. ALWAYS set this based on node positions.',
      },
      targetHandle: {
        type: 'string',
        enum: ['top', 'bottom', 'left', 'right'],
        description: 'Which handle on the target node the edge enters. ALWAYS set this based on node positions.',
      },
    },
    required: ['source', 'target'],
  },
};

const update_edge: ToolDefinition = {
  name: 'update_edge',
  description: 'Update properties of an existing edge/connector.',
  inputSchema: {
    type: 'object',
    properties: {
      edge_id: { type: 'string' },
      label: { type: 'string' },
      color: { type: 'string' },
      thickness: { type: 'number' },
      animated: { type: 'boolean' },
      opacity: { type: 'number', minimum: 0, maximum: 1 },
      type: { type: 'string', enum: EDGE_TYPE_ENUM },
      strokeDasharray: {
        type: 'string',
        description: 'SVG dash pattern. "6 4" (dashed), "2 4" (dotted), "10 4 2 4" (dash-dot). Empty string for solid.',
      },
    },
    required: ['edge_id'],
  },
};

const remove_edges: ToolDefinition = {
  name: 'remove_edges',
  description: 'Remove one or more edges/connectors from the diagram.',
  inputSchema: {
    type: 'object',
    properties: {
      edge_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of edge IDs to remove',
      },
    },
    required: ['edge_ids'],
  },
};

const list_edges: ToolDefinition = {
  name: 'list_edges',
  description: 'Get a list of all edges/connectors in the diagram.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

// ---------------------------------------------------------------------------
// Category 4: Selection Operations
// ---------------------------------------------------------------------------

const select_nodes: ToolDefinition = {
  name: 'select_nodes',
  description: 'Select one or more nodes on the canvas. Replaces current selection.',
  inputSchema: {
    type: 'object',
    properties: {
      node_ids: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['node_ids'],
  },
};

const select_edges: ToolDefinition = {
  name: 'select_edges',
  description: 'Select one or more edges on the canvas.',
  inputSchema: {
    type: 'object',
    properties: {
      edge_ids: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['edge_ids'],
  },
};

const clear_selection: ToolDefinition = {
  name: 'clear_selection',
  description: 'Deselect all nodes and edges.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

const get_selection: ToolDefinition = {
  name: 'get_selection',
  description: 'Get the currently selected nodes and edges.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

// ---------------------------------------------------------------------------
// Category 5: Style Operations
// ---------------------------------------------------------------------------

const set_diagram_style: ToolDefinition = {
  name: 'set_diagram_style',
  description: 'Apply a visual theme to the entire diagram.',
  inputSchema: {
    type: 'object',
    properties: {
      style_id: {
        type: 'string',
        enum: DIAGRAM_STYLE_ENUM,
        description: 'Diagram style theme',
      },
    },
    required: ['style_id'],
  },
};

const set_color_palette: ToolDefinition = {
  name: 'set_color_palette',
  description: 'Set the active color palette used for node coloring.',
  inputSchema: {
    type: 'object',
    properties: {
      palette_id: {
        type: 'string',
        enum: PALETTE_ENUM,
        description: 'Color palette name',
      },
    },
    required: ['palette_id'],
  },
};

const set_node_color: ToolDefinition = {
  name: 'set_node_color',
  description: 'Set the fill color of one or more nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Node IDs to color',
      },
      color: { type: 'string', description: 'Hex color (e.g. #3b82f6)' },
    },
    required: ['node_ids', 'color'],
  },
};

const toggle_dark_mode: ToolDefinition = {
  name: 'toggle_dark_mode',
  description: 'Toggle dark mode on or off.',
  inputSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Set to true for dark mode, false for light mode. Omit to toggle.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Category 6: Swimlane Operations
// ---------------------------------------------------------------------------

const add_swimlane: ToolDefinition = {
  name: 'add_swimlane',
  description: 'Add a swimlane to the diagram for grouping nodes by category.',
  inputSchema: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        description: 'Lane header label (e.g. department name)',
      },
      color: { type: 'string', description: 'Lane background color (hex)' },
      orientation: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        description: 'Lane orientation. Default: horizontal',
      },
    },
    required: ['label'],
  },
};

const update_swimlane: ToolDefinition = {
  name: 'update_swimlane',
  description: 'Update properties of an existing swimlane.',
  inputSchema: {
    type: 'object',
    properties: {
      lane_id: { type: 'string' },
      label: { type: 'string' },
      color: { type: 'string' },
      orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
    },
    required: ['lane_id'],
  },
};

const remove_swimlane: ToolDefinition = {
  name: 'remove_swimlane',
  description: 'Remove a swimlane from the diagram.',
  inputSchema: {
    type: 'object',
    properties: {
      lane_id: { type: 'string' },
      orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
    },
    required: ['lane_id', 'orientation'],
  },
};

const assign_node_to_lane: ToolDefinition = {
  name: 'assign_node_to_lane',
  description: 'Assign a node to a swimlane.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: { type: 'string' },
      lane_id: { type: 'string' },
    },
    required: ['node_id', 'lane_id'],
  },
};

// ---------------------------------------------------------------------------
// Category 7: Layout Operations
// ---------------------------------------------------------------------------

const align_nodes: ToolDefinition = {
  name: 'align_nodes',
  description: 'Align selected or specified nodes along an axis.',
  inputSchema: {
    type: 'object',
    properties: {
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Node IDs to align. If empty, uses current selection.',
      },
      alignment: {
        type: 'string',
        enum: ['left', 'center-h', 'right', 'top', 'center-v', 'bottom'],
        description: 'Alignment direction',
      },
    },
    required: ['alignment'],
  },
};

const distribute_nodes: ToolDefinition = {
  name: 'distribute_nodes',
  description: 'Distribute nodes evenly along an axis.',
  inputSchema: {
    type: 'object',
    properties: {
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Node IDs to distribute. If empty, uses current selection.',
      },
      direction: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        description: 'Distribution axis',
      },
    },
    required: ['direction'],
  },
};

// ---------------------------------------------------------------------------
// Category 8: Status & Dependencies
// ---------------------------------------------------------------------------

const set_status_puck: ToolDefinition = {
  name: 'set_status_puck',
  description: 'Add or update a status indicator badge on a node.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: { type: 'string' },
      status: {
        type: 'string',
        enum: ['none', 'not-started', 'in-progress', 'completed', 'blocked', 'review'],
        description: 'Status type',
      },
      color: {
        type: 'string',
        description: 'Puck color (hex). Auto-set based on status if omitted.',
      },
      position: {
        type: 'string',
        enum: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
        description: 'Position on the node. Default: top-right',
      },
      icon: { type: 'string', description: 'Optional lucide icon name' },
    },
    required: ['node_id', 'status'],
  },
};

const add_dependency: ToolDefinition = {
  name: 'add_dependency',
  description: 'Create a dependency relationship between two nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      source_id: {
        type: 'string',
        description: 'ID of the upstream/dependency node',
      },
      target_id: {
        type: 'string',
        description: 'ID of the downstream/dependent node',
      },
      type: {
        type: 'string',
        enum: ['depends-on', 'blocks', 'related'],
        description: 'Dependency type. Default: depends-on',
      },
    },
    required: ['source_id', 'target_id'],
  },
};

// ---------------------------------------------------------------------------
// Category 9: Legend
// ---------------------------------------------------------------------------

const generate_legend: ToolDefinition = {
  name: 'generate_legend',
  description:
    'Auto-generate a legend overlay from the current diagram. Scans node fill colors, edge colors, and status pucks to build legend items. The legend renders as a floating overlay on the canvas — NOT as textbox nodes. Always use this instead of creating manual legend nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Legend title. Default: "Legend"',
      },
      position: {
        type: 'object',
        description: 'Position of the legend on the canvas',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
      },
    },
  },
};

const configure_legend: ToolDefinition = {
  name: 'configure_legend',
  description:
    'Update legend overlay settings (title, visibility, position, styling). Use generate_legend first to create items, then configure_legend to adjust appearance.',
  inputSchema: {
    type: 'object',
    properties: {
      visible: { type: 'boolean', description: 'Show or hide the legend' },
      title: { type: 'string', description: 'Legend title text' },
      position: {
        type: 'object',
        description: 'Legend position on canvas',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
      },
      bgColor: { type: 'string', description: 'Background color (hex)' },
      borderColor: { type: 'string', description: 'Border color (hex)' },
      fontSize: { type: 'number', description: 'Font size in px' },
      opacity: { type: 'number', minimum: 0, maximum: 1 },
      width: { type: 'number', description: 'Legend width in px' },
    },
  },
};

// ---------------------------------------------------------------------------
// Category 10: Export
// ---------------------------------------------------------------------------

const export_diagram: ToolDefinition = {
  name: 'export_diagram',
  description: 'Export the current diagram in a specified format.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['png', 'svg', 'pdf', 'pptx', 'json'],
        description: 'Export format',
      },
    },
    required: ['format'],
  },
};

// ---------------------------------------------------------------------------
// Category 11: Research
// ---------------------------------------------------------------------------

const web_search: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for information on a topic. Use this when you need current data, technical details, or domain-specific knowledge to create an accurate diagram. Searches DuckDuckGo and Wikipedia for comprehensive results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (e.g., "TCP three-way handshake", "AWS Well-Architected Framework pillars")',
      },
    },
    required: ['query'],
  },
};

// ---------------------------------------------------------------------------
// Complete tool registry
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Canvas
  generate_diagram,
  clear_canvas,
  auto_layout,
  // Nodes
  add_node,
  update_node,
  remove_nodes,
  list_nodes,
  move_node,
  resize_node,
  duplicate_node,
  // Edges
  add_edge,
  update_edge,
  remove_edges,
  list_edges,
  // Selection
  select_nodes,
  select_edges,
  clear_selection,
  get_selection,
  // Style
  set_diagram_style,
  set_color_palette,
  set_node_color,
  toggle_dark_mode,
  // Swimlanes
  add_swimlane,
  update_swimlane,
  remove_swimlane,
  assign_node_to_lane,
  // Layout
  align_nodes,
  distribute_nodes,
  // Status / Dependencies
  set_status_puck,
  add_dependency,
  // Legend
  generate_legend,
  configure_legend,
  // Export
  export_diagram,
  // Research
  web_search,
];

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

const toolMap = new Map(TOOL_DEFINITIONS.map((t) => [t.name, t]));

/** Look up a tool definition by name. */
export function getToolByName(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}
