import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ConfettiPiece = ({ x, y, rotation, color }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{ backgroundColor: color }}
    initial={{ x, y, rotate: rotation, opacity: 1 }}
    animate={{
      y: y + window.innerHeight + 100,
      x: x + (Math.random() - 0.5) * 200,
      rotate: rotation + 360,
      opacity: 0
    }}
    transition={{
      duration: 3 + Math.random() * 2
    }}
  />
);

const CustomConfetti = ({ show }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (show) {
      const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080', '#8000ff'];
      const newPieces = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setPieces(newPieces);

      const t = setTimeout(() => setPieces([]), 4500);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </div>
  );
};

export default CustomConfetti;
