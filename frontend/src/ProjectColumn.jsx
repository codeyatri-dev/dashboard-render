import React from 'react';
import { motion } from 'framer-motion';

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

export default function ProjectColumn({ id, title, count, items, onSelect, onMove, dragHandlers }) {
  // ... rest of your existing ProjectColumn code ...
}
