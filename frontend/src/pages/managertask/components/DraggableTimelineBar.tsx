import React, { useState, useRef } from 'react';
import { patchTask } from '@/services/task.service';
import { patchSubtask } from '@/services/subtask.service';
import { PayloadUpdateTask } from "@/types/requests/request.task";
import { PayloadUpdateSubtask } from "@/types/requests/request.subtask";

interface DraggableTimelineBarProps {
  id: string;
  isSubtask: boolean;
  startDate: string;
  endDate: string;
  startCol: number;
  span: number;
  year: number;
  status: string | boolean;
  colorClass: string;
  taskName?: string;
  subtaskName?: string;
  onUpdateSuccess: () => void;
}

const DraggableTimelineBar: React.FC<DraggableTimelineBarProps> = ({
  id,
  isSubtask,
  startDate,
  endDate,
  startCol,
  span,
  year,
  status,
  colorClass,
  taskName = '',
  subtaskName = '',
  onUpdateSuccess
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [resizeOffset, setResizeOffset] = useState<number>(0);
  const [temporaryStartCol, setTemporaryStartCol] = useState<number>(startCol);
  const [temporarySpan, setTemporarySpan] = useState<number>(span);
  const barRef = useRef<HTMLDivElement>(null);

  // Convert column position to date
  const colToDate = (col: number, isEndDate: boolean = false): string => {
    const date = new Date(year, col - 1, isEndDate ? 0 : 1);
    if (isEndDate) {
      date.setMonth(col);
      date.setDate(0);
    }
    return date.toISOString().split('T')[0];
  };

  // Handle mouse down for dragging the entire bar
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragOffset(e.clientX - rect.left);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse down for resizing the bar (right edge)
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeOffset(e.clientX);
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Handle mouse move during dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !barRef.current) return;
    
    const cellWidth = 100;
    const tableContainer = barRef.current.closest('.overflow-x-auto');
    if (!tableContainer) return;
    
    const containerRect = tableContainer.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left - dragOffset;
    
    const gridOffset = 4;
    const movedCells = Math.round(relativeX / cellWidth) - gridOffset;
    let newStartCol = Math.max(1, Math.min(12 - temporarySpan + 1, movedCells + 1));
    
    setTemporaryStartCol(newStartCol);
  };

  // Handle mouse move during resizing
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !barRef.current) return;
    
    const cellWidth = 100;
    const deltaX = e.clientX - resizeOffset;
    const deltaColumns = Math.round(deltaX / cellWidth);
    
    const newSpan = Math.max(1, Math.min(13 - temporaryStartCol, span + deltaColumns));
    setTemporarySpan(newSpan);
    setResizeOffset(e.clientX);
  };

  // Handle mouse up for dragging
  const handleMouseUp = async () => {
    if (!isDragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    if (temporaryStartCol !== startCol) {
      const newStartDate = colToDate(temporaryStartCol);
      const newEndDate = colToDate(temporaryStartCol + temporarySpan - 1, true);
      
      try {
        if (isSubtask) {
          const updateData: PayloadUpdateSubtask = {
            subtask_id: id,
            start_date: newStartDate,
            end_date: newEndDate,
            subtask_name: subtaskName || '',
            status: typeof status === 'string' ? status : status ? 'done' : 'in progress'
          };
          await patchSubtask(updateData);
        } else {
          const updateData: PayloadUpdateTask = {
            task_name: taskName || '',
            start_date: newStartDate,
            end_date: newEndDate,
            status: typeof status === 'string' ? status : status ? 'done' : 'in progress'
          };
          await patchTask(updateData);
        }
        onUpdateSuccess();
      } catch (error) {
        console.error("Error updating dates:", error);
        setTemporaryStartCol(startCol);
        setTemporarySpan(span);
      }
    }
    
    setIsDragging(false);
  };

  // Handle mouse up for resizing
  const handleResizeEnd = async () => {
    if (!isResizing) return;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    if (temporarySpan !== span) {
      const newEndDate = colToDate(temporaryStartCol + temporarySpan - 1, true);
      
      try {
        if (isSubtask) {
          const updateData: PayloadUpdateSubtask = {
            subtask_id: id,
            end_date: newEndDate,
            subtask_name: subtaskName || '',
            status: typeof status === 'string' ? status : status ? 'done' : 'in progress'
          };
          await patchSubtask(updateData);
        } else {
          const updateData: PayloadUpdateTask = {
            task_name: taskName || '',
            end_date: newEndDate,
            status: typeof status === 'string' ? status : status ? 'done' : 'in progress'
          };
          await patchTask(updateData);
        }
        onUpdateSuccess();
      } catch (error) {
        console.error("Error updating end date:", error);
        setTemporarySpan(span);
      }
    }
    
    setIsResizing(false);
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div
      ref={barRef}
      className={`${colorClass} cursor-grab rounded-md relative ${isDragging ? 'opacity-70' : ''} group`}
      style={{ 
        gridColumn: `${temporaryStartCol} / span ${temporarySpan}`,
        height: isSubtask ? '4px' : '6px',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute right-0 top-0 bottom-0 w-2 bg-white bg-opacity-20 cursor-e-resize"
        onMouseDown={handleResizeStart}
      />
      
      <div className="absolute -top-6 left-0 right-0 text-xs text-center opacity-0 group-hover:opacity-100 bg-white shadow-sm px-1 py-0.5 rounded z-20">
        {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
      </div>
    </div>
  );
};

export default DraggableTimelineBar;