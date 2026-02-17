# FlowCraft

A browser-based diagramming and flowchart application built with React, TypeScript, and React Flow.

## Features

- Drag-and-drop shape palette with 20+ shapes (rectangles, diamonds, arrows, clouds, etc.)
- Customizable node styling: fill color, border, text, opacity, corner radius
- Icon support with full Lucide icon library and icon styling (color, background, outline)
- Multiple status pucks per node with drag-to-corner snapping
- Smart connectors with customizable edge styles (bezier, step, smoothstep, straight)
- Swimlane / matrix layout system
- Dependency tracking between nodes
- Format painter for quick style copying
- Export to PNG, SVG, PDF, and JSON
- Keyboard shortcuts for common operations
- Dark mode support
- Alignment and distribution guides
- Snap-to-grid with configurable spacing

## Tech Stack

- **React 19** with TypeScript
- **@xyflow/react v12** (React Flow) for the canvas
- **Zustand v5** with Immer middleware for state management
- **Tailwind CSS 4** for styling
- **Vite 7** for build tooling
- **Lucide React** for icons
- **chroma-js** for color utilities

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # preview the production build
```

## Deploy

```bash
npm run deploy    # deploys to GitHub Pages
```

## License

MIT
