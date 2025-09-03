import React from "react";
import { motion } from "framer-motion";

function formatDateStr(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch { return dateStr; }
}

const EventColumn = ({ id, title, count = 0, items = [], onSelect = () => {}, onMove = () => {}, dragHandlers = {} }) => {
  const { dragOverColumn, handleDragOver, handleDrop } = dragHandlers;
  return (
    <div
      className={`rounded-2xl p-5 border backdrop-blur-sm bg-gradient-to-br from-slate-800/10 ${dragOverColumn === id ? 'ring-2 ring-cyan-400' : ''}`}
      onDragOver={(e) => handleDragOver(e, id)}
      onDrop={(e) => handleDrop(e, id, onMove)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-slate-300">{title}</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map(e => (
          <motion.div
            key={e.id}
            draggable
            onDragStart={(ev) => dragHandlers.handleDragStart(ev, e, id)}
            onDragEnd={dragHandlers.handleDragEnd}
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-white/5 cursor-move"
            onClick={() => onSelect(e)}
          >
            <div className="font-semibold text-white text-sm">{e.title}</div>
            <div className="text-xs text-slate-300">{formatDateStr(e.date)}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EventColumn;
