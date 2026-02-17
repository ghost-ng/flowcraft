// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

import type { FlowNode, FlowEdge } from '../store/flowStore';
import type { SwimlaneConfig } from '../store/swimlaneStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateCategory = 'General' | 'Business' | 'Software' | 'Agile';

export interface DiagramTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  nodes: FlowNode[];
  edges: FlowEdge[];
  swimlanes?: SwimlaneConfig;
}

// ---------------------------------------------------------------------------
// Helper: generate deterministic IDs for templates
// ---------------------------------------------------------------------------

function n(id: string, label: string, shape: FlowNode['data']['shape'], x: number, y: number, color?: string): FlowNode {
  return {
    id,
    type: 'shapeNode',
    position: { x, y },
    data: { label, shape, ...(color ? { color } : {}) },
  };
}

function e(id: string, source: string, target: string, label?: string): FlowEdge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    ...(label ? { label } : {}),
  };
}

// ---------------------------------------------------------------------------
// 1. Blank Canvas
// ---------------------------------------------------------------------------

const blankCanvas: DiagramTemplate = {
  id: 'blank',
  title: 'Blank Canvas',
  description: 'Start from scratch with an empty diagram.',
  category: 'General',
  nodes: [],
  edges: [],
};

// ---------------------------------------------------------------------------
// 2. Simple Flowchart
// ---------------------------------------------------------------------------

const simpleFlowchart: DiagramTemplate = {
  id: 'simple-flowchart',
  title: 'Simple Flowchart',
  description: 'A basic Start - Process - Decision - End flow with 5 nodes.',
  category: 'General',
  nodes: [
    n('sf-1', 'Start', 'roundedRectangle', 300, 0, '#10b981'),
    n('sf-2', 'Process', 'rectangle', 300, 120, '#3b82f6'),
    n('sf-3', 'Decision?', 'diamond', 300, 260, '#f59e0b'),
    n('sf-4', 'Yes Path', 'rectangle', 120, 420, '#8b5cf6'),
    n('sf-5', 'No Path', 'rectangle', 480, 420, '#ef4444'),
    n('sf-6', 'End', 'roundedRectangle', 300, 560, '#6b7280'),
  ],
  edges: [
    e('sf-e1', 'sf-1', 'sf-2'),
    e('sf-e2', 'sf-2', 'sf-3'),
    e('sf-e3', 'sf-3', 'sf-4', 'Yes'),
    e('sf-e4', 'sf-3', 'sf-5', 'No'),
    e('sf-e5', 'sf-4', 'sf-6'),
    e('sf-e6', 'sf-5', 'sf-6'),
  ],
};

// ---------------------------------------------------------------------------
// 3. Software Architecture
// ---------------------------------------------------------------------------

const softwareArchitecture: DiagramTemplate = {
  id: 'software-architecture',
  title: 'Software Architecture',
  description: 'Client, API Gateway, micro-services, database, and cache topology.',
  category: 'Software',
  nodes: [
    n('sa-1', 'Client App', 'roundedRectangle', 300, 0, '#3b82f6'),
    n('sa-2', 'API Gateway', 'hexagon', 300, 140, '#f59e0b'),
    n('sa-3', 'Auth Service', 'rectangle', 80, 300, '#8b5cf6'),
    n('sa-4', 'User Service', 'rectangle', 300, 300, '#10b981'),
    n('sa-5', 'Order Service', 'rectangle', 520, 300, '#ef4444'),
    n('sa-6', 'Database', 'rectangle', 200, 460, '#06b6d4'),
    n('sa-7', 'Cache (Redis)', 'parallelogram', 440, 460, '#ec4899'),
  ],
  edges: [
    e('sa-e1', 'sa-1', 'sa-2'),
    e('sa-e2', 'sa-2', 'sa-3'),
    e('sa-e3', 'sa-2', 'sa-4'),
    e('sa-e4', 'sa-2', 'sa-5'),
    e('sa-e5', 'sa-4', 'sa-6'),
    e('sa-e6', 'sa-5', 'sa-6'),
    e('sa-e7', 'sa-5', 'sa-7'),
    e('sa-e8', 'sa-4', 'sa-7'),
  ],
};

// ---------------------------------------------------------------------------
// 4. Deployment Pipeline
// ---------------------------------------------------------------------------

const deploymentPipeline: DiagramTemplate = {
  id: 'deployment-pipeline',
  title: 'Deployment Pipeline',
  description: 'CI/CD pipeline: Build, Test, Stage, Deploy, Monitor.',
  category: 'Software',
  nodes: [
    n('dp-1', 'Build', 'rectangle', 0, 120, '#3b82f6'),
    n('dp-2', 'Unit Tests', 'rectangle', 200, 120, '#10b981'),
    n('dp-3', 'Integration Tests', 'rectangle', 400, 120, '#10b981'),
    n('dp-4', 'Stage Deploy', 'rectangle', 600, 120, '#f59e0b'),
    n('dp-5', 'QA Review', 'diamond', 800, 100, '#8b5cf6'),
    n('dp-6', 'Prod Deploy', 'rectangle', 1000, 120, '#ef4444'),
    n('dp-7', 'Monitor', 'roundedRectangle', 1200, 120, '#06b6d4'),
  ],
  edges: [
    e('dp-e1', 'dp-1', 'dp-2'),
    e('dp-e2', 'dp-2', 'dp-3'),
    e('dp-e3', 'dp-3', 'dp-4'),
    e('dp-e4', 'dp-4', 'dp-5'),
    e('dp-e5', 'dp-5', 'dp-6', 'Approved'),
    e('dp-e6', 'dp-6', 'dp-7'),
  ],
};

// ---------------------------------------------------------------------------
// 5. Cross-Functional Flowchart (with swimlanes)
// ---------------------------------------------------------------------------

const crossFunctionalFlowchart: DiagramTemplate = {
  id: 'cross-functional',
  title: 'Cross-Functional Flowchart',
  description: '3 horizontal swimlanes with nodes showing inter-team flow.',
  category: 'Business',
  nodes: [
    // Management lane
    n('cf-1', 'Approve Request', 'rectangle', 100, 40, '#3b82f6'),
    n('cf-2', 'Review Results', 'rectangle', 500, 40, '#3b82f6'),
    // Engineering lane
    n('cf-3', 'Receive Task', 'rectangle', 100, 200, '#10b981'),
    n('cf-4', 'Develop Solution', 'rectangle', 300, 200, '#10b981'),
    n('cf-5', 'Test & Validate', 'diamond', 500, 180, '#10b981'),
    // QA lane
    n('cf-6', 'QA Review', 'rectangle', 300, 360, '#f59e0b'),
    n('cf-7', 'Sign Off', 'roundedRectangle', 500, 360, '#f59e0b'),
  ],
  edges: [
    e('cf-e1', 'cf-1', 'cf-3'),
    e('cf-e2', 'cf-3', 'cf-4'),
    e('cf-e3', 'cf-4', 'cf-5'),
    e('cf-e4', 'cf-4', 'cf-6'),
    e('cf-e5', 'cf-5', 'cf-2', 'Pass'),
    e('cf-e6', 'cf-6', 'cf-7'),
    e('cf-e7', 'cf-7', 'cf-2'),
  ],
  swimlanes: {
    orientation: 'horizontal',
    containerTitle: 'Cross-Functional Process',
    horizontal: [
      { id: 'lane-mgmt', label: 'Management', color: '#dbeafe', collapsed: false, size: 160, order: 0 },
      { id: 'lane-eng', label: 'Engineering', color: '#d1fae5', collapsed: false, size: 160, order: 1 },
      { id: 'lane-qa', label: 'QA', color: '#fef3c7', collapsed: false, size: 160, order: 2 },
    ],
    vertical: [],
  },
};

// ---------------------------------------------------------------------------
// 6. Decision Tree
// ---------------------------------------------------------------------------

const decisionTree: DiagramTemplate = {
  id: 'decision-tree',
  title: 'Decision Tree',
  description: 'Branching diamond decision nodes for multi-path analysis.',
  category: 'Business',
  nodes: [
    n('dt-1', 'Start', 'roundedRectangle', 350, 0, '#10b981'),
    n('dt-2', 'Criteria A?', 'diamond', 350, 140, '#f59e0b'),
    n('dt-3', 'Criteria B?', 'diamond', 150, 320, '#f59e0b'),
    n('dt-4', 'Criteria C?', 'diamond', 550, 320, '#f59e0b'),
    n('dt-5', 'Outcome 1', 'rectangle', 50, 500, '#3b82f6'),
    n('dt-6', 'Outcome 2', 'rectangle', 250, 500, '#8b5cf6'),
    n('dt-7', 'Outcome 3', 'rectangle', 450, 500, '#ef4444'),
    n('dt-8', 'Outcome 4', 'rectangle', 650, 500, '#06b6d4'),
  ],
  edges: [
    e('dt-e1', 'dt-1', 'dt-2'),
    e('dt-e2', 'dt-2', 'dt-3', 'Yes'),
    e('dt-e3', 'dt-2', 'dt-4', 'No'),
    e('dt-e4', 'dt-3', 'dt-5', 'Yes'),
    e('dt-e5', 'dt-3', 'dt-6', 'No'),
    e('dt-e6', 'dt-4', 'dt-7', 'Yes'),
    e('dt-e7', 'dt-4', 'dt-8', 'No'),
  ],
};

// ---------------------------------------------------------------------------
// 7. Mind Map
// ---------------------------------------------------------------------------

const mindMap: DiagramTemplate = {
  id: 'mind-map',
  title: 'Mind Map',
  description: 'Central idea with radiating branches and sub-topics.',
  category: 'General',
  nodes: [
    n('mm-1', 'Central Idea', 'circle', 350, 250, '#3b82f6'),
    // Level 1
    n('mm-2', 'Branch A', 'roundedRectangle', 100, 60, '#10b981'),
    n('mm-3', 'Branch B', 'roundedRectangle', 600, 60, '#f59e0b'),
    n('mm-4', 'Branch C', 'roundedRectangle', 100, 440, '#8b5cf6'),
    n('mm-5', 'Branch D', 'roundedRectangle', 600, 440, '#ef4444'),
    // Level 2
    n('mm-6', 'Sub A-1', 'rectangle', -50, 0, '#10b981'),
    n('mm-7', 'Sub A-2', 'rectangle', -50, 100, '#10b981'),
    n('mm-8', 'Sub B-1', 'rectangle', 750, 0, '#f59e0b'),
    n('mm-9', 'Sub B-2', 'rectangle', 750, 100, '#f59e0b'),
    n('mm-10', 'Sub C-1', 'rectangle', -50, 400, '#8b5cf6'),
    n('mm-11', 'Sub D-1', 'rectangle', 750, 400, '#ef4444'),
  ],
  edges: [
    e('mm-e1', 'mm-1', 'mm-2'),
    e('mm-e2', 'mm-1', 'mm-3'),
    e('mm-e3', 'mm-1', 'mm-4'),
    e('mm-e4', 'mm-1', 'mm-5'),
    e('mm-e5', 'mm-2', 'mm-6'),
    e('mm-e6', 'mm-2', 'mm-7'),
    e('mm-e7', 'mm-3', 'mm-8'),
    e('mm-e8', 'mm-3', 'mm-9'),
    e('mm-e9', 'mm-4', 'mm-10'),
    e('mm-e10', 'mm-5', 'mm-11'),
  ],
};

// ---------------------------------------------------------------------------
// 8. Sprint Board
// ---------------------------------------------------------------------------

const sprintBoard: DiagramTemplate = {
  id: 'sprint-board',
  title: 'Sprint Board',
  description: '4 vertical columns: Backlog, In Progress, Review, Done.',
  category: 'Agile',
  nodes: [
    // Column headers
    n('sb-h1', 'Backlog', 'roundedRectangle', 0, 0, '#6b7280'),
    n('sb-h2', 'In Progress', 'roundedRectangle', 220, 0, '#3b82f6'),
    n('sb-h3', 'Review', 'roundedRectangle', 440, 0, '#f59e0b'),
    n('sb-h4', 'Done', 'roundedRectangle', 660, 0, '#10b981'),
    // Backlog cards
    n('sb-1', 'User Auth', 'rectangle', 0, 90, '#94a3b8'),
    n('sb-2', 'Search API', 'rectangle', 0, 170, '#94a3b8'),
    n('sb-3', 'Dashboard', 'rectangle', 0, 250, '#94a3b8'),
    // In Progress cards
    n('sb-4', 'Login Page', 'rectangle', 220, 90, '#60a5fa'),
    n('sb-5', 'DB Migration', 'rectangle', 220, 170, '#60a5fa'),
    // Review cards
    n('sb-6', 'Settings UI', 'rectangle', 440, 90, '#fbbf24'),
    // Done cards
    n('sb-7', 'CI Pipeline', 'rectangle', 660, 90, '#34d399'),
    n('sb-8', 'Env Setup', 'rectangle', 660, 170, '#34d399'),
  ],
  edges: [],
};

// ---------------------------------------------------------------------------
// 9. Sequence Diagram
// ---------------------------------------------------------------------------

const sequenceDiagram: DiagramTemplate = {
  id: 'sequence-diagram',
  title: 'Sequence Diagram',
  description: 'UML-style interactions between actors and systems with labeled messages.',
  category: 'Software',
  nodes: [
    n('seq-1', 'Person', 'rectangle', 0, 60, '#3b82f6'),
    n('seq-2', 'Cashier', 'rectangle', 220, 60, '#10b981'),
    n('seq-3', 'POS Terminal', 'rectangle', 440, 60, '#f59e0b'),
    n('seq-4', 'CC Terminal', 'rectangle', 660, 60, '#8b5cf6'),
    n('seq-5', 'Auth Service', 'rectangle', 880, 60, '#ef4444'),
  ],
  edges: [
    e('seq-e1', 'seq-1', 'seq-2', 'Add Items'),
    e('seq-e2', 'seq-2', 'seq-3', 'Total Order'),
    e('seq-e3', 'seq-3', 'seq-4', 'Request Payment'),
    e('seq-e4', 'seq-4', 'seq-5', 'Auth Request'),
    e('seq-e5', 'seq-5', 'seq-4', 'Approved'),
  ],
};

// ---------------------------------------------------------------------------
// 10. Mind Map (Colored)
// ---------------------------------------------------------------------------

const mindMapColored: DiagramTemplate = {
  id: 'mind-map-colored',
  title: 'Mind Map (Colored)',
  description: 'Central topic with color-coded branches and sub-topics.',
  category: 'General',
  nodes: [
    // Center
    n('mmc-1', 'Main Topic', 'circle', 350, 280, '#3b82f6'),
    // Primary branches
    n('mmc-2', 'Branch 1', 'circle', 100, 80, '#3b82f6'),
    n('mmc-3', 'Branch 2', 'circle', 600, 80, '#10b981'),
    n('mmc-4', 'Branch 3', 'circle', 100, 480, '#f59e0b'),
    n('mmc-5', 'Branch 4', 'circle', 600, 480, '#8b5cf6'),
    // Sub-topics for Branch 1 (blue)
    n('mmc-6', 'Idea 1-A', 'roundedRectangle', -80, 0, '#60a5fa'),
    n('mmc-7', 'Idea 1-B', 'roundedRectangle', -80, 80, '#60a5fa'),
    n('mmc-8', 'Idea 1-C', 'roundedRectangle', -80, 160, '#60a5fa'),
    // Sub-topics for Branch 2 (green)
    n('mmc-9', 'Idea 2-A', 'roundedRectangle', 780, 0, '#34d399'),
    n('mmc-10', 'Idea 2-B', 'roundedRectangle', 780, 80, '#34d399'),
    // Sub-topics for Branch 3 (orange)
    n('mmc-11', 'Idea 3-A', 'roundedRectangle', -80, 440, '#fbbf24'),
    n('mmc-12', 'Idea 3-B', 'roundedRectangle', -80, 520, '#fbbf24'),
    n('mmc-13', 'Idea 3-C', 'roundedRectangle', -80, 600, '#fbbf24'),
    // Sub-topics for Branch 4 (purple)
    n('mmc-14', 'Idea 4-A', 'roundedRectangle', 780, 440, '#a78bfa'),
    n('mmc-15', 'Idea 4-B', 'roundedRectangle', 780, 520, '#a78bfa'),
  ],
  edges: [
    // Center to branches
    e('mmc-e1', 'mmc-1', 'mmc-2'),
    e('mmc-e2', 'mmc-1', 'mmc-3'),
    e('mmc-e3', 'mmc-1', 'mmc-4'),
    e('mmc-e4', 'mmc-1', 'mmc-5'),
    // Branch 1 to sub-topics
    e('mmc-e5', 'mmc-2', 'mmc-6'),
    e('mmc-e6', 'mmc-2', 'mmc-7'),
    e('mmc-e7', 'mmc-2', 'mmc-8'),
    // Branch 2 to sub-topics
    e('mmc-e8', 'mmc-3', 'mmc-9'),
    e('mmc-e9', 'mmc-3', 'mmc-10'),
    // Branch 3 to sub-topics
    e('mmc-e10', 'mmc-4', 'mmc-11'),
    e('mmc-e11', 'mmc-4', 'mmc-12'),
    e('mmc-e12', 'mmc-4', 'mmc-13'),
    // Branch 4 to sub-topics
    e('mmc-e13', 'mmc-5', 'mmc-14'),
    e('mmc-e14', 'mmc-5', 'mmc-15'),
  ],
};

// ---------------------------------------------------------------------------
// 11. Project Timeline
// ---------------------------------------------------------------------------

const projectTimeline: DiagramTemplate = {
  id: 'project-timeline',
  title: 'Project Timeline',
  description: 'Horizontal timeline with color-coded milestone phases.',
  category: 'Business',
  nodes: [
    n('pt-1', '01 Planning', 'rectangle', 0, 100, '#ef4444'),
    n('pt-2', '02 Design', 'rectangle', 220, 100, '#f59e0b'),
    n('pt-3', '03 Development', 'rectangle', 440, 100, '#10b981'),
    n('pt-4', '04 Testing', 'rectangle', 660, 100, '#3b82f6'),
    n('pt-5', '05 Launch', 'rectangle', 880, 100, '#8b5cf6'),
  ],
  edges: [
    e('pt-e1', 'pt-1', 'pt-2'),
    e('pt-e2', 'pt-2', 'pt-3'),
    e('pt-e3', 'pt-3', 'pt-4'),
    e('pt-e4', 'pt-4', 'pt-5'),
  ],
};

// ---------------------------------------------------------------------------
// 12. Process Infographic
// ---------------------------------------------------------------------------

const processInfographic: DiagramTemplate = {
  id: 'process-infographic',
  title: 'Process Infographic',
  description: 'Vertical process with numbered steps and description cards in alternating layout.',
  category: 'Business',
  nodes: [
    // Step circles (vertical spine)
    n('pi-c1', '01', 'circle', 300, 0, '#ef4444'),
    n('pi-c2', '02', 'circle', 300, 180, '#f59e0b'),
    n('pi-c3', '03', 'circle', 300, 360, '#10b981'),
    n('pi-c4', '04', 'circle', 300, 540, '#3b82f6'),
    n('pi-c5', '05', 'circle', 300, 720, '#8b5cf6'),
    // Description cards (alternating left/right)
    n('pi-d1', 'Research & Discovery', 'roundedRectangle', 440, 0, '#fca5a5'),
    n('pi-d2', 'Strategy & Planning', 'roundedRectangle', 80, 180, '#fcd34d'),
    n('pi-d3', 'Design & Prototype', 'roundedRectangle', 440, 360, '#6ee7b7'),
    n('pi-d4', 'Build & Iterate', 'roundedRectangle', 80, 540, '#93c5fd'),
    n('pi-d5', 'Launch & Measure', 'roundedRectangle', 440, 720, '#c4b5fd'),
  ],
  edges: [
    // Vertical connections between step circles
    e('pi-e1', 'pi-c1', 'pi-c2'),
    e('pi-e2', 'pi-c2', 'pi-c3'),
    e('pi-e3', 'pi-c3', 'pi-c4'),
    e('pi-e4', 'pi-c4', 'pi-c5'),
    // Circle to description connections
    e('pi-e5', 'pi-c1', 'pi-d1'),
    e('pi-e6', 'pi-c2', 'pi-d2'),
    e('pi-e7', 'pi-c3', 'pi-d3'),
    e('pi-e8', 'pi-c4', 'pi-d4'),
    e('pi-e9', 'pi-c5', 'pi-d5'),
  ],
};

// ---------------------------------------------------------------------------
// 13. Network Architecture
// ---------------------------------------------------------------------------

const networkArchitecture: DiagramTemplate = {
  id: 'network-architecture',
  title: 'Network Architecture',
  description: 'Infrastructure diagram with internet, firewall, load balancer, web servers, and databases.',
  category: 'Software',
  nodes: [
    // Top tier
    n('na-1', 'Internet', 'cloud', 300, 0, '#6b7280'),
    // Middle tier
    n('na-2', 'Firewall', 'hexagon', 300, 160, '#ef4444'),
    n('na-3', 'Load Balancer', 'diamond', 300, 320, '#f59e0b'),
    // Web servers
    n('na-4', 'Web Server 1', 'rectangle', 80, 500, '#3b82f6'),
    n('na-5', 'Web Server 2', 'rectangle', 300, 500, '#3b82f6'),
    n('na-6', 'Web Server 3', 'rectangle', 520, 500, '#3b82f6'),
    // Databases
    n('na-7', 'DB Primary', 'rectangle', 200, 680, '#10b981'),
    n('na-8', 'DB Replica', 'rectangle', 440, 680, '#10b981'),
  ],
  edges: [
    e('na-e1', 'na-1', 'na-2'),
    e('na-e2', 'na-2', 'na-3'),
    e('na-e3', 'na-3', 'na-4'),
    e('na-e4', 'na-3', 'na-5'),
    e('na-e5', 'na-3', 'na-6'),
    e('na-e6', 'na-4', 'na-7'),
    e('na-e7', 'na-5', 'na-7'),
    e('na-e8', 'na-5', 'na-8'),
    e('na-e9', 'na-6', 'na-8'),
    e('na-e10', 'na-7', 'na-8', 'Replication'),
  ],
};

// ---------------------------------------------------------------------------
// 14. User Journey Map
// ---------------------------------------------------------------------------

const userJourneyMap: DiagramTemplate = {
  id: 'user-journey-map',
  title: 'User Journey Map',
  description: 'Horizontal user experience flow with stages and touchpoints.',
  category: 'Business',
  nodes: [
    // Stages
    n('uj-1', 'Awareness', 'roundedRectangle', 0, 60, '#ef4444'),
    n('uj-2', 'Consideration', 'roundedRectangle', 220, 60, '#f59e0b'),
    n('uj-3', 'Purchase', 'roundedRectangle', 440, 60, '#10b981'),
    n('uj-4', 'Onboarding', 'roundedRectangle', 660, 60, '#3b82f6'),
    n('uj-5', 'Retention', 'roundedRectangle', 880, 60, '#8b5cf6'),
    n('uj-6', 'Advocacy', 'roundedRectangle', 1100, 60, '#ec4899'),
    // Touchpoints below each stage
    n('uj-t1', 'Social Media Ad', 'rectangle', 0, 180, '#fca5a5'),
    n('uj-t2', 'Product Reviews', 'rectangle', 220, 180, '#fcd34d'),
    n('uj-t3', 'Checkout Flow', 'rectangle', 440, 180, '#6ee7b7'),
    n('uj-t4', 'Welcome Email', 'rectangle', 660, 180, '#93c5fd'),
    n('uj-t5', 'Feature Updates', 'rectangle', 880, 180, '#c4b5fd'),
    n('uj-t6', 'Referral Program', 'rectangle', 1100, 180, '#f9a8d4'),
  ],
  edges: [
    // Linear stage connections
    e('uj-e1', 'uj-1', 'uj-2'),
    e('uj-e2', 'uj-2', 'uj-3'),
    e('uj-e3', 'uj-3', 'uj-4'),
    e('uj-e4', 'uj-4', 'uj-5'),
    e('uj-e5', 'uj-5', 'uj-6'),
    // Stage to touchpoint connections
    e('uj-e6', 'uj-1', 'uj-t1'),
    e('uj-e7', 'uj-2', 'uj-t2'),
    e('uj-e8', 'uj-3', 'uj-t3'),
    e('uj-e9', 'uj-4', 'uj-t4'),
    e('uj-e10', 'uj-5', 'uj-t5'),
    e('uj-e11', 'uj-6', 'uj-t6'),
  ],
};

// ---------------------------------------------------------------------------
// 15. Kanban Board
// ---------------------------------------------------------------------------

const kanbanBoard: DiagramTemplate = {
  id: 'kanban-board',
  title: 'Kanban Board',
  description: '4-column kanban layout with Backlog, In Progress, Review, and Done.',
  category: 'Agile',
  nodes: [
    // Column headers
    n('kb-h1', 'Backlog', 'roundedRectangle', 0, 0, '#6b7280'),
    n('kb-h2', 'In Progress', 'roundedRectangle', 220, 0, '#3b82f6'),
    n('kb-h3', 'Review', 'roundedRectangle', 440, 0, '#f59e0b'),
    n('kb-h4', 'Done', 'roundedRectangle', 660, 0, '#10b981'),
    // Backlog cards
    n('kb-1', 'API Endpoints', 'rectangle', 0, 90, '#94a3b8'),
    n('kb-2', 'User Stories', 'rectangle', 0, 170, '#94a3b8'),
    n('kb-3', 'Documentation', 'rectangle', 0, 250, '#94a3b8'),
    // In Progress cards
    n('kb-4', 'Auth Module', 'rectangle', 220, 90, '#60a5fa'),
    n('kb-5', 'Data Models', 'rectangle', 220, 170, '#60a5fa'),
    // Review cards
    n('kb-6', 'UI Components', 'rectangle', 440, 90, '#fbbf24'),
    n('kb-7', 'Unit Tests', 'rectangle', 440, 170, '#fbbf24'),
    // Done cards
    n('kb-8', 'Project Setup', 'rectangle', 660, 90, '#34d399'),
    n('kb-9', 'CI/CD Pipeline', 'rectangle', 660, 170, '#34d399'),
  ],
  edges: [],
};

// ---------------------------------------------------------------------------
// All templates
// ---------------------------------------------------------------------------

export const templates: DiagramTemplate[] = [
  blankCanvas,
  simpleFlowchart,
  softwareArchitecture,
  deploymentPipeline,
  crossFunctionalFlowchart,
  decisionTree,
  mindMap,
  sprintBoard,
  sequenceDiagram,
  mindMapColored,
  projectTimeline,
  processInfographic,
  networkArchitecture,
  userJourneyMap,
  kanbanBoard,
];

export const templateCategories: TemplateCategory[] = ['General', 'Business', 'Software', 'Agile'];
