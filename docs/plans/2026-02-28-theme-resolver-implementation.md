# Theme Resolver System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the stamp-based style system with a live theme resolver where node/edge data stays sparse and missing properties resolve at render time through `user override → theme shape → theme default → hardcoded fallback`.

**Architecture:** A pure `resolveNodeStyle()` / `resolveEdgeStyle()` utility resolves styling at render time. Nodes store zero style data by default. The active theme provides per-shape colors and font defaults. "Reset to theme" simply deletes the overridden property from node data, and the resolver fills it from the theme.

**Tech Stack:** React 19, TypeScript, Zustand v5, Tailwind CSS 4, @xyflow/react v12, chroma-js, lucide-react

**Design doc:** `docs/plans/2026-02-28-theme-resolver-design.md`

---

## Task 1: Add `shapeColors` and `defaultPaletteId` to DiagramStyle type

**Files:**
- Modify: `src/styles/types.ts:1-29`

**Step 1: Add new fields to `DiagramStyle`**

In `src/styles/types.ts`, add two fields before the closing brace of `DiagramStyle`:

```ts
export interface DiagramStyle {
  id: string;
  displayName: string;
  canvas: {
    background: string;
    gridColor: string;
    gridStyle: 'dots' | 'lines' | 'cross' | 'none';
  };
  nodeDefaults: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius: number;
    shadow: string;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    fontWeight: number;
  };
  edgeDefaults: {
    stroke: string;
    strokeWidth: number;
    type: string;
    animated: boolean;
    arrowType: string;
  };
  accentColors: string[];
  dark?: boolean;
  /** Per-shape fill colors — shape name → hex color */
  shapeColors: Record<string, string>;
  /** Palette auto-selected when this theme activates */
  defaultPaletteId?: string;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Type errors in all 24 style files (missing `shapeColors` property). This confirms the type is correctly required.

**Step 3: Commit**

```bash
git add src/styles/types.ts
git commit -m "feat: add shapeColors and defaultPaletteId to DiagramStyle type"
```

---

## Task 2: Add `shapeColors` map to all 24 diagram style files

**Files:**
- Modify: all 24 files in `src/styles/diagramStyles/*.ts` (not `index.ts`)

Each style file needs a `shapeColors` map with 14 entries. The colors should be thematically appropriate to each style. Use the style's `nodeDefaults.fill` as the base for most shapes, with accent colors from `accentColors` for decision shapes (diamond), data shapes (parallelogram, document), connector shapes (arrows), and special shapes (cloud, circle).

**Step 1: Add shapeColors to each style file**

For each of the 24 style files, add a `shapeColors` property. The pattern is:

```ts
shapeColors: {
  rectangle: '<fill or accent>',
  roundedRectangle: '<fill or accent>',
  diamond: '<accent for decisions>',
  circle: '<accent for start/end>',
  parallelogram: '<accent for I/O>',
  hexagon: '<accent for preparation>',
  document: '<accent for documents>',
  cloud: '<accent for cloud/external>',
  stickyNote: '<warm yellow>',
  textbox: 'transparent',
  blockArrow: '<fill or accent>',
  chevronArrow: '<accent>',
  doubleArrow: '<accent>',
  circularArrow: '<accent>',
},
```

**Guidelines per style family:**

- **Light styles with white fill** (cleanMinimal, corporateProfessional, wireframe, zincModern, paperPrint, notebook, gradientCards): Use the style's `accentColors` array to differentiate shapes — rectangles get the primary accent, diamonds get the second, etc. Keep `nodeDefaults.fill` for rectangle/roundedRectangle if the style is "white fill" oriented.
- **Colored fill styles** (pastelSoft, flatMaterial, infographicBold, colorfulGradient, softGradient): Use the `nodeDefaults.fill` as base, `accentColors` for variation.
- **Dark styles** (blueprint, neonDark, retroTerminal, militaryC2, darkNeonGlow, glassMorphism, midnightLuxe, auroraBorealis, cyberC2): Use the style's border/accent colors since dark themes often have transparent or dark fills.
- **Sketch styles** (whiteboardSketch, watercolor, monochromeInk): Match the hand-drawn/artistic feel.

Also optionally add `defaultPaletteId` to styles that have a natural palette match (e.g. `militaryC2` → `'military'`, `cyberC2` → `'cyber'`, `midnightLuxe` → `'midnightAurora'`, `auroraBorealis` → `'midnightAurora'`).

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS — all style files now satisfy the updated `DiagramStyle` type.

**Step 3: Commit**

```bash
git add src/styles/diagramStyles/
git commit -m "feat: add shapeColors maps to all 24 diagram styles"
```

---

## Task 3: Update styleStore — nullable `activeStyleId` + `canvasColorOverride`

**Files:**
- Modify: `src/store/styleStore.ts:38-98`

**Step 1: Update the `StyleState` interface**

Change `activeStyleId` from `string` to `string | null`, add `canvasColorOverride`, and add new actions:

```ts
export interface StyleState {
  // ---- state --------------------------------------------------
  activeStyleId: string | null;
  activePaletteId: string;
  darkMode: boolean;
  userPresets: StylePreset[];
  autoColorMode: AutoColorMode;
  customFont: string | null;
  canvasColorOverride: string | null;

  // ---- actions ------------------------------------------------
  setStyle: (styleId: string) => void;
  clearStyle: () => void;
  setPalette: (paletteId: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  addPreset: (preset: StylePreset) => void;
  removePreset: (presetId: string) => void;
  updatePreset: (presetId: string, patch: Partial<Omit<StylePreset, 'id'>>) => void;
  setAutoColorMode: (mode: AutoColorMode) => void;
  setCustomFont: (font: string | null) => void;
  setCanvasColorOverride: (color: string | null) => void;
}
```

**Step 2: Update the store implementation**

Add initial state and action implementations:

```ts
export const useStyleStore = create<StyleState>()((set) => ({
  // -- initial state --------------------------------------------
  activeStyleId: 'cleanMinimal',
  activePaletteId: 'ocean',
  darkMode: false,
  userPresets: [],
  autoColorMode: 'manual',
  customFont: null,
  canvasColorOverride: null,

  // -- actions --------------------------------------------------
  setStyle: (styleId) => set({ activeStyleId: styleId, canvasColorOverride: null }),

  clearStyle: () => set({ activeStyleId: null, canvasColorOverride: null }),

  setPalette: (paletteId) => set({ activePaletteId: paletteId }),

  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setDarkMode: (dark) => set({ darkMode: dark }),

  addPreset: (preset) =>
    set((s) => ({ userPresets: [...s.userPresets, preset] })),

  removePreset: (presetId) =>
    set((s) => ({
      userPresets: s.userPresets.filter((p) => p.id !== presetId),
    })),

  updatePreset: (presetId, patch) =>
    set((s) => ({
      userPresets: s.userPresets.map((p) =>
        p.id === presetId ? { ...p, ...patch } : p,
      ),
    })),

  setAutoColorMode: (mode) => set({ autoColorMode: mode }),

  setCustomFont: (font) => set({ customFont: font }),

  setCanvasColorOverride: (color) => set({ canvasColorOverride: color }),
}));
```

Note: `setStyle` now also clears `canvasColorOverride` so switching themes resets any custom canvas color.

**Step 3: Verify build**

Run: `npm run build`
Expected: May have type errors in files that use `activeStyleId` as a guaranteed `string`. Fix those in later tasks.

**Step 4: Commit**

```bash
git add src/store/styleStore.ts
git commit -m "feat: nullable activeStyleId, add canvasColorOverride to styleStore"
```

---

## Task 4: Create `themeResolver.ts` utility

**Files:**
- Create: `src/utils/themeResolver.ts`

**Step 1: Create the resolver file**

```ts
import type { DiagramStyle } from '../styles/types';
import type { FlowNodeData } from '../store/flowStore';
import { darkenColor, ensureReadableText } from './colorUtils';

// ---------------------------------------------------------------------------
// Hardcoded shape colors — used when no theme is active
// ---------------------------------------------------------------------------

export const HARDCODED_SHAPE_COLORS: Record<string, string> = {
  rectangle: '#3b82f6',
  roundedRectangle: '#3b82f6',
  diamond: '#f59e0b',
  circle: '#10b981',
  parallelogram: '#8b5cf6',
  hexagon: '#ef4444',
  document: '#ec4899',
  cloud: '#6366f1',
  stickyNote: '#fbbf24',
  textbox: 'transparent',
  blockArrow: '#3b82f6',
  chevronArrow: '#8b5cf6',
  doubleArrow: '#f59e0b',
  circularArrow: '#10b981',
};

// ---------------------------------------------------------------------------
// Resolved types
// ---------------------------------------------------------------------------

export interface ResolvedNodeStyle {
  fill: string;
  borderColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}

export interface ResolvedEdgeStyle {
  stroke: string;
  strokeWidth: number;
}

// ---------------------------------------------------------------------------
// Node resolver
// ---------------------------------------------------------------------------

export function resolveNodeStyle(
  nodeData: Partial<FlowNodeData>,
  shape: string,
  activeStyle: DiagramStyle | null,
): ResolvedNodeStyle {
  // 1. Fill color: user → theme shape → theme default → hardcoded
  const fill =
    nodeData.color
    || activeStyle?.shapeColors?.[shape]
    || activeStyle?.nodeDefaults.fill
    || HARDCODED_SHAPE_COLORS[shape]
    || '#3b82f6';

  // 2. Border color: user → theme default → darken(fill)
  const borderColor =
    nodeData.borderColor
    || activeStyle?.nodeDefaults.stroke
    || darkenColor(fill, 0.25);

  // 3. Font family: user → theme default → hardcoded
  const fontFamily =
    nodeData.fontFamily
    || activeStyle?.nodeDefaults.fontFamily
    || "'Inter', 'Segoe UI', sans-serif";

  // 4. Font size: user → theme default → 14
  const fontSize =
    nodeData.fontSize
    || activeStyle?.nodeDefaults.fontSize
    || 14;

  // 5. Font weight: user → theme default → 500
  const fontWeight =
    nodeData.fontWeight
    || activeStyle?.nodeDefaults.fontWeight
    || 500;

  // 6. Text color: user → ensureReadable(fill, theme fontColor) → '#ffffff'
  const isTransparentFill = !fill || fill === 'transparent' || fill === 'none';
  const themeFontColor = activeStyle?.nodeDefaults.fontColor;
  let textColor: string;
  if (nodeData.textColor) {
    textColor = nodeData.textColor;
  } else if (isTransparentFill) {
    textColor = themeFontColor || '#1e293b';
  } else if (themeFontColor) {
    textColor = ensureReadableText(fill, themeFontColor);
  } else {
    textColor = '#ffffff';
  }

  return { fill, borderColor, textColor, fontFamily, fontSize, fontWeight };
}

// ---------------------------------------------------------------------------
// Edge resolver
// ---------------------------------------------------------------------------

export function resolveEdgeStyle(
  edgeData: Record<string, unknown>,
  activeStyle: DiagramStyle | null,
): ResolvedEdgeStyle {
  const stroke =
    (edgeData.color as string | undefined)
    || activeStyle?.edgeDefaults.stroke
    || '#94a3b8';

  const strokeWidth =
    (edgeData.thickness as number | undefined)
    || activeStyle?.edgeDefaults.strokeWidth
    || 2;

  return { stroke, strokeWidth };
}

// ---------------------------------------------------------------------------
// Canvas background resolver
// ---------------------------------------------------------------------------

export function resolveCanvasBackground(
  canvasColorOverride: string | null,
  darkMode: boolean,
  activeStyle: DiagramStyle | null,
): string {
  if (canvasColorOverride) return canvasColorOverride;
  if (darkMode && !activeStyle) return '#1e2d3d';
  return activeStyle?.canvas.background ?? '#ffffff';
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS — file is standalone with no consumers yet.

**Step 3: Commit**

```bash
git add src/utils/themeResolver.ts
git commit -m "feat: create themeResolver utility with node, edge, and canvas resolvers"
```

---

## Task 5: Wire resolver into `GenericShapeNode.tsx`

**Files:**
- Modify: `src/components/Canvas/GenericShapeNode.tsx:1-11` (imports), `108-123` (delete old shapeColors), `564-574` (replace inline fallback chain)

**Step 1: Add resolver import**

Add to the imports section (around line 9):

```ts
import { resolveNodeStyle, HARDCODED_SHAPE_COLORS } from '../../utils/themeResolver';
import { useStyleStore } from '../../store/styleStore';
import { diagramStyles } from '../../styles/diagramStyles';
```

**Step 2: Remove the module-level `shapeColors` constant**

Delete lines 108-123 (the `const shapeColors: Record<string, string> = { ... }` block). The resolver's `HARDCODED_SHAPE_COLORS` export replaces it.

**Step 3: Update the component to use the resolver**

Inside the `GenericShapeNode` component (around line 543), add a store subscription and replace the inline chain:

```ts
const activeStyleId = useStyleStore((s) => s.activeStyleId);
const activeStyle = activeStyleId ? diagramStyles[activeStyleId] ?? null : null;
```

Replace lines 564-574 (the fillColor/borderColor/textColor computation):

```ts
const shape = nodeData.shape || 'rectangle';
const isIconOnly = !!nodeData.iconOnly;

// Resolve styling via the theme resolver
const resolved = resolveNodeStyle(nodeData, shape, activeStyle);
const fillColor = isIconOnly ? 'transparent' : resolved.fill;
const borderColor = isIconOnly ? 'transparent' : resolved.borderColor;
const isTransparentFill = !fillColor || fillColor === 'transparent' || fillColor === 'none';
const textColor = isIconOnly
  ? (nodeData.textColor || '#475569')
  : (!isTransparentFill ? ensureReadableText(fillColor, resolved.textColor) : resolved.textColor);
const fontSize = resolved.fontSize;
```

Also update any remaining references to the old `shapeColors` map in this file to use `HARDCODED_SHAPE_COLORS`.

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS — all node rendering now goes through the resolver.

**Step 5: Commit**

```bash
git add src/components/Canvas/GenericShapeNode.tsx
git commit -m "feat: wire theme resolver into GenericShapeNode"
```

---

## Task 6: Wire resolver into edge components

**Files:**
- Modify: edge component files in `src/components/Edges/`

**Step 1: Identify all edge components**

Check `src/components/Edges/index.ts` for the list of edge components. Each edge component that reads `data.color` or applies a default stroke color needs to use `resolveEdgeStyle`.

**Step 2: Update each edge component**

For each edge component, add imports and use the resolver:

```ts
import { resolveEdgeStyle } from '../../utils/themeResolver';
import { useStyleStore } from '../../store/styleStore';
import { diagramStyles } from '../../styles/diagramStyles';
```

Inside the component, replace inline color logic:

```ts
const activeStyleId = useStyleStore((s) => s.activeStyleId);
const activeStyle = activeStyleId ? diagramStyles[activeStyleId] ?? null : null;
const resolved = resolveEdgeStyle(data ?? {}, activeStyle);
// Use resolved.stroke and resolved.strokeWidth instead of data.color / data.thickness with hardcoded fallbacks
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/Edges/
git commit -m "feat: wire theme resolver into edge components"
```

---

## Task 7: Sparse node creation in FlowCanvas.tsx + canvas background

**Files:**
- Modify: `src/components/Canvas/FlowCanvas.tsx:357-389` (createNodeAtPosition), `1163` (canvas bg), `1246` (grid color), `1257` (minimap bg)

**Step 1: Add imports**

```ts
import { resolveCanvasBackground } from '../../utils/themeResolver';
```

**Step 2: Make node creation sparse**

In `createNodeAtPosition` (line 357-389), remove all style data from new nodes. Only keep `label` and `shape`. Exception: textbox keeps `color: 'transparent'`, `borderColor: 'transparent'`, `borderWidth: 0`:

```ts
const createNodeAtPosition = useCallback(
  (x: number, y: number, shapeType: string = 'rectangle') => {
    const position = screenToFlowPosition({ x, y });
    const data: Record<string, unknown> = {
      label: shapeType === 'textbox' ? 'Text' : 'New Node',
      shape: shapeType as FlowNodeData['shape'],
    };
    // Textbox: transparent fill, no border
    if (shapeType === 'textbox') {
      data.color = 'transparent';
      data.borderColor = 'transparent';
      data.borderWidth = 0;
    }
    const newNode: FlowNode = {
      id: nextId(),
      type: 'shapeNode',
      position,
      data: data as FlowNodeData,
    };
    addNode(newNode);
    assignSwimlaneToNode(newNode.id, position);
    useFlowStore.getState().setSelectedNodes([newNode.id]);
    return newNode.id;
  },
  [screenToFlowPosition, addNode],
);
```

Note: Removed the textColor canvas-bg heuristic from textbox — the resolver handles text contrast.

**Step 3: Update canvas background**

Add `canvasColorOverride` subscription:

```ts
const canvasColorOverride = useStyleStore((s) => s.canvasColorOverride);
```

Replace the inline background color at line 1163:

```ts
style={{ backgroundColor: resolveCanvasBackground(canvasColorOverride, darkMode, activeStyle) }}
```

Also update the minimap background at line 1257:

```ts
style={{ backgroundColor: resolveCanvasBackground(canvasColorOverride, darkMode, activeStyle) }}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Canvas/FlowCanvas.tsx
git commit -m "feat: sparse node creation and resolver-based canvas background"
```

---

## Task 8: Update DiagramStylePicker — theme switch clears node data + reset button

**Files:**
- Modify: `src/components/StylePicker/DiagramStylePicker.tsx:1-287`

**Step 1: Update handleSetStyle to clear node data instead of stamping**

Replace the current `handleSetStyle` (which stamps values onto nodes) with one that clears all style properties:

```ts
const handleSetStyle = useCallback(
  (id: string) => {
    setStyle(id);
    const style = diagramStyles[id];

    // Clear all node style properties — resolver picks up new theme
    const { nodes, updateNodeData } = useFlowStore.getState();
    for (const node of nodes) {
      // Preserve textbox transparency
      const isTextbox = (node.data as FlowNodeData).shape === 'textbox';
      updateNodeData(node.id, {
        color: isTextbox ? 'transparent' : undefined,
        borderColor: isTextbox ? 'transparent' : undefined,
        textColor: undefined,
        fontFamily: undefined,
        fontSize: undefined,
        fontWeight: undefined,
      });
    }

    // Clear all edge style properties
    const { edges, updateEdgeData } = useFlowStore.getState();
    for (const edge of edges) {
      updateEdgeData(edge.id, { color: undefined });
    }

    // Auto-select palette if theme defines one
    if (style?.defaultPaletteId) {
      setPalette(style.defaultPaletteId);
    }

    // Auto-enable dark mode for dark themes
    if (style?.dark) {
      useStyleStore.getState().setDarkMode(true);
    }
  },
  [setStyle, setPalette],
);
```

**Step 2: Add the reset button**

Import `X` from lucide-react and `clearStyle` from styleStore:

```ts
import { Check, X } from 'lucide-react';
```

Add store selector:
```ts
const clearStyle = useStyleStore((s) => s.clearStyle);
```

Add the reset handler:

```ts
const handleResetStyle = useCallback(() => {
  clearStyle();

  // Clear all node style properties
  const { nodes, updateNodeData } = useFlowStore.getState();
  for (const node of nodes) {
    const isTextbox = (node.data as FlowNodeData).shape === 'textbox';
    updateNodeData(node.id, {
      color: isTextbox ? 'transparent' : undefined,
      borderColor: isTextbox ? 'transparent' : undefined,
      textColor: undefined,
      fontFamily: undefined,
      fontSize: undefined,
      fontWeight: undefined,
    });
  }

  // Clear all edge style properties
  const { edges, updateEdgeData } = useFlowStore.getState();
  for (const edge of edges) {
    updateEdgeData(edge.id, { color: undefined });
  }
}, [clearStyle]);
```

In the JSX, add the reset button next to the "Diagram Style" header:

```tsx
<div className="px-4 pt-4 pb-1 flex items-center justify-between">
  <h3
    className={`text-xs font-semibold uppercase tracking-wider ${
      darkMode ? 'text-dk-muted' : 'text-slate-500'
    }`}
  >
    Diagram Style
  </h3>
  {activeStyleId && (
    <button
      onClick={handleResetStyle}
      title="Reset to no theme"
      className={`p-1 rounded-md transition-colors cursor-pointer ${
        darkMode
          ? 'hover:bg-dk-hover text-dk-muted hover:text-dk-text'
          : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
      }`}
    >
      <X size={14} />
    </button>
  )}
</div>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/StylePicker/DiagramStylePicker.tsx
git commit -m "feat: theme switch clears node data, add reset-to-no-theme button"
```

---

## Task 9: Canvas context menu — canvas color submenu

**Files:**
- Modify: `src/components/ContextMenu/CanvasContextMenu.tsx`

**Step 1: Add imports**

```ts
import { Paintbrush, RotateCcw } from 'lucide-react';
import { useStyleStore } from '../../store/styleStore';
import { SubMenu } from './menuUtils';
```

**Step 2: Add props for canvas color**

No new props needed — the component will use the store directly.

**Step 3: Add canvas color submenu**

Inside the component, after the "Insert Swimlanes" menu item and divider, add a new "Canvas Color" submenu:

```tsx
<MenuDivider darkMode={darkMode} />

{/* Canvas Color submenu */}
<CanvasColorSubMenu darkMode={darkMode} onClose={onClose} menuRef={menuRef} />
```

Create the `CanvasColorSubMenu` as a small inner component or separate component:

```tsx
const CanvasColorSubMenu: React.FC<{ darkMode: boolean; onClose: () => void; menuRef: React.RefObject<HTMLDivElement | null> }> = ({ darkMode, onClose, menuRef }) => {
  const [showSub, setShowSub] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const canvasColorOverride = useStyleStore((s) => s.canvasColorOverride);
  const setCanvasColorOverride = useStyleStore((s) => s.setCanvasColorOverride);
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={itemRef} onMouseEnter={() => setShowSub(true)} onMouseLeave={() => setShowSub(false)}>
      <MenuItem
        icon={<Paintbrush size={14} />}
        label="Canvas Color"
        onClick={() => setShowSub(!showSub)}
        darkMode={darkMode}
        hasSubmenu
      />
      {showSub && (
        <SubMenu parentRef={menuRef} itemRef={itemRef} darkMode={darkMode}>
          <button
            onClick={() => { setCanvasColorOverride(null); onClose(); }}
            className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded cursor-pointer ${
              darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RotateCcw size={12} />
            Reset to Theme
          </button>
          <div className="px-3 py-1.5">
            <input
              type="color"
              value={canvasColorOverride || '#ffffff'}
              onChange={(e) => setCanvasColorOverride(e.target.value)}
              className="w-full h-8 rounded border border-slate-200 dark:border-dk-border cursor-pointer"
            />
          </div>
        </SubMenu>
      )}
    </div>
  );
};
```

Add `useState` and `useRef` to the imports from React. Add `hasSubmenu` prop support to the local `MenuItem` if not already there (check: CanvasContextMenu's `MenuItem` currently doesn't have `hasSubmenu` — add it).

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/ContextMenu/CanvasContextMenu.tsx
git commit -m "feat: canvas color submenu in canvas context menu"
```

---

## Task 10: Node context menu — "Reset to Theme"

**Files:**
- Modify: `src/components/ContextMenu/NodeContextMenu.tsx`

**Step 1: Add "Reset to Theme" menu item**

Import `RotateCcw` from lucide-react. Add a store selector for `activeStyleId`:

```ts
import { RotateCcw } from 'lucide-react';  // add to existing import
const activeStyleId = useStyleStore((s) => s.activeStyleId);
```

Add a handler that clears all style properties from the node:

```ts
const handleResetToTheme = useCallback(() => {
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
  const isTextbox = (node?.data as FlowNodeData | undefined)?.shape === 'textbox';
  useFlowStore.getState().updateNodeData(nodeId, {
    color: isTextbox ? 'transparent' : undefined,
    borderColor: isTextbox ? 'transparent' : undefined,
    textColor: undefined,
    fontFamily: undefined,
    fontSize: undefined,
    fontWeight: undefined,
  });
  onClose();
}, [nodeId, onClose]);
```

In the JSX, add the menu item after "Edit Label" (only visible when a theme is active):

```tsx
{activeStyleId && (
  <>
    <MenuDivider darkMode={darkMode} />
    <MenuItem
      icon={<RotateCcw size={14} />}
      label="Reset to Theme"
      onClick={handleResetToTheme}
      darkMode={darkMode}
    />
  </>
)}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/ContextMenu/NodeContextMenu.tsx
git commit -m "feat: add Reset to Theme item in node context menu"
```

---

## Task 11: Edge context menu — "Reset to Theme"

**Files:**
- Modify: `src/components/ContextMenu/EdgeContextMenu.tsx`

**Step 1: Add "Reset to Theme" menu item**

Import `RotateCcw` from lucide-react. Add `activeStyleId` selector.

Add handler:

```ts
const handleResetToTheme = useCallback(() => {
  useFlowStore.getState().updateEdgeData(edgeId, {
    color: undefined,
    thickness: undefined,
  });
  onClose();
}, [edgeId, onClose]);
```

Add menu item (after "Straighten" and before "Delete"):

```tsx
{activeStyleId && (
  <>
    <MenuDivider darkMode={darkMode} />
    <MenuItem
      icon={<RotateCcw size={14} />}
      label="Reset to Theme"
      onClick={handleResetToTheme}
      darkMode={darkMode}
    />
  </>
)}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/ContextMenu/EdgeContextMenu.tsx
git commit -m "feat: add Reset to Theme item in edge context menu"
```

---

## Task 12: Selection context menu — "Reset to Theme"

**Files:**
- Modify: `src/components/ContextMenu/SelectionContextMenu.tsx`

**Step 1: Add "Reset to Theme" for multi-select**

Same pattern as node menu. Import `RotateCcw`. Add `activeStyleId` selector.

Handler iterates all selected nodes:

```ts
const handleResetToTheme = useCallback(() => {
  const { nodes, updateNodeData } = useFlowStore.getState();
  for (const nid of nodeIds) {
    const node = nodes.find((n) => n.id === nid);
    const isTextbox = (node?.data as FlowNodeData | undefined)?.shape === 'textbox';
    updateNodeData(nid, {
      color: isTextbox ? 'transparent' : undefined,
      borderColor: isTextbox ? 'transparent' : undefined,
      textColor: undefined,
      fontFamily: undefined,
      fontSize: undefined,
      fontWeight: undefined,
    });
  }
  onClose();
}, [nodeIds, onClose]);
```

Add menu item in JSX (before or after the color swatches):

```tsx
{activeStyleId && (
  <>
    <MenuDivider darkMode={darkMode} />
    <MenuItem
      icon={<RotateCcw size={14} />}
      label="Reset to Theme"
      onClick={handleResetToTheme}
      darkMode={darkMode}
    />
  </>
)}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/ContextMenu/SelectionContextMenu.tsx
git commit -m "feat: add Reset to Theme item in selection context menu"
```

---

## Task 13: Properties Panel — per-property reset icons + theme badge

**Files:**
- Modify: `src/components/Panels/PropertiesPanel.tsx:540-660` (Block section), `825-949` (Label section)

**Step 1: Add resolver import and theme subscription**

```ts
import { resolveNodeStyle } from '../../utils/themeResolver';
import { diagramStyles } from '../../styles/diagramStyles';
import { RotateCcw } from 'lucide-react';  // add to existing import
```

Inside the node properties section component, add:

```ts
const activeStyleId = useStyleStore((s) => s.activeStyleId);
const activeStyle = activeStyleId ? diagramStyles[activeStyleId] ?? null : null;
const resolved = resolveNodeStyle(data, data.shape || 'rectangle', activeStyle);
```

**Step 2: Update resolved defaults**

Replace the current hardcoded defaults (lines 554-558):

```ts
// Old:
const fillColor = data.color || '#3b82f6';
const borderColor = data.borderColor || darkenColor(fillColor, 0.25);
const textColor = data.textColor || '#ffffff';
const fontSize = data.fontSize || 14;
const fontWeight = data.fontWeight || 500;

// New:
const fillColor = data.color || resolved.fill;
const borderColor = data.borderColor || resolved.borderColor;
const textColor = data.textColor || resolved.textColor;
const fontSize = data.fontSize || resolved.fontSize;
const fontWeight = data.fontWeight || resolved.fontWeight;
```

**Step 3: Add per-property reset icon helper**

Create a small inline component:

```tsx
const ResetIcon: React.FC<{ visible: boolean; onReset: () => void }> = ({ visible, onReset }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onReset}
      title="Reset to theme default"
      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-dk-hover text-slate-400 hover:text-slate-600 dark:text-dk-faint dark:hover:text-dk-text transition-colors cursor-pointer"
    >
      <RotateCcw size={12} />
    </button>
  );
};
```

**Step 4: Add reset icons to each style property field**

For Fill Color:
```tsx
<Field label="Fill Color">
  <div className="flex items-center gap-2">
    <input type="color" ... />
    <input type="text" ... />
    <ResetIcon
      visible={!!activeStyleId && !!data.color}
      onReset={() => update({ color: undefined })}
    />
  </div>
</Field>
```

Repeat for Border Color (`data.borderColor`), Text Color (`data.textColor`), Font Size (`data.fontSize`), and Font Weight (`data.fontWeight`).

**Step 5: Add "Theme" badge**

When a property is inherited from the theme (i.e., `data.color` is undefined and `activeStyleId` is set), show a small "Theme" badge next to the color picker:

```tsx
{!data.color && activeStyleId && (
  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20">
    Theme
  </span>
)}
```

**Step 6: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 7: Commit**

```bash
git add src/components/Panels/PropertiesPanel.tsx
git commit -m "feat: per-property reset icons and Theme badge in PropertiesPanel"
```

---

## Task 14: Update JSON export/import for `canvasColorOverride`

**Files:**
- Modify: `src/utils/exportUtils.ts:1303-1308` (export), `1756-1761` (import)

**Step 1: Update export**

In the `exportAsJson` function, add `canvasColorOverride` to the styles export:

```ts
if (options.includeStyles) {
  exportData.styles = {
    activeStyleId: styleState.activeStyleId,
    activePaletteId: styleState.activePaletteId,
    canvasColorOverride: styleState.canvasColorOverride,
  };
}
```

**Step 2: Update import**

In the `importFromJson` function, add handling for `canvasColorOverride`:

```ts
if (data.styles && typeof data.styles === 'object') {
  const s = data.styles as Record<string, unknown>;
  if (typeof s.activeStyleId === 'string') useStyleStore.getState().setStyle(s.activeStyleId);
  else if (s.activeStyleId === null) useStyleStore.getState().clearStyle();
  if (typeof s.activePaletteId === 'string') useStyleStore.getState().setPalette(s.activePaletteId);
  if (typeof s.canvasColorOverride === 'string') {
    useStyleStore.getState().setCanvasColorOverride(s.canvasColorOverride);
  } else {
    useStyleStore.getState().setCanvasColorOverride(null);
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/utils/exportUtils.ts
git commit -m "feat: export/import canvasColorOverride in JSON"
```

---

## Task 15: Fix any remaining type errors from nullable `activeStyleId`

**Files:**
- Modify: any file that uses `activeStyleId` as a guaranteed string

**Step 1: Search for usages**

Search for `activeStyleId` across all `.ts` and `.tsx` files. Common patterns to fix:

- `diagramStyles[activeStyleId]` — needs a null check: `activeStyleId ? diagramStyles[activeStyleId] : null`
- Any code comparing `activeStyleId === 'someId'` — still works with null (will be `false`)
- FlowCanvas.tsx `activeStyle` — likely needs: `const activeStyle = activeStyleId ? diagramStyles[activeStyleId] ?? diagramStyles.cleanMinimal : diagramStyles.cleanMinimal;` for the canvas (which always needs some style for grid/background defaults)

**Step 2: Fix each usage**

For FlowCanvas.tsx, the `activeStyle` variable needs careful handling because the canvas background, grid color, and minimap all read from it. When no theme is active, use a sensible default:

```ts
const activeStyleId = useStyleStore((s) => s.activeStyleId);
const activeStyle = activeStyleId ? diagramStyles[activeStyleId] ?? diagramStyles.cleanMinimal : diagramStyles.cleanMinimal;
```

This ensures the canvas always has grid/bg values even with no theme. The resolver's `resolveCanvasBackground` handles the override and dark mode logic on top.

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS — zero type errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: handle nullable activeStyleId across all consumers"
```

---

## Task 16: Update documentation

**Files:**
- Modify: `guides/wiki/styles-themes.md`
- Modify: `guides/FLOWCRAFT_JSON_IMPORT_RULEBOOK.md`

**Step 1: Update wiki**

Add a new section to `guides/wiki/styles-themes.md` after "Applying Styles":

```markdown
## Theme Resolver & Reset

When a diagram style is active, it acts as a live fallback — new nodes and edges automatically inherit the theme's colors, fonts, and styling without storing any style data. Only user overrides are saved.

### Reset to Theme

- **Single node/edge**: Right-click → "Reset to Theme" clears all manual style overrides
- **Multiple nodes**: Select all, right-click → "Reset to Theme"
- **Individual property**: In the Properties Panel, click the reset icon (↺) next to any property showing a user override
- **Canvas color**: Right-click canvas → "Canvas Color" → "Reset to Theme"
- **Deselect theme entirely**: Click the ✕ button in the style picker header

### Canvas Color Override

Right-click the canvas to access canvas color options:
- **Reset to Theme** — uses the active theme's canvas background
- **Custom Color** — pick any background color via color picker

### Per-Shape Theme Colors

Each diagram style defines unique fill colors for different shape types (rectangles, diamonds, circles, etc.), giving diagrams a more polished, color-coded appearance when using a theme.
```

**Step 2: Update JSON rulebook**

Add `canvasColorOverride` to the styles section in `guides/FLOWCRAFT_JSON_IMPORT_RULEBOOK.md`. Note that `activeStyleId` can now be `null`.

**Step 3: Commit**

```bash
git add guides/
git commit -m "docs: update wiki and JSON rulebook for theme resolver system"
```

---

## Task 17: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: PASS — zero errors, zero warnings.

**Step 2: Manual smoke test checklist**

Run `npm run dev` and verify:

1. Open style picker → select a theme → all existing nodes update to theme colors (not stamped, but resolved)
2. Add a new node → it renders with theme colors, zero style data in node
3. Change node color manually → the override sticks
4. Right-click node → "Reset to Theme" → reverts to theme color
5. Click ✕ on style picker → all nodes fall back to hardcoded shape colors
6. Right-click canvas → "Canvas Color" → pick a custom color → canvas background changes
7. Right-click canvas → "Canvas Color" → "Reset to Theme" → canvas goes back to theme bg
8. Properties Panel → "Theme" badge shows on inherited properties
9. Properties Panel → reset icon appears on manually overridden properties
10. Export as JSON → re-import → styles and canvas color preserved
11. Select multiple nodes → right-click → "Reset to Theme" → all revert

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: theme resolver system — live theme fallback, per-shape colors, reset UI"
```
