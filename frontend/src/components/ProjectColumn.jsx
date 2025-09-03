import React from "react";
import { motion } from "framer-motion";

const getStatusColor = (id) => {
  switch (id) {
    case 'active': return 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30';
    case 'planning': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    case 'completed': return 'from-purple-500/20 to-blue-500/20 border-purple-500/30';
    case 'paused': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
    case 'under_discussion': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    case 'research': return 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30';
    case 'development': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    case 'mvp': return 'from-pink-500/20 to-rose-500/20 border-pink-500/30';
    default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
  }
};

export default function ProjectColumn({ id, title, count = 0, items = [], onSelect = () => {}, onMove = () => {}, dragHandlers = {} }) {
  const {
    dragOverColumn,
    handleDragOver,
    handleDrop,
    handleDragStart,
    handleDragEnd
  } = dragHandlers || {};

  const statusColor = getStatusColor(id);

  return (
    <div
      className={`rounded-2xl p-5 border backdrop-blur-sm min-h-[180px] bg-gradient-to-br transition-all duration-200 ${statusColor} ${dragOverColumn === id ? 'ring-2 ring-cyan-400 scale-105' : ''}`}
      onDragOver={(e) => handleDragOver && handleDragOver(e, id)}
      onDrop={(e) => handleDrop && handleDrop(e, id, onMove)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-slate-300 font-medium">{title}</div>
          <div className="mt-1 text-2xl font-bold text-white">{count}</div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-sm text-slate-400 border border-dashed border-white/20 rounded-xl p-4 text-center">
          No projects here yet.
        </div>
      )}

      <div className="space-y-3 mt-3">
        {items.map((p) => (
          <motion.div
            key={p.id}
            draggable
            onDragStart={(e) => handleDragStart && handleDragStart(e, p, id)}
            onDragEnd={() => handleDragEnd && handleDragEnd()}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-white/10 border border-white/10 cursor-move hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
            onClick={() => onSelect && onSelect(p)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-white text-sm mb-1">
                  {p.title}
                </div>
                <div className="text-xs text-slate-300">
                  Lead: {p.lead}
                </div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${p.priority === 'high' ? 'bg-red-500/20 text-red-300' : p.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                  {p.priority}
                </div>
              </div>
              <div className="cursor-grab select-none text-slate-400 ml-3 text-lg">
                ⋮⋮
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
