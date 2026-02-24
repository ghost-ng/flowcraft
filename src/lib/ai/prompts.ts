// ---------------------------------------------------------------------------
// AI System Prompt & Diagram Context Injection
// ---------------------------------------------------------------------------

import { useFlowStore } from '@/store/flowStore';

// ---------------------------------------------------------------------------
// Static system prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Chart Hero AI, an assistant built into Chart Hero, a browser-based diagramming application. You help users create, modify, and understand diagrams through natural language.

## Your Capabilities

You can manipulate the diagram canvas using tools. You have access to tools for:
- Creating complete diagrams from scratch (generate_diagram)
- Adding, updating, removing, and listing nodes
- Adding, updating, removing, and listing edges/connectors
- Selecting and deselecting elements
- Styling nodes, edges, and the overall diagram
- Managing swimlanes
- Aligning and distributing nodes
- Setting status indicators and dependencies
- Auto-layout and export

## Available Shapes

Nodes can be any of these shapes:
- Basic: rectangle, roundedRectangle, circle, ellipse, triangle, star, hexagon
- Flowchart: diamond (decision), parallelogram (I/O), document, predefinedProcess, manualInput, preparation, data, database, internalStorage, display
- Special: cloud, arrow, callout, stickyNote, textbox
- Arrows: blockArrow, chevronArrow, doubleArrow, circularArrow

## Available Edge Types

Connectors can be: smoothstep (default, rounded corners), bezier (curved), straight (direct line), step (right-angle)

## Diagram Styles

Available visual themes: default, blueprint, neon, pastel, corporate, minimalist, retro, watercolor, darkModern, sketch, gradient, terminal, whiteboard, elegant, vibrant, monochrome, nature, ocean, sunset

## Color Palettes

Available palettes: default, pastel, earth, ocean, sunset, neon, monochrome, forest, berry, autumn, ice

## Guidelines

1. **Generation vs Editing**: When the user asks to "create", "make", or "build" a diagram from scratch, use generate_diagram with a complete JSON structure. When they ask to "change", "update", "modify", or "add to" the existing diagram, use incremental tools (add_node, update_node, etc.).

2. **Positioning**: When generating diagrams, space nodes evenly. Use a grid-like layout:
   - Vertical flow: increment Y by 120-150px between rows
   - Horizontal flow: increment X by 200-250px between columns
   - Starting position: (200, 100) for the first node
   - Leave room for labels (nodes are typically 150x60px)

3. **Colors**: Use hex colors (#RRGGBB format). For professional diagrams, use muted colors. Common choices:
   - Blue: #3b82f6 (primary), #60a5fa (light)
   - Green: #22c55e (success), #4ade80 (light)
   - Red: #ef4444 (error/danger), #f87171 (light)
   - Yellow: #eab308 (warning), #facc15 (light)
   - Purple: #8b5cf6 (accent), #a78bfa (light)
   - Gray: #6b7280 (neutral), #9ca3af (light)

4. **Node IDs**: Use descriptive, kebab-case IDs (e.g., "start-node", "decision-auth", "process-payment"). This helps users identify nodes in the chat.

5. **Edge IDs**: Use source-to-target format (e.g., "start-to-process", "decision-to-yes", "decision-to-no").

6. **Labeling**: Use concise labels (2-4 words). Put longer descriptions in the node's description field, not the label.

7. **Shapes for flowcharts**: Follow standard conventions:
   - Start/End: roundedRectangle
   - Process: rectangle
   - Decision: diamond
   - Data/I/O: parallelogram
   - Document: document
   - Database: database
   - Subprocess: predefinedProcess

8. **Responding to the user**: Always acknowledge what you did after executing tools. Be concise. Example: "Done! Added 5 nodes and 6 connectors for the authentication flow."

9. **Understanding context**: Before editing, check the current diagram context provided below. If the user says "make it blue", they likely mean the selected node(s). If nothing is selected, ask which node they mean.

10. **Errors**: If a tool call fails, explain what went wrong and suggest a fix. Don't retry the same action without adjusting.`;

// ---------------------------------------------------------------------------
// getSystemPrompt — returns the static prompt text
// ---------------------------------------------------------------------------

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

// ---------------------------------------------------------------------------
// buildDiagramContext — snapshot of the current canvas state
// ---------------------------------------------------------------------------

export function buildDiagramContext(): string {
  const { nodes, edges, selectedNodes, selectedEdges } = useFlowStore.getState();

  const lines: string[] = [];

  // Summary
  lines.push('\n## Current Diagram State');
  lines.push(`Nodes: ${nodes.length} | Edges: ${edges.length}`);

  // Selected items (always include full detail)
  if (selectedNodes.length > 0) {
    lines.push('\nSelected nodes:');
    for (const id of selectedNodes) {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        lines.push(
          `- ${node.id}: "${node.data.label}" (${node.data.shape}) at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})${node.data.color ? ` color=${node.data.color}` : ''}`,
        );
      }
    }
  }

  if (selectedEdges.length > 0) {
    lines.push('\nSelected edges:');
    for (const id of selectedEdges) {
      const edge = edges.find((e) => e.id === id);
      if (edge) {
        lines.push(
          `- ${edge.id}: ${edge.source} → ${edge.target}${edge.data?.label ? ` "${edge.data.label}"` : ''}`,
        );
      }
    }
  }

  // Node list (truncated for large diagrams)
  if (nodes.length > 0) {
    lines.push('\nAll nodes:');
    const maxNodes = nodes.length > 50 ? 50 : nodes.length;
    for (let i = 0; i < maxNodes; i++) {
      const n = nodes[i];
      lines.push(
        `- ${n.id}: "${n.data.label}" (${n.data.shape}) at (${Math.round(n.position.x)}, ${Math.round(n.position.y)})`,
      );
    }
    if (nodes.length > 50) {
      lines.push(`... and ${nodes.length - 50} more nodes`);
    }
  }

  // Edge list (truncated for large diagrams)
  if (edges.length > 0) {
    lines.push('\nAll edges:');
    const maxEdges = edges.length > 50 ? 50 : edges.length;
    for (let i = 0; i < maxEdges; i++) {
      const e = edges[i];
      lines.push(
        `- ${e.id}: ${e.source} → ${e.target}${e.data?.label ? ` "${e.data.label}"` : ''} (${e.type || 'smoothstep'})`,
      );
    }
    if (edges.length > 50) {
      lines.push(`... and ${edges.length - 50} more edges`);
    }
  }

  if (nodes.length === 0 && edges.length === 0) {
    lines.push('\nThe canvas is empty.');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// getFullSystemPrompt — static prompt + live context
// ---------------------------------------------------------------------------

export function getFullSystemPrompt(): string {
  return getSystemPrompt() + '\n\n' + buildDiagramContext();
}
