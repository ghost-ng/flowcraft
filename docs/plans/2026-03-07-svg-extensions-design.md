# SVG Extensions Framework Design

**Date:** 2026-03-07
**Status:** Approved

## Overview

Add an SVG extensions framework that lets users drag custom SVG artwork onto the canvas as first-class nodes. Ships with 3 built-in packs (Network/Infrastructure, UX/Wireframe, People & Teams) and supports user-imported packs via ZIP upload.

## Decisions

| Question | Answer |
|----------|--------|
| How do users add packs? | Hybrid: built-in packs ship with app + user imports custom ZIPs |
| Label positioning | Per-node: `above`, `below`, `overlay`. Default `below` for extensions, `overlay` for standard shapes |
| SVG coloring | Recolorable: fill/stroke attributes replaced with user's chosen colors |
| Built-in packs | Network/Infrastructure, UX/Wireframe, People & Teams |
| Architecture | Dedicated `ExtensionNode` type (Approach A) — separate from GenericShapeNode |

## Data Model

### Extension Pack
```typescript
interface ExtensionPack {
  id: string;              // e.g. 'network-infra'
  name: string;            // 'Network & Infrastructure'
  icon: string;            // SVG string for pack icon
  builtIn: boolean;        // true = bundled, false = user-imported
  items: ExtensionItem[];
}

interface ExtensionItem {
  id: string;              // e.g. 'router'
  name: string;            // 'Router' (default label)
  svgContent: string;      // Raw SVG markup (sanitized)
  viewBox: string;         // e.g. '0 0 64 64'
  defaultWidth: number;
  defaultHeight: number;
  tags?: string[];
}
```

### Node Data Extensions
New optional fields on `FlowNodeData`:
- `extensionPackId?: string`
- `extensionItemId?: string`
- `svgContent?: string` (embedded SVG for export portability)
- `labelPosition?: 'above' | 'below' | 'overlay'`

### Zustand Store (`extensionStore.ts`)
```
State:
  packs: ExtensionPack[]
  pinnedPackIds: string[]

Actions:
  loadBuiltInPacks()
  importPack(files: FileList) -> parse ZIP -> sanitize SVGs -> add to packs
  removePack(id: string)
  pinPack(id: string) / unpinPack(id: string)
```

Persistence: `pinnedPackIds` and user-imported packs saved to localStorage.

## UI Flow

### Extensions Button (Left Palette)
- Puzzle icon below existing shape/connector sections
- Click opens popover listing all packs (built-in + imported)
- Each pack row: icon, name, item count, pin indicator
- Right-click pack -> toggle pin (pinned = visible in left palette)
- Right-click imported pack -> also shows "Remove"
- "Import Pack..." button at bottom -> file picker for .zip

### Pinned Packs in Left Palette
- Collapsible sections below Extensions button
- Pack name as header with icon
- Grid of ~40x40 SVG thumbnails, draggable
- Drag MIME: `application/charthero-extension` with JSON `{ packId, itemId }`

### ExtensionNode Component
- Registered in `nodeTypes` alongside `shapeNode`, `groupNode`, `endpointNode`
- Renders: SVG art area (recolored) + external label (above/below/overlay)
- Supports: resize, selection ring, rotation, flip, opacity, connection handles (4 sides)
- Label inherits all font controls from properties panel

### SVG Recoloring
- `recolorSvg(svgContent, fillColor, strokeColor)` utility
- Finds `fill` and `stroke` attributes on shape elements (path, rect, circle, polygon, ellipse, line)
- Replaces with user colors; `fill="none"` and `stroke="none"` left untouched
- Applied at render time

### Properties Panel
- Extension nodes show: Block (size, opacity, rotation), Body Style (fill, border), Label (text, color, font, position dropdown)
- Label Position dropdown available for ALL node types (default: overlay for standard, below for extension)
- Shape selector hidden for extension nodes

## Export/Import

### JSON
- Extension nodes export with `type: 'extensionNode'` and `data.svgContent` embedded
- Self-contained: diagrams open without the pack installed
- Import detects `type: 'extensionNode'`, creates node from embedded SVG

### Other Formats (PNG/SVG/PDF/PPTX)
- Extension nodes render their SVG inline — no special handling needed beyond what the renderer already does

## File Structure

```
src/extensions/
  extensionStore.ts          # Zustand store
  ExtensionNode.tsx           # Node renderer
  recolorSvg.ts              # SVG fill/stroke replacement
  parseSvgPack.ts            # ZIP parser (uses jszip, already a dependency)
  packs/
    index.ts                 # Registry
    networkInfra.ts          # Built-in: routers, servers, firewalls, etc.
    uxWireframe.ts           # Built-in: buttons, inputs, frames, etc.
    peopleTeams.ts           # Built-in: person, team, org figures, etc.
```

## Files Changed

| File | Change |
|------|--------|
| `src/extensions/*` | New: store, node component, utilities, built-in packs |
| `FlowCanvas.tsx` | Add `extensionNode` to nodeTypes. Handle extension drop. |
| `ShapePalette.tsx` | Extensions button + popover. Pinned pack grids. |
| `PropertiesPanel.tsx` | Label Position dropdown. Hide shape selector for extensions. |
| `flowStore.ts` | Add `labelPosition`, `extensionPackId`, `extensionItemId`, `svgContent` to FlowNodeData |
| `exportUtils.ts` | Handle extensionNode in all export/import formats |
| `GenericShapeNode.tsx` | Support `labelPosition` for standard shapes too |
| `vite.config.ts` | Add `extensions` manual chunk |

## User-Imported Pack Format

ZIP containing SVG files + optional `manifest.json`:
```json
{
  "name": "My Custom Pack",
  "icon": "<svg>...</svg>",
  "items": [
    { "id": "widget", "name": "Widget", "file": "widget.svg" }
  ]
}
```

Without manifest: pack name = zip filename, item names = SVG filenames.
All SVGs sanitized via DOMPurify before storage.
