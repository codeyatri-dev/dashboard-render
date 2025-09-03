import React from "react";
import { motion } from "framer-motion";

const Modal = ({ children, onClose, zIndex = 60 }) => (
  <div style={{ zIndex }} className="fixed inset-0 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative w-full max-w-3xl mx-4 rounded-2xl p-6 bg-slate-900/95 border border-cyan-500/20 shadow-xl max-h-[90vh] overflow-y-auto"
    >
      {children}
    </motion.div>
  </div>
);

export default Modal;
