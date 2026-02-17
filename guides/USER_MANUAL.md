# FlowCraft User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Canvas Navigation](#canvas-navigation)
3. [Creating Nodes](#creating-nodes)
4. [Connecting Nodes](#connecting-nodes)
5. [Selecting Elements](#selecting-elements)
6. [Properties Panel](#properties-panel)
7. [Status Pucks](#status-pucks)
8. [Icon Styling](#icon-styling)
9. [Alignment & Transforms](#alignment--transforms)
10. [Swimlanes](#swimlanes)
11. [Dependencies](#dependencies)
12. [Format Painter](#format-painter)
13. [Templates](#templates)
14. [Diagram Styles & Themes](#diagram-styles--themes)
15. [Exporting](#exporting)
16. [Saving & Loading](#saving--loading)
17. [Importing JSON](#importing-json)
18. [Keyboard Shortcuts](#keyboard-shortcuts)
19. [Toolbar Reference](#toolbar-reference)
20. [Context Menus](#context-menus)

---

## Getting Started

FlowCraft is a browser-based diagramming application for creating flowcharts, system architecture diagrams, swimlane workflows, dependency maps, and more.

When you first open FlowCraft, you'll see:
- **Canvas** (center) - your working area
- **Shape Palette** (left) - drag shapes onto the canvas
- **Toolbar** (top) - file, edit, view, and style actions
- **Properties Panel** (right) - edit selected element properties

### Quick Start

1. Drag a shape from the palette onto the canvas, or press **N** to add a node
2. Double-click a node to edit its label
3. Drag from a handle (small circle on the node edge) to another node to connect them
4. Use the Properties Panel on the right to style your nodes and connectors

---

## Canvas Navigation

### Panning
- **Left-click and drag** on empty canvas to pan around

### Zooming
- **Mouse wheel** to zoom in/out
- **Zoom In / Zoom Out** buttons in the toolbar
- **Fit View** button to zoom to fit all content

### Grid & Snapping
- Toggle grid visibility in the toolbar (Grid button)
- Grid styles: **Dots**, **Lines**, or **Cross** (configurable in grid options dropdown)
- Grid spacing: 10px, 20px, 40px, or 80px
- **Snap to Grid** can be toggled for automatic position snapping

### Overlays
- **Minimap** - small overview in the corner, click to navigate
- **Rulers** - pixel guides along top and left edges

---

## Creating Nodes

### From the Shape Palette
Drag any shape from the left palette onto the canvas. Available shapes:

**Basic Shapes:**
- Rectangle, Rounded Rectangle, Diamond, Circle
- Parallelogram, Document, Hexagon, Cloud, Sticky Note

**Arrow Shapes:**
- Block Arrow, Chevron Arrow, Double Arrow, Circular Arrow

**Containers:**
- Group (drag to create a visual container)

### Adding Nodes Quickly
- Press **N** to add a new node at the center of the canvas
- Right-click for context menu options

### Editing Labels
- **Double-click** a node to edit its text
- Press **F2** with a node selected to start editing
- Press **Enter** or click elsewhere to confirm
- Press **Escape** to cancel editing

### Resizing Nodes
- Hover over a node to reveal resize handles at the corners
- Drag a handle to resize

---

## Connecting Nodes

### Creating Connections
1. Hover over a node to see the connection handles (small dots on each side)
2. Click and drag from a handle to another node's handle
3. Release to create the connection

### Connector Types
- **SmoothStep** (default) - rounded right-angle paths
- **Bezier** - smooth curved paths
- **Step** - sharp right-angle paths
- **Straight** - direct line
- **Dependency** - styled for dependency visualization
- **Animated** - animated dashed path

### Arrowheads
Over 25 arrowhead styles including:
- Triangle, Diamond, Circle (filled and open variants)
- UML symbols: Inheritance, Composition, Aggregation
- Database symbols: Crow's Foot, One-to-Many
- Custom: Bar, Vee, Double Triangle

Start and end arrowheads can be set independently in the Properties Panel.

---

## Selecting Elements

### Single Selection
- Click a node or edge to select it

### Multi-Selection
- **Ctrl + Click** to add/remove from selection
- **Ctrl + Drag** on empty canvas to draw a rectangle selection box

### Bulk Selection
- **Ctrl + A** - select all nodes
- **Select Same Type** - toolbar button or right-click menu; selects all nodes with the same shape as the current selection

---

## Properties Panel

The Properties Panel on the right side has five tabs:

### Node Tab
Edit properties of the selected node:

**Block Section**
- Shape type display
- Fill color (color picker + hex input)
- Border color, width, style (solid/dashed/dotted)
- Corner radius (0-50px)
- Opacity (0-100%)

**Label Section**
- Text content
- Icon selection (from the Lucide icon library, 1000+ icons)
- Icon position (left or right of label)
- Text color
- Font size (8-32px)
- Font weight (Light, Normal, Semi, Bold)
- Text alignment (Left, Center, Right)

**Icon Section** (visible when an icon is set)
- Icon color
- Icon background color
- Icon outline color and width
- Icon size

**Status Pucks Section** (see [Status Pucks](#status-pucks))

### Connector Tab
Edit properties of the selected edge:
- Connector type (Bezier, SmoothStep, Step, Straight, Dependency, Animated)
- Color, thickness, opacity
- Line style (Solid, Dashed, Dotted) with dash spacing
- Label text and label color
- Label position along the edge (0 = near source, 0.5 = center, 1 = near target)
- Start and end arrowhead types
- Dependency type

### Dependencies Tab
- View and manage upstream/downstream dependencies
- Toggle critical path analysis
- Add/remove dependency links
- See dependency chain statistics

### Swimlanes Tab
- Configure swimlane layout (see [Swimlanes](#swimlanes))
- Add/remove/rename lanes
- Set colors and orientation

### Data Tab
- Read-only metadata: Node ID, position, dimensions
- Swimlane assignment
- List of connected nodes
- Upstream and downstream dependency lists

### Section Behavior
When you select a node, sections auto-expand or collapse based on relevance:
- **Block** and **Label** sections always expand
- **Status Pucks** expands if the node has pucks
- **Icon** section expands if the node has an icon assigned

You can manually toggle any section by clicking its header.

---

## Status Pucks

Status pucks are small indicator badges that sit on the corners of a node, showing task status at a glance.

### Adding a Status Puck
- Right-click a node > **Add Status** > choose a status type
- Or use the **+** button in the Status Pucks section of the Properties Panel

### Status Types
| Status       | Default Color |
|-------------|---------------|
| Not Started | Gray (#94a3b8) |
| In Progress | Blue (#3b82f6) |
| Completed   | Green (#10b981)|
| Blocked     | Red (#ef4444)  |
| Review      | Yellow (#f59e0b)|

### Multiple Pucks
Each node can have multiple status pucks. Each puck is independent and can be positioned on any corner.

### Moving Pucks
- Click and drag a puck to move it to a different corner
- During drag, the puck follows your cursor and a ghost indicator shows the snap target corner
- Release to snap to the nearest corner (top-left, top-right, bottom-left, bottom-right)

### Resizing Pucks
- **Shift + drag** a puck to resize it (6-40px)

### Selecting Pucks
- Click a puck to select it (shows a blue selection ring)
- **Ctrl + Click** to add/remove pucks from selection
- Use **Select All on Node** or **Select All (Global)** buttons in the Properties Panel

### Customizing Pucks
In the Properties Panel's Status Pucks section, select a puck to edit:
- Status type
- Color
- Size
- Position (corner)
- Icon (optional - from Lucide library)
- Border color, width, and style

### Removing Pucks
- Click the **X** button on a puck chip in the Properties Panel
- Or right-click the node > **Add Status** > **None** to remove all pucks

---

## Icon Styling

When a node has an icon assigned, an **Icon** section appears in the Properties Panel:

- **Icon Color** - the stroke/fill color of the icon itself
- **Background** - a background color behind the icon (creates a colored chip)
- **Outline Color** - a border color around the icon container
- **Outline Width** - border thickness (0-4px)
- **Size** - icon pixel size (10-64px, or Auto to match font size)

To add an icon:
1. In the Properties Panel Label section, click **Add Icon**
2. Search the icon library by name
3. Click to select - the Icon styling section auto-expands

---

## Alignment & Transforms

Select two or more nodes to access alignment and transform tools.

### Alignment (2+ nodes selected)
Available in the toolbar Align dropdown and context menu:
- Align Left, Center Horizontal, Right
- Align Top, Center Vertical, Bottom

### Distribution (3+ nodes selected)
- Distribute Horizontally (equal horizontal spacing)
- Distribute Vertically (equal vertical spacing)

### Mirror / Flip
- **Ctrl + Shift + H** - Mirror horizontally (swap left-right positions)
- **Ctrl + Shift + F** - Mirror vertically (swap top-bottom positions)

### Rotation
- **Ctrl + ]** - Rotate arrangement 90 degrees clockwise
- **Ctrl + [** - Rotate arrangement 90 degrees counter-clockwise
- Rotate 180 degrees (via dropdown)

### Auto Layout
- **Ctrl + L** - Automatically arrange nodes in a top-to-bottom hierarchy
- Also available as toolbar buttons for vertical and horizontal layout

### Nudging
- **Arrow keys** - nudge selected nodes by 1 pixel
- **Shift + Arrow keys** - nudge by 10 pixels

---

## Swimlanes

Swimlanes organize your diagram into labeled rows, columns, or a matrix grid.

### Creating Swimlanes
Use the Swimlane tab in the Properties Panel, or access templates that include swimlanes.

### Modes
- **Horizontal** - rows with labels on the left
- **Vertical** - columns with labels on top
- **Matrix** - combined rows and columns forming a grid

### Lane Management
- **Add Lane** - creates a new row or column
- **Remove Lane** - removes a lane
- **Rename** - double-click a lane label to edit it
- **Recolor** - set per-lane background color
- **Resize** - drag any lane border to adjust size (including the first lane's leading edge)
- **Collapse** - minimize a lane to save space
- **Drag** - use the grip handle on lane headers to reposition the entire swimlane container

### Container Title
Set an optional title that appears above the swimlane grid.

---

## Dependencies

The dependency system tracks relationships between nodes.

### Dependency Types
- **Depends On** - this node requires another node to be completed first
- **Blocks** - this node prevents another from proceeding
- **Related** - informational link without ordering

### Managing Dependencies
Use the Dependencies tab in the Properties Panel to:
- View upstream (depends on) and downstream (blocked by) nodes
- Add new dependencies by selecting target nodes
- Remove existing dependencies
- Toggle critical path analysis

### Chain Highlighting
- **Ctrl + Click** a node to highlight its entire dependency chain
- Upstream and downstream nodes glow with opacity based on distance
- Non-chain nodes dim to 10% opacity
- A status bar shows chain statistics (total nodes, upstream count, downstream count)
- Press **Escape** to clear the highlight

### Dependency Badges
Toggle the visibility of dependency badges on nodes using the toolbar toggle.

---

## Format Painter

Copy styling from one element and apply it to others.

### How to Use
1. Select a node or edge whose style you want to copy
2. Click the **Format Painter** button in the toolbar (or **Ctrl + Shift + C** to copy style)
3. Click on target nodes/edges to apply the style
4. Press **Escape** or click the Format Painter button again to deactivate

### What Gets Copied
**For Nodes:** fill color, border color/width/style, text color, font size/weight/family, border radius, opacity, text alignment, icon, status pucks

**For Edges:** color, thickness, opacity, line style, label color

---

## Templates

FlowCraft includes 15 pre-built templates organized by category.

### Opening Templates
Click the **Templates** button in the toolbar to open the Template Gallery.

### Categories

**General:**
- Blank Canvas, Simple Flowchart, Mind Map, Mind Map (Colored)

**Business:**
- Cross-Functional Flowchart, Decision Tree, Project Timeline, Process Infographic, User Journey Map

**Software:**
- Software Architecture, Deployment Pipeline, Sequence Diagram, Network Architecture

**Agile:**
- Sprint Board, Kanban Board

### Using Templates
1. Browse or search templates
2. Click a template to preview
3. Confirm to load (replaces current diagram)

---

## Diagram Styles & Themes

### Diagram Styles
Apply a complete visual theme to your entire diagram. Available in the toolbar Style Picker.

18 built-in styles:
- Clean Minimal, Corporate Professional, Blueprint, Whiteboard Sketch
- Neon Dark, Pastel Soft, Flat Material, Monochrome Ink
- Retro Terminal, Watercolor, Glass Morphism, Wireframe
- Military C2, Infographic Bold, Colorful Gradient, Dark Neon Glow
- Notebook, Gradient Cards

### Color Palettes
10 built-in palettes for quick node coloring:
- Ocean, Berry, Forest, Sunset, Grayscale
- Cyber, Pastel Dream, Earth Tone, Military, Accessible

Apply palette colors quickly with number keys **1-9** to color selected nodes.

### Dark Mode
Toggle dark mode with the toolbar button or **Ctrl + Shift + D**.

---

## Exporting

Press **Ctrl + E** or click the Export button to open the export dialog.

### Image Formats

**PNG**
- Scale: 1x, 2x, 3x, or 4x
- Transparent background option
- Padding: 0-100px

**JPG**
- Scale: 1x, 2x, 3x, or 4x
- Quality: 10-100%
- Custom background color
- Padding: 0-100px

**SVG**
- Font embedding
- CSS inclusion
- Padding

### Document Formats

**PDF**
- Page sizes: A4, A3, Letter, Legal
- Orientation: Portrait or Landscape
- Fit-to-page option
- Margins: 0-50mm
- Auto-generated footer with date

**PPTX** (PowerPoint)
- Standard or Widescreen slides
- Title slide option
- Speaker notes

### Data Format

**JSON**
- Pretty print option
- Include viewport, styles, and metadata

### Quick Export
- **Copy as PNG** - copies diagram image to clipboard (toolbar button)
- **Copy as SVG** - copies diagram as SVG to clipboard (toolbar button)

---

## Saving & Loading

### Save
- **Ctrl + S** - saves your diagram as a JSON file
- Downloads automatically with the filename `flowcraft-diagram.json`

### Load
- Click **Open** in the toolbar to load a previously saved JSON file
- Supports drag-and-drop of JSON files

### Auto-Save
FlowCraft preserves your diagram in browser local storage. Your work persists between sessions.

---

## Importing JSON

FlowCraft can import diagrams from JSON, including JSON generated by AI systems.

### Import Dialog
1. Click the **Import** button in the toolbar (clipboard icon in the Export group)
2. A dialog opens with a large text area
3. Paste your JSON into the text area
4. Click **Import** to load the diagram
5. If the JSON is invalid, an error message appears below the text area

### JSON Format
The JSON format supports nodes, edges, swimlanes, layers, viewport, and styles. See the [JSON Import Rulebook](FLOWCRAFT_JSON_IMPORT_RULEBOOK.md) for the complete specification.

### What Happens on Import
- Existing nodes and edges are **replaced** (not merged)
- Swimlanes and layers are cleared and re-created from the imported data
- Missing fields are set to defaults (e.g., shape defaults to `rectangle`)
- Duplicate node IDs are automatically renamed
- Invalid fields are silently ignored
- A toast notification confirms success or reports errors

---

## Keyboard Shortcuts

Press **Ctrl + /** to view the full shortcuts dialog at any time.

### General
| Shortcut | Action |
|----------|--------|
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| Ctrl + S | Save to file |
| Ctrl + E | Export dialog |
| Ctrl + A | Select all |
| Delete / Backspace | Delete selected |
| Escape | Cancel / Deselect |
| Ctrl + Drag | Rectangle select |
| Ctrl + Shift + D | Toggle dark mode |

### Nodes
| Shortcut | Action |
|----------|--------|
| N | Add new node |
| F2 | Edit selected node label |
| Ctrl + D | Duplicate selected |
| 1-9 | Apply palette color |
| Arrow keys | Nudge selected (1px) |
| Shift + Arrow keys | Nudge selected (10px) |
| Ctrl + Scroll | Adjust border thickness |

### Layout & Alignment
| Shortcut | Action |
|----------|--------|
| Ctrl + L | Auto layout |
| Ctrl + G | Group in region |
| Ctrl + Shift + G | Link group |
| Ctrl + Shift + H | Mirror horizontal |
| Ctrl + Shift + F | Mirror vertical |
| Ctrl + ] | Rotate 90 degrees clockwise |
| Ctrl + [ | Rotate 90 degrees counter-clockwise |

### Style
| Shortcut | Action |
|----------|--------|
| Ctrl + Shift + C | Copy style |
| Ctrl + Shift + V | Paste style |

---

## Toolbar Reference

The toolbar runs along the top (or left side) of the application, organized into draggable groups:

### Toolbar Customization
- **Rearrange groups** - drag any toolbar group by its divider to reorder it. The logo and version/GitHub sections are pinned.
- **Vertical mode** - click the orientation toggle to switch the toolbar to a vertical layout on the left side. Tooltips appear to the right in vertical mode.
- **Wrapping** - when the browser window is narrow, toolbar groups automatically wrap to additional rows.

### File Group
- **New** - start a fresh diagram
- **Open** - load a JSON diagram file
- **Save** (Ctrl+S) - download diagram as JSON
- **Templates** - open the template gallery

### Edit Group
- **Undo** (Ctrl+Z) / **Redo** (Ctrl+Shift+Z)
- **Copy** / **Delete**

### View Group
- **Zoom In** / **Zoom Out** / **Fit View**
- **Grid Options** - toggle grid, change style and spacing
- **Rulers** - toggle ruler visibility
- **Minimap** - toggle minimap
- **Snap** - toggle snap to grid

### Layout Group
- **Auto Arrange** (Ctrl+L)
- **Vertical Layout** / **Horizontal Layout**

### Transform Group (active with 2+ selections)
- **Align** dropdown (Left, Center H, Right, Top, Center V, Bottom)
- **Mirror** dropdown (Horizontal, Vertical)
- **Rotate** dropdown (90 CW, 90 CCW, 180)

### Style Group
- **Properties Panel** - toggle panel visibility
- **Format Painter** - copy/paste element styles
- **Select Same Type** - select all nodes of the same shape
- **Style Picker** - apply diagram styles
- **Palette Picker** - apply color palettes

### Export Group
- **Copy as Image** - copy diagram as PNG to clipboard
- **Copy as SVG** - copy diagram as SVG to clipboard
- **Export** (Ctrl+E) - open export dialog
- **Import** - open JSON import dialog

### Utilities Group
- **Keyboard Shortcuts** (Ctrl+/) - view shortcuts dialog
- **Selection Color** - change the highlight color for selected elements
- **Presentation Mode** - full-screen presentation with annotation tools
- **Dark Mode** (Ctrl+Shift+D)

---

## Context Menus

### Node Context Menu (right-click a node)
- **Edit Label** (F2) - start inline editing
- **Duplicate** (Ctrl+D) - create a copy
- **Copy** / **Delete**
- **Change Shape** - submenu with all shape types
- **Add Status** - submenu with status types
- **Color** - quick color swatches
- **Select Same Shape** - select all nodes with this shape type
- **Send to Back** / **Bring to Front** - layer ordering

### Selection Context Menu (right-click with multiple selected)
- **Delete** - remove all selected
- **Auto-Format** - quick layout
- **Group** - Group in Region or Link Group
- **Align** - alignment options
- **Distribute** - spacing options
- **Mirror** / **Rotate** - transform options
- **Change Color** - apply color to all selected

---

*FlowCraft - Professional Diagramming Made Simple*
