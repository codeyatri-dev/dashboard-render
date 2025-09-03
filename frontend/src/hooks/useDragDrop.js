import { useState } from "react";

const useDragDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, item, sourceColumn) => {
    setDraggedItem({ item, sourceColumn });
    try { e.dataTransfer.effectAllowed = 'move'; } catch {}
  };

  const handleDragOver = (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumn(targetColumn);
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  };

  const handleDrop = (e, targetColumn, onMove) => {
    e.preventDefault();
    if (draggedItem && draggedItem.sourceColumn !== targetColumn && typeof onMove === 'function') onMove(draggedItem.item, draggedItem.sourceColumn, targetColumn);
    setDraggedItem(null); setDragOverColumn(null);
  };

  const handleDragEnd = () => { setDraggedItem(null); setDragOverColumn(null); };

  return { draggedItem, dragOverColumn, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
};

export default useDragDrop;
