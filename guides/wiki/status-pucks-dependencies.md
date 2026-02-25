# Status Pucks & Dependencies

Chart Hero has two powerful systems for tracking project state: **Status Pucks** (visual badges on nodes) and **Dependencies** (relationship tracking between nodes). Together they turn a static diagram into a living project tracker.

---

## Status Pucks

Status pucks are small colored indicator badges that appear on node corners. Each node can have **multiple** pucks simultaneously, letting you track several dimensions of status on a single node.

![Status Pucks on Nodes](../../assets/wiki-status-pucks.png)

### Adding Pucks

There are three ways to add a status puck to a node:

1. **Properties Panel** -- Select a node, open the Node tab, expand the Status Pucks section, and click the **+** button.
2. **Context Menu** -- Right-click a node and choose **Add Status**. A submenu lists the five status types and you can pick one to add immediately.

![Add Status Context Menu](../../assets/wiki-add-status-menu.png)
3. **AI Assistant** -- Describe what you need in natural language, for example: `"Add an in-progress status puck to the Build node"`.

### Puck Properties

Every puck exposes the following configurable properties in the Properties Panel.

| Property | Options | Default | Description |
|----------|---------|---------|-------------|
| Status | Not Started, In Progress, Completed, Blocked, Review | Not Started | Status type (auto-sets default color) |
| Color | Any hex color | Depends on status (see below) | Puck fill color |
| Size | 8 -- 20 px (1 px steps) | 12 px | Puck diameter |
| Position | Top-Left, Top-Right, Bottom-Left, Bottom-Right | Top-Right | Corner placement on the node |
| Icon | Default (Auto), Blank, Checkmark, Clock, X Mark, Eye, Warning, Star, Heart, Flag, Lightning, Thumbs Up, Thumbs Down, Circle, Square, Bell, Bookmark, Pin | Default (Auto) | Icon rendered inside the puck |
| Border Color | Any hex color | `#000000` | Puck outline color |
| Border Width | 0 -- 4 px (0.5 px steps) | 1 px | Outline thickness |
| Border Style | Solid, Dashed, Dotted, None | Solid | Outline style |

### Default Status Colors

When you add or change a puck status, Chart Hero automatically applies a default color. You can override this with any hex color afterward.

| Status | Default Color | Hex |
|--------|--------------|-----|
| Not Started | Gray | `#94a3b8` |
| In Progress | Blue | `#3b82f6` |
| Completed | Green | `#10b981` |
| Blocked | Red | `#ef4444` |
| Review | Amber | `#f59e0b` |

### Multi-Puck Editing

When a node has multiple pucks, the Properties Panel shows each puck as a small colored chip. Selecting chips lets you edit one or many at once.

- **Click a chip** to select that puck for editing. The property fields below update to show its current values.
- **Shift+click a chip** to add it to the current selection without deselecting others.
- **Select All on Node** button selects every puck on the currently selected node.
- **Select All (Global)** button selects all matching pucks across every node in the diagram.
- When multiple pucks are selected, any property change applies to **all** of them simultaneously. This is the fastest way to recolor or resize a batch of pucks.

### Puck Interactions on the Canvas

You can also interact with pucks directly on the canvas without opening the Properties Panel.

- **Click a puck** -- Selects the puck (deselects any selected nodes or edges).
- **Shift+click a puck** -- Adds the puck to the current selection.
- **Drag a puck** -- Moves the puck to snap to a different corner of its parent node.
- **Ctrl+drag a puck** -- Resizes the puck by dragging.
- **Right-click a puck** -- Opens a context menu with bulk selection options:
  - On this node (all pucks on the same node)
  - Same color (all pucks with matching fill color)
  - Same outline (all pucks with matching border)
  - All pucks (every puck in the diagram)

> **Tip:** When multiple pucks share the same corner, they automatically offset horizontally so they remain visible.

---

## Dependencies

Dependencies create directed relationships between nodes, enabling you to track workflows, blockers, and prerequisites within your diagram.

### Creating Dependencies

Dependencies are created by connecting nodes with edges. You can also use the **AI Assistant** with natural language, for example: `"Add a depends-on relationship from Deploy to Build"`.

### Dependency Badges

![Dependency Badges](../../assets/wiki-dependency-badges.png)

Toggle with the **GitBranch** icon in the View group of the toolbar. When enabled, every node that participates in a dependency shows two small counters:

- **In-count** -- The number of upstream dependencies (edges coming in).
- **Out-count** -- The number of downstream dependents (edges going out).

### Dependencies Tab (Properties Panel)

When a node is selected, the **DEPS** tab in the Properties Panel shows the dependency relationships for that node:

- **Critical Path Analysis** -- Toggle to highlight the longest dependency chain in the diagram. The critical path is shown in red (default `#e53e3e`).
- **Upstream -- Prerequisites** -- Nodes that this node depends on.
- **Downstream -- Enables** -- Nodes that depend on the selected node.

### Data Tab -- Relationship Information

When a node is selected, the **Data** tab in the Properties Panel shows three relationship lists:

- **Connected To** -- All nodes connected to this node by any edge. Displays the count in parentheses.
- **Upstream -- Prerequisites** -- Nodes that this node depends on (blue highlighting).
- **Downstream -- Enables** -- Nodes that depend on the selected node (amber highlighting).
