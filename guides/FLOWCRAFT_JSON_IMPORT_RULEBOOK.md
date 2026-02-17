# FlowCraft JSON Import Rulebook

> **Purpose:** This document is a complete specification for AI models to generate valid FlowCraft JSON files that can be imported and auto-build diagrams.

## 1. File Structure

A FlowCraft JSON file is a single object with these top-level keys:

```json
{
  "version": "1.0",
  "nodes": [ ... ],
  "edges": [ ... ],
  "viewport": { ... },
  "styles": { ... },
  "swimlanes": { ... },
  "layers": [ ... ],
  "metadata": { ... }
}
```

| Key | Required | Description |
|-----|----------|-------------|
| `version` | No | Schema version string (currently `"1.0"`) |
| `nodes` | **Yes** | Array of node objects (the blocks/shapes on the canvas) |
| `edges` | No | Array of edge objects (connectors between nodes) |
| `viewport` | No | Camera position `{ x, y, zoom }` |
| `styles` | No | Visual theme settings |
| `swimlanes` | No | Swimlane configuration |
| `layers` | No | Layer management data |
| `metadata` | No | Informational only (node/edge counts) |

---

## 2. Nodes

Each node represents a shape on the canvas.

### 2.1 Required Node Fields

```json
{
  "id": "node_1",
  "position": { "x": 100, "y": 200 },
  "data": {
    "label": "Start Process",
    "shape": "rectangle"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes* | Unique node identifier. Auto-generated if missing. |
| `position` | `{ x: number, y: number }` | Yes | Position in canvas coordinates (pixels). `(0,0)` is top-left. |
| `data` | object | Yes | Node data payload (see below) |
| `type` | string | No | Node renderer type. Use `"shapeNode"` (default) or `"groupNode"` |
| `parentId` | string | No | ID of parent group node (for grouped nodes) |
| `extent` | string | No | Set to `"parent"` when node is inside a group |

*If `id` is omitted, one is auto-generated. Duplicate IDs are automatically renamed.

### 2.2 Node Data (`data` object)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | `"Node N"` | Display text on the shape |
| `shape` | string | `"rectangle"` | Shape type (see valid shapes below) |
| `description` | string | — | Optional description/notes |
| `color` | string (hex) | Shape default | Fill/background color. Example: `"#3b82f6"` |
| `borderColor` | string (hex) | Darkened fill | Border/outline color |
| `textColor` | string (hex) | `"#ffffff"` | Label text color |
| `fontSize` | number | `14` | Font size in pixels |
| `fontWeight` | number | `500` | Font weight (100-900) |
| `fontFamily` | string | `"'Inter', sans-serif"` | CSS font-family |
| `width` | number | Shape default | Width in pixels |
| `height` | number | Shape default | Height in pixels |
| `opacity` | number | `1` | Opacity (0-1) |
| `borderStyle` | string | `"solid"` | `"solid"`, `"dashed"`, or `"dotted"` |
| `borderWidth` | number | `2` | Border thickness in pixels |
| `borderRadius` | number | Shape default | Corner radius override in pixels |
| `icon` | string | — | Lucide icon name (e.g. `"Check"`, `"AlertTriangle"`, `"Database"`) |
| `iconColor` | string (hex) | text color | Icon color |
| `iconSize` | number | font size + 2 | Icon size in pixels |
| `iconPosition` | string | `"left"` | `"left"` or `"right"` relative to label |
| `iconBgColor` | string (hex) | — | Background color behind the icon |
| `iconBorderColor` | string (hex) | — | Border color around the icon wrapper |
| `iconBorderWidth` | number | `0` | Border width around the icon wrapper |
| `iconOnly` | boolean | `false` | If `true`, renders only the icon with no shape background |
| `groupId` | string | — | ID of the parent group node |
| `linkGroupId` | string | — | Logical group ID (nodes in the same link group move together) |
| `layerId` | string | — | Layer ID for z-ordering |
| `swimlaneId` | string | — | Swimlane ID the node belongs to |
| `statusIndicators` | array | — | Array of status pucks (see Section 4) |
| `dependsOn` | string[] | — | Array of node IDs this node depends on |
| `blockedBy` | string[] | — | Array of node IDs that block this node |

### 2.3 Valid Shapes

**Standard shapes:**
| Shape ID | Description | Default Size (w×h) |
|----------|-------------|-------------------|
| `rectangle` | Standard rectangle | 160×60 |
| `roundedRectangle` | Rectangle with rounded corners | 160×60 |
| `diamond` | Decision/conditional diamond | 100×100 |
| `circle` | Circle | 100×100 |
| `ellipse` | Ellipse (alias for circle) | 100×100 |
| `parallelogram` | Input/output parallelogram | 160×60 |
| `hexagon` | Hexagonal shape | 160×60 |
| `triangle` | Triangle | 160×60 |
| `star` | 5-point star | 160×60 |
| `cloud` | Cloud shape | 160×60 |
| `document` | Document with wavy bottom | 160×60 |
| `stickyNote` | Sticky note with folded corner | 160×60 |

**Flowchart-specific shapes:**
| Shape ID | Description | Default Size |
|----------|-------------|-------------|
| `predefinedProcess` | Process with double side lines | 160×60 |
| `manualInput` | Manual input (skewed top) | 160×60 |
| `preparation` | Preparation hexagon | 160×60 |
| `data` | Data I/O parallelogram | 160×60 |
| `database` | Database cylinder | 160×60 |
| `internalStorage` | Internal storage | 160×60 |
| `display` | Display shape | 160×60 |
| `callout` | Callout bubble | 160×60 |

**Arrow shapes:**
| Shape ID | Description | Default Size |
|----------|-------------|-------------|
| `blockArrow` | Block arrow pointing right | 160×80 |
| `chevronArrow` | Chevron/pentagon arrow | 160×80 |
| `doubleArrow` | Bidirectional arrow | 160×80 |
| `circularArrow` | Circular/recycling arrow | 100×100 |

**Container:**
| Shape ID | Description | Default Size |
|----------|-------------|-------------|
| `group` | Group container (use `type: "groupNode"`) | 300×200 |

### 2.4 Default Shape Colors

If `color` is omitted, the shape type determines the fill:

| Shape | Default Color |
|-------|--------------|
| `rectangle`, `roundedRectangle` | `#3b82f6` (blue) |
| `diamond` | `#f59e0b` (amber) |
| `circle` | `#10b981` (green) |
| `parallelogram` | `#8b5cf6` (purple) |
| `hexagon` | `#ef4444` (red) |
| `document` | `#ec4899` (pink) |
| `cloud` | `#6366f1` (indigo) |
| `stickyNote` | `#fbbf24` (yellow) |
| `blockArrow` | `#3b82f6` (blue) |
| `chevronArrow` | `#8b5cf6` (purple) |
| `doubleArrow` | `#f59e0b` (amber) |
| `circularArrow` | `#10b981` (green) |

---

## 3. Edges (Connectors)

Each edge connects two nodes.

```json
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "type": "smoothstep",
  "sourceHandle": "bottom",
  "targetHandle": "top",
  "data": {
    "label": "Yes",
    "color": "#10b981"
  }
}
```

### 3.1 Edge Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes* | Unique edge identifier |
| `source` | string | **Yes** | ID of the source node |
| `target` | string | **Yes** | ID of the target node |
| `type` | string | `"smoothstep"` | Edge routing type (see below) |
| `sourceHandle` | string | — | Source connection point: `"top"`, `"bottom"`, `"left"`, `"right"` |
| `targetHandle` | string | — | Target connection point: `"top"`, `"bottom"`, `"left"`, `"right"` |
| `data` | object | — | Edge data payload |

### 3.2 Valid Edge Types

| Type | Description |
|------|-------------|
| `default` | Default bezier curve |
| `straight` | Straight line |
| `step` | Right-angle steps |
| `smoothstep` | Smooth right-angle curves (recommended default) |
| `bezier` | Smooth bezier curve |
| `dependency` | Styled dependency connector |
| `animated` | Animated dashed line |

### 3.3 Edge Data

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Text label shown on the edge |
| `color` | string (hex) | `"#94a3b8"` | Edge stroke color |
| `thickness` | number | `1` | Stroke width in pixels |
| `animated` | boolean | `false` | Whether to animate the edge |
| `opacity` | number | `1` | Edge opacity (0-1) |
| `labelColor` | string (hex) | — | Color of the label text |
| `dependencyType` | string | — | `"depends-on"`, `"blocks"`, or `"related"` |

---

## 4. Status Pucks (Indicators)

Nodes can have status indicator badges. Set via `data.statusIndicators` array.

```json
{
  "statusIndicators": [
    {
      "id": "puck_1",
      "status": "in-progress",
      "position": "top-right",
      "color": "#3b82f6",
      "size": 12
    }
  ]
}
```

### 4.1 StatusIndicator Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Auto-generated | Unique puck identifier |
| `status` | string | `"none"` | Status value (see below) |
| `color` | string (hex) | Status default | Override badge color |
| `size` | number | `12` | Badge diameter in pixels (6-40) |
| `position` | string | `"top-right"` | Corner placement |
| `borderColor` | string (hex) | `"#ffffff"` | Badge border color |
| `borderWidth` | number | `2` | Badge border width |
| `borderStyle` | string | `"solid"` | `"solid"`, `"dashed"`, `"dotted"`, `"none"` |
| `icon` | string | — | Lucide icon name inside the puck |

### 4.2 Status Values and Default Colors

| Status | Default Color | Description |
|--------|--------------|-------------|
| `none` | — | No indicator (hidden) |
| `not-started` | `#94a3b8` (gray) | Work not started |
| `in-progress` | `#3b82f6` (blue) | Currently in progress |
| `completed` | `#10b981` (green) | Completed |
| `blocked` | `#ef4444` (red) | Blocked |
| `review` | `#f59e0b` (amber) | Under review |

### 4.3 Position Values

| Position | Corner |
|----------|--------|
| `top-right` | Upper-right corner |
| `top-left` | Upper-left corner |
| `bottom-right` | Lower-right corner |
| `bottom-left` | Lower-left corner |

---

## 5. Viewport

Controls the initial camera position.

```json
{
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `x` | number | `0` | Horizontal pan offset |
| `y` | number | `0` | Vertical pan offset |
| `zoom` | number | `1` | Zoom level (0.1 = zoomed out, 2 = zoomed in) |

---

## 6. Styles

Apply a visual theme to the entire diagram.

```json
{
  "styles": {
    "activeStyleId": "cleanMinimal",
    "activePaletteId": "ocean",
    "darkMode": false
  }
}
```

### 6.1 Available Style IDs

| Style ID | Description |
|----------|-------------|
| `cleanMinimal` | Clean, minimal design (default) |
| `corporateProfessional` | Professional corporate look |
| `blueprint` | Technical blueprint style |
| `whiteboardSketch` | Hand-drawn whiteboard feel |
| `neonDark` | Neon colors on dark background |
| `pastelSoft` | Soft pastel colors |
| `flatMaterial` | Material Design flat style |
| `monochromeInk` | Black and white ink style |
| `retroTerminal` | Retro green-on-black terminal |
| `watercolor` | Watercolor painting effect |
| `glassMorphism` | Frosted glass effect |
| `wireframe` | Minimal wireframe style |
| `militaryC2` | Military command & control |
| `infographicBold` | Bold infographic style |
| `colorfulGradient` | Colorful gradient fills |
| `darkNeonGlow` | Dark theme with neon glow |
| `notebook` | Lined notebook paper style |
| `gradientCards` | Gradient card design |

### 6.2 Available Palette IDs

Color palettes control the colors assigned to nodes via number keys (1-9).

| Palette ID | Description |
|-----------|-------------|
| `ocean` | Blue/teal ocean tones (default) |
| `berry` | Purple/pink berry tones |
| `forest` | Green/brown earth tones |
| `sunset` | Orange/red warm tones |
| `grayscale` | Gray shades only |
| `cyber` | Neon/cyberpunk colors |
| `pastelDream` | Soft pastel colors |
| `earthTone` | Warm earth/terracotta |
| `military` | Olive/khaki/navy |
| `accessible` | High-contrast accessible colors |

---

## 7. Swimlanes

Organize nodes into horizontal and/or vertical lanes.

```json
{
  "swimlanes": {
    "orientation": "horizontal",
    "containerTitle": "Process Phases",
    "horizontal": [
      {
        "id": "lane_design",
        "label": "Design",
        "color": "#dbeafe",
        "size": 250,
        "order": 0,
        "collapsed": false
      },
      {
        "id": "lane_develop",
        "label": "Development",
        "color": "#dcfce7",
        "size": 300,
        "order": 1,
        "collapsed": false
      }
    ],
    "vertical": []
  }
}
```

### 7.1 Swimlane Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `orientation` | string | `"horizontal"` | `"horizontal"`, `"vertical"`, or `"both"` |
| `containerTitle` | string | `""` | Title displayed above the swimlane container |
| `horizontal` | array | `[]` | Array of horizontal lane objects |
| `vertical` | array | `[]` | Array of vertical lane objects |

### 7.2 Lane Object

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Auto-generated | Unique lane identifier |
| `label` | string | `"Lane"` | Display label |
| `color` | string (hex) | `"#e2e8f0"` | Lane background color |
| `size` | number | `200` | Lane width (vertical) or height (horizontal) in pixels |
| `order` | number | `0` | Sort order (lower = first) |
| `collapsed` | boolean | `false` | Whether the lane is collapsed |

To assign a node to a swimlane, set `data.swimlaneId` on the node to match a lane's `id`.

---

## 8. Layers

Z-ordering layers for organizing nodes by visibility and depth.

```json
{
  "layers": [
    {
      "id": "default",
      "name": "Default Layer",
      "visible": true,
      "locked": false,
      "opacity": 1,
      "color": "#6366f1",
      "order": 0
    },
    {
      "id": "layer_annotations",
      "name": "Annotations",
      "visible": true,
      "locked": false,
      "opacity": 0.7,
      "color": "#f59e0b",
      "order": 1
    }
  ]
}
```

### 8.1 Layer Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | Required | Unique layer identifier. `"default"` always exists. |
| `name` | string | `"Layer"` | Display name |
| `visible` | boolean | `true` | Whether nodes on this layer are visible |
| `locked` | boolean | `false` | Whether nodes on this layer can be moved |
| `opacity` | number | `1` | Layer opacity (0-1) |
| `color` | string (hex) | `"#6366f1"` | Layer color indicator in UI |
| `order` | number | `0` | Sort order |

To assign a node to a layer, set `data.layerId` on the node to match a layer's `id`.

---

## 9. Icons

FlowCraft uses [Lucide icons](https://lucide.dev/icons/). When specifying an icon name, use the **PascalCase** component name from lucide-react:

**Common examples:**
| Icon Name | Visual |
|-----------|--------|
| `Check` | Checkmark |
| `X` | X/close |
| `AlertTriangle` | Warning triangle |
| `Database` | Database cylinder |
| `Server` | Server rack |
| `Cloud` | Cloud |
| `User` | Person silhouette |
| `Settings` | Gear |
| `Lock` | Padlock |
| `Unlock` | Open padlock |
| `ArrowRight` | Right arrow |
| `ArrowDown` | Down arrow |
| `FileText` | Document with text |
| `FolderOpen` | Open folder |
| `Globe` | Globe/world |
| `Mail` | Email envelope |
| `Phone` | Telephone |
| `Search` | Magnifying glass |
| `Star` | Star |
| `Heart` | Heart |
| `Zap` | Lightning bolt |
| `Shield` | Shield |
| `Code` | Code brackets |
| `Terminal` | Terminal window |
| `Cpu` | CPU chip |
| `Wifi` | WiFi signal |
| `Clock` | Clock face |
| `Calendar` | Calendar |
| `BarChart3` | Bar chart |
| `PieChart` | Pie chart |
| `GitBranch` | Git branch |
| `Workflow` | Workflow diagram |

The full icon list is at https://lucide.dev/icons/

---

## 10. Layout Guidelines

### 10.1 Coordinate System
- `(0, 0)` is the top-left of the canvas
- X increases to the right
- Y increases downward
- Nodes should be spaced at least 40px apart (typically 80-150px)

### 10.2 Recommended Spacing

For a top-to-bottom flow:
- **Horizontal spacing:** 200px between side-by-side nodes
- **Vertical spacing:** 100px between sequential nodes
- **Group padding:** 20-30px inside group containers

For a left-to-right flow:
- **Horizontal spacing:** 250px between sequential nodes
- **Vertical spacing:** 120px between parallel nodes

### 10.3 Connection Points

Each node has 4 connection handles:
- `"top"` — center top
- `"bottom"` — center bottom
- `"left"` — center left
- `"right"` — center right

For top-to-bottom flows, connect `"bottom"` → `"top"`.
For left-to-right flows, connect `"right"` → `"left"`.

---

## 11. Complete Examples

### 11.1 Simple Flowchart

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "start",
      "position": { "x": 300, "y": 50 },
      "data": {
        "label": "Start",
        "shape": "roundedRectangle",
        "color": "#10b981"
      }
    },
    {
      "id": "process",
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Process Data",
        "shape": "rectangle",
        "color": "#3b82f6"
      }
    },
    {
      "id": "decision",
      "position": { "x": 330, "y": 350 },
      "data": {
        "label": "Valid?",
        "shape": "diamond",
        "color": "#f59e0b",
        "width": 100,
        "height": 100
      }
    },
    {
      "id": "success",
      "position": { "x": 300, "y": 520 },
      "data": {
        "label": "Complete",
        "shape": "roundedRectangle",
        "color": "#10b981",
        "statusIndicators": [
          { "status": "completed", "position": "top-right" }
        ]
      }
    },
    {
      "id": "error",
      "position": { "x": 550, "y": 350 },
      "data": {
        "label": "Handle Error",
        "shape": "rectangle",
        "color": "#ef4444",
        "icon": "AlertTriangle"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "process" },
    { "id": "e2", "source": "process", "target": "decision" },
    { "id": "e3", "source": "decision", "target": "success", "data": { "label": "Yes", "color": "#10b981" } },
    { "id": "e4", "source": "decision", "target": "error", "sourceHandle": "right", "targetHandle": "left", "data": { "label": "No", "color": "#ef4444" } },
    { "id": "e5", "source": "error", "target": "process", "sourceHandle": "top", "targetHandle": "right", "data": { "label": "Retry" } }
  ]
}
```

### 11.2 System Architecture Diagram

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "client",
      "position": { "x": 300, "y": 50 },
      "data": {
        "label": "Web Client",
        "shape": "rectangle",
        "color": "#3b82f6",
        "icon": "Globe",
        "width": 180
      }
    },
    {
      "id": "lb",
      "position": { "x": 310, "y": 200 },
      "data": {
        "label": "Load Balancer",
        "shape": "hexagon",
        "color": "#8b5cf6",
        "width": 160,
        "height": 80
      }
    },
    {
      "id": "api1",
      "position": { "x": 100, "y": 380 },
      "data": {
        "label": "API Server 1",
        "shape": "rectangle",
        "color": "#10b981",
        "icon": "Server",
        "statusIndicators": [
          { "status": "completed", "position": "top-right", "size": 10 }
        ]
      }
    },
    {
      "id": "api2",
      "position": { "x": 500, "y": 380 },
      "data": {
        "label": "API Server 2",
        "shape": "rectangle",
        "color": "#10b981",
        "icon": "Server",
        "statusIndicators": [
          { "status": "completed", "position": "top-right", "size": 10 }
        ]
      }
    },
    {
      "id": "db",
      "position": { "x": 250, "y": 560 },
      "data": {
        "label": "PostgreSQL",
        "shape": "database",
        "color": "#6366f1",
        "icon": "Database",
        "width": 180
      }
    },
    {
      "id": "cache",
      "position": { "x": 500, "y": 560 },
      "data": {
        "label": "Redis Cache",
        "shape": "cloud",
        "color": "#ef4444",
        "icon": "Zap"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "client", "target": "lb", "data": { "label": "HTTPS" } },
    { "id": "e2", "source": "lb", "target": "api1", "sourceHandle": "bottom", "targetHandle": "top" },
    { "id": "e3", "source": "lb", "target": "api2", "sourceHandle": "bottom", "targetHandle": "top" },
    { "id": "e4", "source": "api1", "target": "db", "data": { "label": "SQL" } },
    { "id": "e5", "source": "api2", "target": "db", "data": { "label": "SQL" } },
    { "id": "e6", "source": "api1", "target": "cache", "sourceHandle": "right", "targetHandle": "left", "type": "straight", "data": { "label": "Cache", "color": "#ef4444" } },
    { "id": "e7", "source": "api2", "target": "cache", "data": { "label": "Cache", "color": "#ef4444" } }
  ],
  "styles": {
    "activeStyleId": "cleanMinimal",
    "activePaletteId": "ocean"
  }
}
```

### 11.3 Project Kanban with Swimlanes

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "task1",
      "position": { "x": 50, "y": 80 },
      "data": {
        "label": "Design UI",
        "shape": "stickyNote",
        "swimlaneId": "lane_todo",
        "statusIndicators": [{ "status": "not-started" }]
      }
    },
    {
      "id": "task2",
      "position": { "x": 50, "y": 160 },
      "data": {
        "label": "API Integration",
        "shape": "stickyNote",
        "swimlaneId": "lane_progress",
        "statusIndicators": [{ "status": "in-progress" }]
      }
    },
    {
      "id": "task3",
      "position": { "x": 50, "y": 240 },
      "data": {
        "label": "Database Setup",
        "shape": "stickyNote",
        "swimlaneId": "lane_done",
        "statusIndicators": [{ "status": "completed" }]
      }
    }
  ],
  "edges": [],
  "swimlanes": {
    "orientation": "horizontal",
    "containerTitle": "Sprint Board",
    "horizontal": [
      { "id": "lane_todo", "label": "To Do", "color": "#fef3c7", "size": 200, "order": 0 },
      { "id": "lane_progress", "label": "In Progress", "color": "#dbeafe", "size": 200, "order": 1 },
      { "id": "lane_done", "label": "Done", "color": "#dcfce7", "size": 200, "order": 2 }
    ],
    "vertical": []
  }
}
```

---

## 12. Validation Rules

The importer applies these rules automatically:

1. **Missing `id`**: Auto-generated as `"node_{timestamp}_{index}"`
2. **Duplicate `id`**: Renamed with `"_dup_{index}"` suffix
3. **Unknown `shape`**: Falls back to `"rectangle"` with a warning
4. **Unknown edge `type`**: Falls back to default `"smoothstep"` with a warning
5. **Missing `position`**: Defaults to `{ x: 0, y: 0 }`
6. **Missing `data.label`**: Defaults to `"Node {N}"`
7. **Invalid `source`/`target`**: Edge is imported but a warning is issued
8. **Missing `source` or `target`**: Edge is skipped
9. **Status indicators**: Missing `id` is auto-generated, invalid fields are dropped
10. **Extra/unknown fields**: Silently ignored (forward-compatible)

---

## 13. Tips for AI Generation

1. **Use unique, descriptive IDs** — e.g., `"node_auth_check"` not `"node_1"`. Makes edges easier to define and debug.

2. **Start with nodes, then edges** — Define all nodes first, then connect them. Reference node IDs in edge `source`/`target`.

3. **Consistent flow direction** — Pick either top-to-bottom or left-to-right and be consistent with `sourceHandle`/`targetHandle`.

4. **Use status indicators sparingly** — Only add them when the diagram tracks task status.

5. **Color coding** — Use consistent colors for node categories (e.g., green for success states, red for errors, blue for processing).

6. **Group related nodes** — Use `group` nodes with `parentId`/`extent: "parent"` for visual grouping, or `linkGroupId` for move-together behavior.

7. **Edge labels** — Use short labels on edges (e.g., `"Yes"`, `"No"`, `"HTTPS"`, `"SQL"`).

8. **Icons enhance readability** — Add icons for common concepts: `Database`, `Server`, `Globe`, `Lock`, `User`, etc.

9. **Spacing matters** — Well-spaced diagrams are more readable. Use 100-200px between nodes.

10. **Don't over-style** — Let the diagram style handle visual consistency. Only override colors/fonts when semantically meaningful.
