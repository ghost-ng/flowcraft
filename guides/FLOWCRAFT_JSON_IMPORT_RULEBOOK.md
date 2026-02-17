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

Each edge connects two nodes. Edges support full styling including color, thickness, dash patterns, labels, and arrowhead markers.

```json
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "type": "smoothstep",
  "sourceHandle": "bottom",
  "targetHandle": "top",
  "animated": false,
  "label": "Yes",
  "markerEnd": "arrowclosed",
  "data": {
    "label": "Yes",
    "color": "#10b981",
    "thickness": 2,
    "strokeDasharray": "8 4"
  }
}
```

### 3.1 Edge Fields (top-level)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes* | Unique edge identifier |
| `source` | string | **Yes** | ID of the source node |
| `target` | string | **Yes** | ID of the target node |
| `type` | string | `"smoothstep"` | Edge routing type (see below) |
| `sourceHandle` | string | — | Source connection point: `"top"`, `"bottom"`, `"left"`, `"right"` |
| `targetHandle` | string | — | Target connection point: `"top"`, `"bottom"`, `"left"`, `"right"` |
| `animated` | boolean | `false` | Whether to animate the edge (React Flow top-level property) |
| `label` | string | — | Text label on the edge (alternative to `data.label`) |
| `markerEnd` | string | `"arrowclosed"` | End arrowhead marker (see markers below) |
| `markerStart` | string | — | Start arrowhead marker (see markers below) |
| `style` | object | — | CSS style overrides for the edge path (e.g. `{ "stroke": "#f00" }`) |
| `data` | object | — | Edge data payload (see below) |

### 3.2 Valid Edge Types

| Type | Description | Visual |
|------|-------------|--------|
| `default` | Default bezier curve | Smooth curved line |
| `straight` | Straight line | Direct line between nodes |
| `step` | Right-angle steps | Sharp 90° turns |
| `smoothstep` | Smooth right-angle curves (recommended) | Rounded 90° turns |
| `bezier` | Smooth bezier curve | S-curve line |
| `dependency` | Styled dependency connector | Colored by dependency type |
| `animated` | Animated dashed line | Moving dashes |

### 3.3 Edge Data (`data` object)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Text label shown on the edge |
| `color` | string (hex) | `"#94a3b8"` | Edge stroke color |
| `thickness` | number | `1` | Stroke width in pixels |
| `animated` | boolean | `false` | Whether to animate the edge |
| `opacity` | number | `1` | Edge opacity (0-1) |
| `labelColor` | string (hex) | — | Color of the label text |
| `labelPosition` | number | `0.5` | Position of the label along the edge: `0` = near source, `0.5` = center (default), `1` = near target |
| `strokeDasharray` | string | — | SVG dash pattern (e.g. `"8 4"` for dashed, `"2 2"` for dotted) |
| `dependencyType` | string | — | `"depends-on"`, `"blocks"`, or `"related"` |

### 3.4 Arrowhead Markers

| Marker Value | Description |
|-------------|-------------|
| `"arrowclosed"` | Filled triangle arrowhead (default for `markerEnd`) |
| `"arrow"` | Open triangle arrowhead |
| _(omit)_ | No marker |

### 3.5 Common Connector Patterns

**Dashed connector:**
```json
{ "id": "e1", "source": "a", "target": "b", "data": { "color": "#94a3b8", "strokeDasharray": "8 4" } }
```

**Thick colored connector with label:**
```json
{ "id": "e2", "source": "a", "target": "b", "data": { "label": "HTTPS", "color": "#3b82f6", "thickness": 3 } }
```

**Animated dependency edge:**
```json
{ "id": "e3", "source": "a", "target": "b", "type": "dependency", "data": { "dependencyType": "blocks", "color": "#ef4444" } }
```

**Connector with label near the source:**
```json
{ "id": "e4a", "source": "a", "target": "b", "data": { "label": "Out", "labelPosition": 0.15 } }
```

**Bidirectional arrows:**
```json
{ "id": "e4", "source": "a", "target": "b", "markerEnd": "arrowclosed", "markerStart": "arrowclosed" }
```

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

FlowCraft uses [Lucide icons](https://lucide.dev/icons/). When specifying an icon name, use the **PascalCase** component name from lucide-react.

### 9.1 Icon Properties on Nodes

Icons are configured via fields in the node `data` object:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `icon` | string | — | Lucide icon name in PascalCase (e.g. `"Database"`, `"Shield"`) |
| `iconColor` | string (hex) | text color | Icon color |
| `iconSize` | number | fontSize + 2 | Icon size in pixels |
| `iconPosition` | string | `"left"` | `"left"` or `"right"` relative to label |
| `iconBgColor` | string (hex) | — | Background color behind the icon (creates a colored badge) |
| `iconBorderColor` | string (hex) | — | Border color around the icon wrapper |
| `iconBorderWidth` | number | `0` | Border width around the icon wrapper |
| `iconOnly` | boolean | `false` | Renders only the icon with no shape background |

### 9.2 Icon Examples

**Node with icon next to label:**
```json
{
  "data": {
    "label": "Database",
    "shape": "database",
    "color": "#6366f1",
    "icon": "Database",
    "iconColor": "#ffffff",
    "iconSize": 18
  }
}
```

**Icon with colored background badge:**
```json
{
  "data": {
    "label": "Secure",
    "shape": "rectangle",
    "icon": "Shield",
    "iconBgColor": "#10b981",
    "iconColor": "#ffffff",
    "iconBorderColor": "#059669",
    "iconBorderWidth": 1
  }
}
```

**Icon-only node (no shape background):**
```json
{
  "data": {
    "label": "",
    "shape": "rectangle",
    "icon": "Cloud",
    "iconOnly": true,
    "iconSize": 40,
    "iconColor": "#6366f1"
  }
}
```

### 9.3 Common Icon Names

| Icon Name | Visual | Use Case |
|-----------|--------|----------|
| `Check` | Checkmark | Success/completion |
| `X` | X/close | Failure/cancel |
| `AlertTriangle` | Warning triangle | Warnings |
| `AlertCircle` | Alert circle | Errors |
| `Database` | Database cylinder | Data stores |
| `Server` | Server rack | Servers/infrastructure |
| `Cloud` | Cloud | Cloud services |
| `User` | Person silhouette | Users/accounts |
| `Users` | People silhouettes | Teams/groups |
| `Settings` | Gear | Configuration |
| `Lock` | Padlock | Security/locked |
| `Unlock` | Open padlock | Unlocked/public |
| `Shield` | Shield | Protection/security |
| `ShieldCheck` | Shield with check | Verified/secure |
| `Key` | Key | Authentication |
| `ArrowRight` | Right arrow | Flow direction |
| `ArrowDown` | Down arrow | Flow direction |
| `FileText` | Document with text | Documents |
| `FolderOpen` | Open folder | Folders/categories |
| `Globe` | Globe/world | Internet/web |
| `Mail` | Email envelope | Email/messaging |
| `Phone` | Telephone | Phone/communication |
| `Search` | Magnifying glass | Search |
| `Star` | Star | Favorites/important |
| `Zap` | Lightning bolt | Performance/speed |
| `Code` | Code brackets | Code/development |
| `Terminal` | Terminal window | CLI/command line |
| `Cpu` | CPU chip | Processing/compute |
| `Wifi` | WiFi signal | Network/connectivity |
| `Clock` | Clock face | Time/scheduling |
| `Calendar` | Calendar | Dates/deadlines |
| `BarChart3` | Bar chart | Analytics/metrics |
| `PieChart` | Pie chart | Reports |
| `GitBranch` | Git branch | Version control |
| `Workflow` | Workflow diagram | Processes |
| `Bug` | Bug | Issues/debugging |
| `Eye` | Eye | Visibility/monitoring |
| `EyeOff` | Eye with slash | Hidden |
| `RefreshCw` | Circular arrows | Refresh/retry |
| `Trash2` | Trash can | Delete |
| `Download` | Download arrow | Downloads |
| `Upload` | Upload arrow | Uploads |
| `ExternalLink` | Arrow out of box | External links |
| `Link` | Chain link | Connections |
| `Layers` | Stacked layers | Layers/tiers |

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

## 13. Sizing and Readability Guidelines

### 13.1 Block Sizing for Labels

Blocks (nodes) should be large enough to present their text/labels clearly without truncation or overflow. Follow these rules:

- **Short labels (1-3 words):** Default size is fine (160×60 for rectangles, 100×100 for diamonds/circles).
- **Medium labels (4-8 words):** Increase `width` to 200-250px or reduce `fontSize` to 12.
- **Long labels (9+ words or multi-line):** Use `width: 280-360` and `height: 80-100` so text wraps comfortably.
- **With icons:** Add ~24px to the width to accommodate the icon beside the label.
- **Diamond shapes:** Keep labels under 3 words (diamonds have limited interior space). Use 120×120 if the label is 2 words.
- **General rule:** When in doubt, make the block wider rather than taller — horizontal text is easier to read.

### 13.2 Status Puck Sizing and Placement

When using status indicators (`statusIndicators`), consider the node size:

- **Default puck size (12px):** Works well on standard-sized nodes (160×60 and larger).
- **Small nodes (width < 100 or height < 50):** Use `size: 8` to avoid the puck dominating the node.
- **Large nodes (width > 250):** Consider `size: 14-16` so the puck remains visible.
- **Multiple pucks:** Place them in different corners to avoid overlap. For 2 pucks, use `top-right` and `top-left`. For 3-4, use all four corners.
- **Diamond shapes:** Pucks are automatically positioned at the diamond edge midpoints (not at bounding box corners), so all four positions work well.

### 13.3 Connector Labels and Short Edges

Edge labels can overlap or look cluttered on short connectors. Follow these guidelines:

- **Short edges (nodes < 120px apart):** Avoid labels, or use `labelPosition` to shift the label away from the midpoint (e.g., `0.2` or `0.8`).
- **Medium edges (120-250px):** Labels work well at the default center position (`0.5`).
- **Long edges (> 250px):** Labels are very readable; consider placing them near the source (`0.2`) or target (`0.8`) for clarity.
- **When labels overlap nodes:** Use `labelPosition: 0.3` or `0.7` to nudge the label away from the node.
- **Keep labels short:** 1-3 words is ideal (e.g., `"Yes"`, `"No"`, `"HTTPS"`, `"async"`). Long labels on edges look cluttered.
- **Dependency edges ("DEPENDS ON" pill):** The `dependency` edge type renders a pill badge ("DEPENDS ON", "BLOCKS", etc.) PLUS an optional custom label below it. This takes ~24px of vertical space at the edge midpoint. Ensure nodes connected by dependency edges are at least **180px apart** vertically, or use `labelPosition` to shift both labels away from nodes.

### 13.4 Node Overlap Prevention

Nodes must NEVER have overlapping bounding boxes. Calculate positions carefully:

- **Bounding box** = `(x, y)` to `(x + width, y + height)` using the node's actual or default dimensions.
- **Minimum gap:** Leave at least **40px** between the edges of adjacent node bounding boxes. 80-100px is preferred.
- **With edge labels:** If there is a labeled edge between two nodes, add extra spacing (at least **60px** beyond the label text height) to prevent the label from overlapping either node.
- **Common mistake:** Placing a node at `y: 200` with default height 60 means it occupies y 200-260. The next node below should start no earlier than `y: 320` (260 + 60px gap).

### 13.5 Swimlane Layout Guidelines

Swimlane headers have limited space for labels. Follow these rules:

- **Horizontal lane labels:** Rendered as vertical text in a 48px-wide left column. Keep labels to **2-3 words max** (~20 characters). Use abbreviations if needed (e.g., "Gov & Auth" not "Governance & Authorization").
- **Vertical lane labels:** Rendered horizontally in a 32px-tall top row. Keep labels to **3-4 words max**.
- **Lane sizing:** Set `size` large enough to contain all nodes assigned to that lane. A lane with 3 stacked nodes needs at least `size: 400` (3 nodes × ~60px height + 2 × ~100px spacing + margins).
- **Node positions in lanes:** When using swimlanes, position nodes within the lane's visual bounds. For horizontal lanes, nodes should be offset rightward by at least **60px** from the left edge (to clear the lane header).
- **Lane order:** Set `order` values sequentially (0, 1, 2...) to control which lane appears first.

### 13.6 Overall Layout Quality Checklist

Before finalizing a diagram JSON, verify:

1. **No overlapping nodes** — Every node's bounding box is clear of all others.
2. **Edge labels don't collide with nodes** — Labels on short edges are shifted or omitted.
3. **Swimlane labels are short** — Under 20 characters for horizontal, under 30 for vertical.
4. **Consistent spacing** — Nodes in the same row/column are evenly spaced.
5. **Enough room for connectors** — Adjacent nodes have at least 100px between them vertically for edges/labels to render cleanly.
6. **Nodes fit their content** — `width`/`height` accommodate the label text, icon, and any status pucks.

---

## 14. Tips for AI Generation

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
