# Theme Resolver System Design

## Problem

The current style system has significant gaps:

- New nodes get hardcoded `shapeColors` — the active diagram style's `nodeDefaults` is ignored at creation time.
- No "reset to theme" capability anywhere in the UI.
- Canvas background has no user override — locked to the diagram style or hardcoded dark mode color.
- Context menus only offer palette-based color swatches with no theme awareness.
- Styles don't define per-shape color defaults.
- Applying a style stamps values onto node data, making it impossible to distinguish user customizations from theme defaults.

## Approach: Theme as Live Resolver (Option A)

The active theme acts as a runtime fallback resolver. Node/edge data stays sparse — only user-overridden values are stored. At render time, missing properties resolve through a chain: `explicit user value → theme default → hardcoded fallback`. "Reset to theme" simply clears the explicit value.

---

## 1. Data Model Changes

### DiagramStyle type — new `shapeColors` field

Add to `DiagramStyle` in `src/styles/types.ts`:

```ts
shapeColors: Record<string, string>;  // shape name → fill color
```

Each of the 24 style files defines an explicit color for every shape (~14 shapes: rectangle, roundedRectangle, diamond, circle, parallelogram, hexagon, document, cloud, stickyNote, textbox, blockArrow, chevronArrow, doubleArrow, circularArrow). Fallback to `nodeDefaults.fill` if a shape isn't in the map.

### DiagramStyle type — new `defaultPaletteId` field

```ts
defaultPaletteId?: string;  // auto-selected palette when this theme activates
```

### styleStore — new `canvasColorOverride`

```ts
canvasColorOverride: string | null;  // user-set canvas color, null = use theme
```

When non-null, the canvas uses this color instead of the theme's `canvas.background`. Cleared on theme switch or "Reset to Theme."

### styleStore — nullable `activeStyleId`

`activeStyleId` changes from `string` to `string | null`. When `null`, no theme is active — the app uses hardcoded `shapeColors` defaults (today's behavior). The reset button sets this to `null`.

### Node/edge data stays sparse

No changes to `FlowNodeData` or `FlowEdgeData`. Properties matching the theme default are not stored. Only user overrides are stored.

---

## 2. Theme Resolver Function

A single pure utility at `src/utils/themeResolver.ts`.

### `resolveNodeStyle(nodeData, shape, activeStyle) → ResolvedNodeStyle`

Resolution chains:

| Property | Priority 1 (user) | Priority 2 (theme shape) | Priority 3 (theme default) | Priority 4 (hardcoded) |
|----------|-------------------|--------------------------|---------------------------|----------------------|
| fill color | `nodeData.color` | `activeStyle.shapeColors[shape]` | `activeStyle.nodeDefaults.fill` | `shapeColors[shape]` or `'#3b82f6'` |
| border color | `nodeData.borderColor` | — | `activeStyle.nodeDefaults.stroke` | `darkenColor(resolvedFill)` |
| font family | `nodeData.fontFamily` | — | `activeStyle.nodeDefaults.fontFamily` | `'Inter, sans-serif'` |
| font size | `nodeData.fontSize` | — | `activeStyle.nodeDefaults.fontSize` | `14` |
| font weight | `nodeData.fontWeight` | — | `activeStyle.nodeDefaults.fontWeight` | `500` |
| text color | `nodeData.textColor` | — | `ensureReadableText(fill, activeStyle.nodeDefaults.fontColor)` | `'#ffffff'` |

### `resolveEdgeStyle(edgeData, activeStyle) → ResolvedEdgeStyle`

| Property | Priority 1 (user) | Priority 2 (theme) | Priority 3 (hardcoded) |
|----------|-------------------|---------------------|----------------------|
| stroke color | `edgeData.color` | `activeStyle.edgeDefaults.stroke` | `'#94a3b8'` |
| stroke width | `edgeData.thickness` | `activeStyle.edgeDefaults.strokeWidth` | `2` |

### Where called

- `GenericShapeNode.tsx` — replaces inline fallback chain
- All edge components — replaces inline defaults
- `FlowCanvas.tsx` node creation — new nodes get zero style data
- Properties Panel — shows resolved values with "inherited vs user-set" indicator

### "No theme" mode

When `activeStyleId = null`, resolver skips theme steps, uses hardcoded `shapeColors` map.

---

## 3. UI Changes

### 3a. Style Picker — Reset Button

Top-right of "Diagram Style" header: small `X` icon button.

Action:
- Sets `activeStyleId = null`
- Clears `canvasColorOverride`
- Clears all style properties from existing nodes (`color`, `borderColor`, `textColor`, `fontFamily`, `fontSize`, `fontWeight` → `undefined`)
- Clears edge colors
- No style card highlighted

### 3b. Theme auto-selects palette

When theme has `defaultPaletteId`, that palette auto-activates on theme selection.

### 3c. Canvas Context Menu — Color Options

New submenu after "Fit View" in `CanvasContextMenu.tsx`:

| Menu Item | Action |
|-----------|--------|
| Canvas Color → Reset to Default | `canvasColorOverride = null` |
| Canvas Color → Reset to Theme | `canvasColorOverride = null` |
| Canvas Color → Custom Color... | Opens color picker, sets `canvasColorOverride` |

Canvas background resolution:
```
canvasColorOverride ?? (darkMode ? '#1e2d3d' : activeStyle?.canvas.background ?? '#ffffff')
```

### 3d. Node Context Menu — "Reset to Theme"

New item in `NodeContextMenu.tsx` (after "Edit Label"). Clears `color`, `borderColor`, `textColor`, `fontFamily`, `fontSize`, `fontWeight` from node data. Only shown when `activeStyleId !== null`. Same item in `SelectionContextMenu.tsx` for multi-select.

### 3e. Edge Context Menu — "Reset to Theme"

Same pattern: clears `color` and `thickness` from edge data.

### 3f. Properties Panel — Per-Property Reset Icons

Each style property field gets a small `RotateCcw` icon button, shown only when value differs from theme default. Clicking sets property to `undefined`. When inherited from theme, color picker shows resolved value with dashed border or "Theme" badge.

---

## 4. Behavior

### Theme selection

1. `activeStyleId` set to new ID
2. `canvasColorOverride` cleared
3. All node style properties cleared → resolver picks up new theme
4. All edge style properties cleared
5. If theme has `defaultPaletteId`, palette auto-activates
6. If theme has `dark: true`, dark mode auto-enables

### New node creation

No style data stored. Only `label` and `shape`. Resolver handles everything. Exception: textbox keeps `color: 'transparent'`.

### New edge creation

No style data stored. Resolver handles color/thickness.

### User manual override

Explicit value written to node/edge data (priority 1 in resolver).

### Theme deselection (reset button)

`activeStyleId → null`. Node data stays sparse. Resolver falls through to hardcoded `shapeColors`. Canvas goes white.

### JSON export/import

Export includes `activeStyleId` and `canvasColorOverride`. Node data remains sparse — only user overrides exported. Resolver handles the rest on load.

---

## Files Changed (Summary)

| File | Change |
|------|--------|
| `src/styles/types.ts` | Add `shapeColors`, `defaultPaletteId` to `DiagramStyle` |
| `src/styles/diagramStyles/*.ts` (24 files) | Add `shapeColors` map to each |
| `src/store/styleStore.ts` | Nullable `activeStyleId`, add `canvasColorOverride` |
| `src/utils/themeResolver.ts` | New file — resolver functions |
| `src/components/Canvas/GenericShapeNode.tsx` | Use resolver instead of inline chain |
| `src/components/Edges/*.tsx` | Use resolver for edge defaults |
| `src/components/Canvas/FlowCanvas.tsx` | Sparse node creation, canvas bg resolution |
| `src/components/StylePicker/DiagramStylePicker.tsx` | Reset button, clear node data on theme switch |
| `src/components/ContextMenu/CanvasContextMenu.tsx` | Canvas color submenu |
| `src/components/ContextMenu/NodeContextMenu.tsx` | "Reset to Theme" item |
| `src/components/ContextMenu/EdgeContextMenu.tsx` | "Reset to Theme" item |
| `src/components/ContextMenu/SelectionContextMenu.tsx` | "Reset to Theme" item |
| `src/components/Panels/PropertiesPanel.tsx` | Per-property reset icons + theme badge |
| `src/utils/exportUtils.ts` | Export/import `canvasColorOverride` |
| `guides/` | Documentation updates |
