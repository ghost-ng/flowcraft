# Shapes & Nodes

Nodes are the building blocks of every Chart Hero diagram. Each node has a shape, a label, and a rich set of visual and metadata properties. All shapes are rendered by a single component (`GenericShapeNode`), which means every property works with every shape type.

---

## Shape Palette

The Shape Palette is the vertical panel on the left side of the screen. It is organized into sections separated by dividers.

### Basic Shapes (10)

| Shape | Palette Label | Flowchart Usage |
|-------|---------------|-----------------|
| Rectangle | Rectangle | Generic process step |
| Rounded Rectangle | Rounded Rect | Start/End terminator, general-purpose |
| Diamond | Diamond | Decision or branching point |
| Circle | Circle | Connector, junction, or on-page reference |
| Parallelogram | Parallelogram | Input/Output data |
| Document | Document | Document, report, or printout |
| Hexagon | Hexagon | Preparation step |
| Cloud | Cloud | External system, API, or cloud service |
| Sticky Note | Sticky Note | Comments and annotations (yellow tint) |
| Text Box | Text Box | Borderless text container for free-form labels |

### Arrow Shapes (4)

| Shape | Palette Label | Description |
|-------|---------------|-------------|
| Block Arrow | Block Arrow | Solid directional arrow pointing right |
| Chevron Arrow | Chevron Arrow | Pointed chevron or ribbon shape |
| Double Arrow | Double Arrow | Bidirectional arrow pointing left and right |
| Circular Arrow | Circular Arrow | Curved return or cycle arrow |

### Special Items

Below the arrow shapes, the palette provides two additional items:

- **Icon Library** -- Opens a searchable icon picker with 1000+ icons from the Lucide library. Selecting an icon creates an icon-only node on the canvas.
- **Group** -- A dashed-border container that can hold child nodes. Drag child nodes into a group to logically associate them.

### Additional Shapes (via Context Menu, AI, or JSON Import)

The following shapes are defined in the data model and can be applied to any node through the AI assistant, JSON import, or programmatic means. They do not appear directly in the palette:

| Shape ID | Description |
|----------|-------------|
| `ellipse` | Oval / ellipse |
| `triangle` | Triangle |
| `star` | Five-pointed star |
| `arrow` | Simple arrow |
| `callout` | Speech callout bubble |
| `predefinedProcess` | Double-bordered rectangle (subroutine) |
| `manualInput` | Slanted-top rectangle (manual input) |
| `preparation` | Extended hexagon (preparation step) |
| `data` | Parallelogram variant (data) |
| `database` | Cylinder shape (database) |
| `internalStorage` | Rectangle with internal corner lines |
| `display` | Rounded-right rectangle (display) |

---

## Creating Nodes

There are five ways to add a node to the canvas:

1. **Drag from the Shape Palette** -- Drag any shape from the left palette onto the canvas. The node appears where you drop it.
2. **Double-click on empty canvas** -- Creates a default rounded rectangle at the click position and immediately enters inline edit mode.
3. **Right-click canvas > Add Node Here** -- Opens a context menu; select "Add Node Here" to place a node at the click location.
4. **AI Assistant** -- Describe what you need in natural language, for example: `"Add a database node labeled Users"`.
5. **Press N** -- Adds a new node at the center of the current viewport.

---

## Node Properties

Every node carries the following configurable properties, editable through the Properties Panel on the right or via the context menu.

### Appearance

| Property | Options / Range | Default |
|----------|-----------------|---------|
| Fill Color | Any hex color | `#ffffff` |
| Border Color | Any hex color | `#94a3b8` |
| Border Width | 0 -- 8px (0.5px steps) | 1px |
| Border Style | solid, dashed, dotted | solid |
| Border Radius | 0 -- 50px | 8px |
| Opacity | 0 -- 100% (5% steps) | 100% |

### Text

| Property | Options / Range | Default |
|----------|-----------------|---------|
| Label | Any text (use `\n` for newlines) | "New Node" |
| Text Color | Any hex color | `#1e293b` |
| Font Size | 8 -- 32px | 14px |
| Font Weight | 300 (Light), 400 (Normal), 600 (Semi-Bold), 700 (Bold) | 400 |
| Font Family | 28 font options across Sans-Serif, Serif, Monospace, and Display categories | Inter |
| Text Align | left, center, right | center |

**Available Font Families:**

- **Sans-Serif** -- Inter, Aptos, Calibri, Segoe UI, Arial, Helvetica, Verdana, Tahoma, Trebuchet MS, Franklin Gothic, Franklin Gothic Book, Century Gothic, Candara, Corbel, Gill Sans MT, Lucida Sans
- **Serif** -- Cambria, Georgia, Times New Roman, Garamond, Palatino, Book Antiqua, Constantia
- **Monospace** -- Consolas, Courier New
- **Display** -- Impact, Arial Black, Comic Sans MS

### Dimensions and Transform

| Property | Options / Range | Default |
|----------|-----------------|---------|
| Width | Any positive number (px) | 160px |
| Height | Any positive number (px) | 60px |
| Rotation | Any degree value | 0 degrees |
| Flip Horizontal | Toggle on/off | Off |
| Flip Vertical | Toggle on/off | Off |

### Icon

| Property | Options / Range | Default |
|----------|-----------------|---------|
| Icon | Any Lucide icon name | None |
| Icon Position | left, right | left |
| Icon Color | Any hex color | Auto (matches text color) |
| Icon Background | Any hex color | None |
| Icon Outline Color | Any hex color | None |
| Icon Outline Width | 0 -- 4px (0.5px steps) | 0px |
| Icon Size | 10 -- 64px | Auto |

### Metadata

| Property | Description | Default |
|----------|-------------|---------|
| Notes | Free-form text annotations | Empty |
| Start On | Date field for scheduling | None |
| Completed By | Person or team who owns this node | Empty |

---

## Editing Node Labels

There are three ways to edit a node's label:

1. **Double-click** the node to enter inline edit mode directly on the canvas.
2. **Press F2** with a node selected to enter inline edit mode.
3. **Properties Panel** -- type into the Label field in the right panel.

When in inline edit mode:

- Press `Enter` to confirm the label.
- Press `Escape` to cancel and revert changes.

---

## Selecting Nodes

| Method | How to Use |
|--------|------------|
| **Single select** | Click a node |
| **Multi-select** | Hold `Shift` and click additional nodes |
| **Box select** | Drag on the canvas to draw a selection rectangle |
| **Select all** | Press `Ctrl+A` |
| **Select same type** | Use the "Select Same Type" button in the toolbar to select all nodes of the same shape as the current selection |

---

## Z-Ordering

Nodes can be layered in front of or behind other nodes. Use the following shortcuts to change a node's stacking order:

| Shortcut | Action |
|----------|--------|
| `Ctrl+]` | Bring forward one step |
| `Ctrl+[` | Send backward one step |
| `Ctrl+Shift+]` | Bring to front (topmost) |
| `Ctrl+Shift+[` | Send to back (bottommost) |

---

## Quick Coloring

### Palette Number Keys

Press number keys `1` through `9` with nodes selected to instantly apply colors from the active color palette. Chart Hero ships with 11 built-in palettes, and the active palette can be changed from the Style section of the toolbar.

### Context Menu Color Picker

Right-click a node and use the 10-color quick picker at the top of the context menu. The quick colors are:

| Color | Hex |
|-------|-----|
| Blue | `#3b82f6` |
| Green | `#10b981` |
| Amber | `#f59e0b` |
| Red | `#ef4444` |
| Violet | `#8b5cf6` |
| Pink | `#ec4899` |
| Cyan | `#06b6d4` |
| Gray | `#6b7280` |
| Orange | `#f97316` |
| Teal | `#14b8a6` |

### Border Thickness Scroll

Hold `Ctrl` and scroll the mouse wheel while hovering over a node to adjust its border thickness incrementally.

---

## Context Menu (Right-Click Node)

Right-clicking a node opens a context menu with quick access to common operations:

![Node Context Menu](../../assets/wiki-node-context-menu.png)

| Option | Description |
|--------|-------------|
| **Quick colors** | 10-color row for instant fill color changes |
| **Change Shape** | Switch to one of 8 common shapes without recreating the node |
| **Change Font** | Pick from 12 frequently used fonts |
| **Add Status Puck** | Attach a status indicator badge |
| **Copy / Cut / Paste** | Clipboard operations |
| **Duplicate** | Create a copy offset from the original |
| **Delete** | Remove the node from the canvas |

![Add Status Menu](../../assets/wiki-add-status-menu.png)

The Change Shape submenu in the context menu offers these shapes for quick switching:

- Rectangle
- Rounded Rect
- Diamond
- Circle
- Parallelogram
- Hexagon
- Document
- Cloud

---

## Resizing Nodes

Drag the resize handles on the edges and corners of a selected node to change its width and height. The node dimensions update in real time and are reflected in the Properties Panel.

---

## Shape Rendering Details

All shapes share the same rendering pipeline through `GenericShapeNode`:

- **Standard shapes** (rectangle, circle, diamond, hexagon, etc.) use CSS clip-paths for their outlines.
- **Arrow shapes** (blockArrow, chevronArrow, doubleArrow, circularArrow) use inline SVG paths.
- **Sticky Note** renders with a yellow tint and a folded corner effect.
- **Text Box** renders with no visible border (borderless container).
- **Group** renders with a dashed border and acts as a parent container for child nodes.

Every shape supports the full set of node properties listed above, including icons, status pucks, opacity, rotation, and flipping.
