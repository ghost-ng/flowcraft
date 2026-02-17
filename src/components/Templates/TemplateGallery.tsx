import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  LayoutTemplate,
  Workflow,
  GitBranch,
  Network,
  Columns3,
  BinaryIcon,
  Brain,
  KanbanSquare,
  FileX2,
  MessageSquare,
  Palette,
  Clock,
  ListOrdered,
  Server,
  Route,
  Trello,
} from 'lucide-react';

import { useFlowStore } from '../../store/flowStore';
import { useStyleStore } from '../../store/styleStore';
import {
  templates,
  templateCategories,
  type DiagramTemplate,
  type TemplateCategory,
} from '../../data/templates';

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  General: <LayoutTemplate size={14} />,
  Business: <Columns3 size={14} />,
  Software: <GitBranch size={14} />,
  Agile: <KanbanSquare size={14} />,
};

// ---------------------------------------------------------------------------
// Template preview thumbnail (SVG)
// ---------------------------------------------------------------------------

const templateIcons: Record<string, React.ReactNode> = {
  blank: <FileX2 size={40} className="text-gray-300" />,
  'simple-flowchart': <Workflow size={40} className="text-blue-500" />,
  'software-architecture': <Network size={40} className="text-purple-500" />,
  'deployment-pipeline': <GitBranch size={40} className="text-green-500" />,
  'cross-functional': <Columns3 size={40} className="text-amber-500" />,
  'decision-tree': <BinaryIcon size={40} className="text-orange-500" />,
  'mind-map': <Brain size={40} className="text-indigo-500" />,
  'sprint-board': <KanbanSquare size={40} className="text-teal-500" />,
  'sequence-diagram': <MessageSquare size={40} className="text-blue-400" />,
  'mind-map-colored': <Palette size={40} className="text-pink-500" />,
  'project-timeline': <Clock size={40} className="text-amber-500" />,
  'process-infographic': <ListOrdered size={40} className="text-emerald-500" />,
  'network-architecture': <Server size={40} className="text-red-500" />,
  'user-journey-map': <Route size={40} className="text-violet-500" />,
  'kanban-board': <Trello size={40} className="text-cyan-500" />,
};

function TemplateThumbnail({ template }: { template: DiagramTemplate }) {
  const icon = templateIcons[template.id];

  if (icon) {
    return (
      <div className="w-full h-28 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-t-lg">
        {icon}
      </div>
    );
  }

  // Fallback: render a mini-preview SVG from node positions
  const { nodes } = template;
  if (nodes.length === 0) {
    return (
      <div className="w-full h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-t-lg">
        <span className="text-xs text-gray-400">Empty</span>
      </div>
    );
  }

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - 20;
  const maxX = Math.max(...xs) + 180;
  const minY = Math.min(...ys) - 20;
  const maxY = Math.max(...ys) + 80;

  return (
    <div className="w-full h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-t-lg overflow-hidden p-2">
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        {template.edges.map((edge) => {
          const src = nodes.find((n) => n.id === edge.source);
          const tgt = nodes.find((n) => n.id === edge.target);
          if (!src || !tgt) return null;
          return (
            <line
              key={edge.id}
              x1={src.position.x + 80}
              y1={src.position.y + 30}
              x2={tgt.position.x + 80}
              y2={tgt.position.y + 30}
              stroke="#94a3b8"
              strokeWidth={2}
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => (
          <rect
            key={node.id}
            x={node.position.x}
            y={node.position.y}
            width={node.data.shape === 'circle' || node.data.shape === 'diamond' ? 60 : 120}
            height={node.data.shape === 'circle' || node.data.shape === 'diamond' ? 60 : 40}
            rx={node.data.shape === 'circle' ? 30 : node.data.shape === 'diamond' ? 4 : 6}
            fill={node.data.color || '#3b82f6'}
            fillOpacity={0.7}
          />
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: DiagramTemplate;
  onUse: (template: DiagramTemplate) => void;
  darkMode: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = React.memo(
  ({ template, onUse, darkMode }) => (
    <div
      className={`
        group relative rounded-lg border overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${darkMode
          ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
          : 'bg-white border-slate-200 hover:border-blue-400'
        }
      `}
      onClick={() => onUse(template)}
    >
      <TemplateThumbnail template={template} />

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={`text-sm font-semibold truncate ${
              darkMode ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            {template.title}
          </h3>
          <span
            className={`
              shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full
              ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}
            `}
          >
            {categoryIcons[template.category]}
            {template.category}
          </span>
        </div>
        <p
          className={`text-xs line-clamp-2 ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {template.description}
        </p>
      </div>

      {/* Hover overlay */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          ${darkMode ? 'bg-slate-900/60' : 'bg-white/60'}
        `}
      >
        <span className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium shadow-lg">
          Use Template
        </span>
      </div>
    </div>
  ),
);

TemplateCard.displayName = 'TemplateCard';

// ---------------------------------------------------------------------------
// Main Gallery Modal
// ---------------------------------------------------------------------------

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ open, onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const setNodes = useFlowStore((s) => s.setNodes);
  const setEdges = useFlowStore((s) => s.setEdges);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'All'>(
    'All',
  );

  const filtered = useMemo(() => {
    let list = templates;
    if (activeCategory !== 'All') {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, activeCategory]);

  const handleUseTemplate = useCallback(
    (template: DiagramTemplate) => {
      // Deep-clone nodes/edges to avoid shared references
      const clonedNodes = JSON.parse(JSON.stringify(template.nodes));
      const clonedEdges = JSON.parse(JSON.stringify(template.edges));
      setNodes(clonedNodes);
      setEdges(clonedEdges);
      onClose();
    },
    [setNodes, setEdges, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-[90vw] max-w-4xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col
          ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}
        `}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-between px-6 py-4 border-b shrink-0
            ${darkMode ? 'border-slate-700' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center gap-2">
            <LayoutTemplate size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold">Template Gallery</h2>
          </div>
          <button
            onClick={onClose}
            className={`
              p-1.5 rounded-lg transition-colors cursor-pointer
              ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}
            `}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search + Categories */}
        <div
          className={`
            flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-3 border-b shrink-0
            ${darkMode ? 'border-slate-700' : 'border-slate-200'}
          `}
        >
          {/* Search */}
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 min-w-0
              ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}
            `}
          >
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`
                bg-transparent outline-none text-sm w-full
                ${darkMode ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'}
              `}
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 shrink-0 flex-wrap">
            {(['All', ...templateCategories] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
                  ${activeCategory === cat
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Search size={32} className="mb-3" />
              <p className="text-sm">No templates match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TemplateGallery);
