import React from "react";
import { motion } from "framer-motion";

const Metric = ({ label, value, accent, icon, description, onIncrement, onDecrement }) => (
  <div className="flex-1 min-w-[150px]">
    <motion.div
      whileHover={{ y: -3, scale: 1.02, rotateY: 5 }}
      className="rounded-2xl p-4 border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-300">{label}</div>
        <div className={`text-lg ${accent}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold tracking-wide ${accent} mb-1`}>
        {value != null ? Number(value).toLocaleString() : "—"}
      </div>
      {description && <div className="text-xs text-slate-400">{description}</div>}

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => onDecrement && onDecrement()}
          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-sm"
          aria-label={`Decrease ${label}`}
        >−</button>
        <button
          type="button"
          onClick={() => onIncrement && onIncrement()}
          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-sm"
          aria-label={`Increase ${label}`}
        >+</button>
        <div className="text-xs text-slate-400 ml-auto">Live</div>
      </div>
    </motion.div>
  </div>
);

export default Metric;
