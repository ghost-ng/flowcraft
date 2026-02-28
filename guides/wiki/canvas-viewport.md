# Canvas & Viewport

The canvas is Chart Hero's infinite working area where diagrams are built. It supports zooming, panning, grid overlays, snap-to-grid alignment, rulers, and a minimap for navigating large diagrams.

![Canvas overview](../../assets/guide-canvas-overview.png)

---

## Grid System

The grid provides a visual reference layer on the canvas to help align shapes and maintain consistent spacing. It is purely cosmetic by default and does not affect node positioning unless snap-to-grid is also enabled.

![Grid Options](../../assets/wiki-grid-options.png)

### Grid Styles

Three grid styles are available, selectable from the Grid dropdown in the toolbar:

| Style | Appearance |
|-------|------------|
| **Dots** | Small dots at each grid intersection (default) |
| **Lines** | Full horizontal and vertical gridlines |
| **Cross** | Small crosshairs at each grid intersection |

Some diagram styles override the grid style automatically. For example, Blueprint and Corporate Professional use Lines, while Wireframe uses Cross.

### Grid Spacing

Four preset spacing values control the distance between grid points:

| Preset | Description |
|--------|-------------|
| **10px** | Dense grid for precise layouts |
| **20px** | Medium density |
| **40px** | Standard spacing |
| **80px** | Wide spacing for large diagrams |

The default grid spacing is 16px. Select a preset from the Grid dropdown in the toolbar.

### Grid Color

The grid color is configurable in the Settings dialog. The default color is `#e2e8f0` (light gray). Each diagram style may set its own grid color when applied.

### Toggling the Grid

- Click the **Grid** button in the toolbar to toggle visibility.
- Alternatively, open the Settings dialog to control grid appearance.

### Grid in Exports

The grid is hidden in exported images by default. To include it, check **Include Grid** in the Export dialog before exporting.

---

## Snap-to-Grid

Snap-to-grid constrains node movement so nodes jump to the nearest grid line when dragged. This makes it easy to keep nodes aligned without manual adjustment.

**Snap is independent of grid visibility.** Even if the grid is hidden, snap still works when enabled.

![Snap Options](../../assets/wiki-snap-options.png)

### Snap Distances

Four snap distance presets determine how close a node must be to a grid line before it snaps:

| Distance | Behavior |
|----------|----------|
| **4px** | Very tight snap, fine positioning |
| **8px** | Default snap distance |
| **16px** | Moderate snap, easier alignment |
| **32px** | Aggressive snap to wide intervals |

### Toggling Snap

- Click the **Magnet** button in the toolbar to toggle snap on or off.
- The default state is enabled with an 8px snap distance.

### Alignment Guides

Alignment guides are purple dashed lines that appear when a dragged node's edge or center aligns with another node's edge or center. They help you line up nodes without needing an exact grid.

- Toggle the **Crosshair** button in the toolbar to show or hide alignment guides.
- Alignment guides are enabled by default.

**Shift+Drag** — Hold **Shift** while dragging a node to snap it to the nearest alignment guide. The node locks onto the guide position (left/right/center on the X axis, top/bottom/center on the Y axis) and stays there until you release Shift or move out of range.

Alignment guides work independently of grid snap. You can use both together.

---

## Rulers

Rulers display pixel measurements along the top and left edges of the canvas. They update in real time as you zoom and pan, providing precise positioning feedback.

### Toggling Rulers

- Click the **Ruler** button in the toolbar to show or hide rulers.
- Rulers are hidden by default.

---

## Custom Cursors

Chart Hero uses custom cursors on the canvas to indicate the current interaction mode:

| Cursor | Name | When it appears |
|--------|------|-----------------|
| ![default](../../assets/wiki-cursor-default.png) | **Default** | Over empty canvas (selection mode) |
| ![select](../../assets/wiki-cursor-select.png) | **Select** | Hovering over a node, edge, or puck |
| ![drag](../../assets/wiki-cursor-drag.png) | **Drag** | While panning (Ctrl+drag or middle-click drag) or moving a node |
| ![crosshair](../../assets/wiki-cursor-crosshair.png) | **Crosshair** | Hovering a connection handle on a node |
| ![elbow-move](../../assets/wiki-cursor-elbow-move.png) | **Elbow-move** | Hovering the type-cycle diamond on a connector |

---

## Zoom and Pan

### Zooming

| Action | Effect |
|--------|--------|
| **Scroll wheel** | Zoom in and out |
| **Pinch gesture** | Zoom on trackpad or touch device |
| **Fit View button** | Zoom and pan to show all content |

The zoom range is 0.1x to 4x by default. Both the minimum and maximum zoom levels can be adjusted in the Settings dialog.

The current zoom level is displayed in the toolbar.

### Zoom Settings

The following zoom behaviors can be individually enabled or disabled in the Settings dialog:

- **Zoom on scroll** -- scroll wheel zooms the canvas (enabled by default)
- **Zoom on pinch** -- trackpad pinch gesture zooms (enabled by default)
- **Zoom on double-click** -- double-clicking empty canvas zooms in (disabled by default)

### Panning

Hold **Ctrl** and drag on an empty area of the canvas to pan the viewport. You can also use the middle mouse button. The cursor changes to ![drag](../../assets/wiki-cursor-drag.png) while panning. The canvas is infinite in all directions.

### Fit View

The **Fit View** button in the toolbar (or right-click canvas > Fit View) automatically adjusts the zoom level and position so all nodes and edges are visible within the viewport.

---

## Minimap

The minimap is a small overview panel that shows the entire diagram in miniature. It appears in the corner of the canvas and displays each node as a colored rectangle.

### Using the Minimap

- Click anywhere on the minimap to jump to that area of the diagram.
- The highlighted rectangle on the minimap represents the current viewport.

### Toggling the Minimap

Toggle minimap visibility from the **status bar** at the bottom of the canvas. The minimap is visible by default.

---

## Canvas Background

The canvas background color is white by default and can be configured in the Settings dialog. When you apply a diagram style, the style may override the background color to match its theme (for example, dark styles use dark backgrounds).

---

## Selection

Chart Hero supports several ways to select nodes and edges on the canvas.

### Single Selection

Click any node or edge to select it. The Properties Panel on the right updates to show the selected element's properties.

### Multi-Selection

| Method | How |
|--------|-----|
| **Shift+Click** | Hold Shift and click additional nodes to add them to the selection |
| **Box select** | Drag on the canvas to draw a selection rectangle |
| **Select All** | Press `Ctrl+A` to select every node and edge |

Box selection uses **partial mode**: any node whose boundary touches the selection rectangle is included, even if the node is not fully enclosed.

### Deselecting

Click on an empty area of the canvas to deselect all selected elements.

---

## Double-Click on Empty Canvas

Double-clicking on an empty area of the canvas creates a new node at that exact position. The node is created with the default shape (rounded rectangle) and immediately enters inline edit mode so you can type a label.

> This is the fastest way to add a quick node without using the Shape Palette.

---

## Right-Click Context Menu (Canvas)

Right-clicking on an empty area of the canvas opens a context menu with the following options:

| Option | Description |
|--------|-------------|
| **Add Node Here** | Creates a new node at the click position |
| **Paste** | Pastes previously copied nodes (disabled if clipboard is empty) |
| **Select All** | Selects every node and edge on the canvas |
| **Fit View** | Zooms and pans to show all content |
| **Insert Swimlanes** | Opens the swimlane configuration panel |

---

## Keyboard Shortcuts for Canvas Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Select all nodes and edges |
| `Scroll wheel` | Zoom in/out |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` or `Ctrl+Y` | Redo |
| `Delete` or `Backspace` | Delete selected elements |
| `Escape` | Deselect all / close menus |

For a complete shortcut reference, see the Keyboard Shortcuts dialog accessible from the toolbar.
