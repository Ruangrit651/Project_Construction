import React, { useState, useEffect } from "react";
import { Table, Text } from "@radix-ui/themes";
import { getTask, updateStartDateTask, updateEndDateTask } from "@/services/task.service";
import { getSubtask, updateStartDateSubtask, updateEndDateSubtask } from "@/services/subtask.service";
import DialogEditTask from "./components/DialogEditTask";
import DialogEditSubTask from "./components/DialogEditSubtask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { ChevronDownIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";

// Interfaces
interface Task {
  taskId: string;
  taskName: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  startCol?: number;
  span?: number;
  subtasks?: Subtask[];
  progress?: number;
  assignee?: string;
  priority?: string;
}

interface Subtask {
  subtaskId: string;
  subtaskName: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  startCol?: number;
  span?: number;
  progress?: number;
  assignee?: string;
  priority?: string;
}

interface DateTableProps {
  year: number;
  tasks: Task[];
  fetchTasks: () => void;
  fetchSubtasks: () => void;
}

// Utility Functions
const parseDate = (dateString: string) => {
  try {
    if (!dateString) return new Date();
    if (dateString.includes('/')) {
      const [day, month, yearShort] = dateString.split("/").map(Number);
      const year = yearShort < 100 ? 2000 + yearShort : yearShort;
      // สร้างวันที่โดยกำหนดเวลาเป็น 00:00:00
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    // ถ้าเป็น ISO string ให้แปลงเป็นวันที่และกำหนดเวลาเป็น 00:00:00
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return new Date();
  }
};

const isWeekend = (year: number, dayOfYear: number) => {
  const date = new Date(year, 0, dayOfYear);
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isToday = (year: number, dayOfYear: number) => {
  const today = new Date();
  const date = new Date(year, 0, dayOfYear);
  return today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear();
};

const calculateStartColAndSpan = (startDate: string, endDate: string, year: number) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const fullYear = year;

  if (start.getFullYear() !== fullYear && end.getFullYear() !== fullYear) {
    return { startCol: 0, span: 0 };
  }

  const startCol = Math.max(
    1,
    Math.floor((start.getTime() - new Date(fullYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const endCol = Math.min(
    365,
    Math.floor((end.getTime() - new Date(fullYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const span = endCol - startCol + 1;
  return { startCol, span };
};

// แยกฟังก์ชันสำหรับ format วันที่ใน tooltip
const formatDateForTooltip = (date: Date) => {
  try {
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", date);
      return "Invalid Date";
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date for tooltip:", date, error);
    return "Invalid Date";
  }
};

// ฟังก์ชันสำหรับ format วันที่จาก string
const formatDateFromString = (dateString: string) => {
  try {
    const date = parseDate(dateString);
    return formatDateForTooltip(date);
  } catch (error) {
    console.error("Error formatting date from string:", dateString, error);
    return "Invalid Date";
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500';
    case 'in progress':
      return 'bg-blue-500';
    case 'delayed':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-green-700';
    case 'in progress':
      return 'text-blue-700';
    case 'delayed':
      return 'text-red-700';
    case 'pending':
      return 'text-yellow-700';
    default:
      return 'text-gray-700';
  }
};

// Add new utility functions
const snapToGrid = (pixels: number) => {
  const cellWidth = 40; // Width of each day cell
  const snapped = Math.round(pixels / cellWidth) * cellWidth;
  return snapped;
};

const getDateFromPosition = (position: number, year: number): Date => {
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor(position / 40); // 40px per day
  const date = new Date(startOfYear);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Add a utility function to get the name
const getName = (item: Task | Subtask): string => {
  return 'taskName' in item ? item.taskName : item.subtaskName;
};

// เพิ่มฟังก์ชันใหม่สำหรับคำนวณวันที่แบบ Grid
const getGridDate = (position: number, year: number): Date => {
  const gridSize = 40; // 40px per day
  const gridIndex = Math.floor(position / gridSize);
  const startOfYear = new Date(year, 0, 1);
  const date = new Date(startOfYear);
  date.setDate(date.getDate() + gridIndex);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Main Component
const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | Subtask | null>(null);
  const [resizingTask, setResizingTask] = useState<Task | Subtask | null>(null);
  const [resizeDirection, setResizeDirection] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    setTaskList(tasks); 
  }, [tasks]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .timeline-container {
        background: #FFFFFF;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .timeline-header {
        background: #F4F5F7;
        border-bottom: 1px solid #DFE1E6;
        padding: 12px 16px;
      }

      .timeline-grid {
        display: grid;
        grid-template-columns: 300px 1fr;
        min-height: 600px;
      }

      .timeline-sidebar {
        border-right: 1px solid #DFE1E6;
        background: #FFFFFF;
      }

      .timeline-content {
        overflow-x: auto;
        background: #FFFFFF;
        position: relative;
      }

      .task-bar {
        height: 24px;
        border-radius: 3px;
        transition: all 0.2s ease;
        position: absolute;
        user-select: none;
        font-size: 12px;
        font-weight: 500;
        z-index: 1;
        cursor: move;
      }

      .task-bar:hover {
        opacity: 1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 2;
      }

      .task-bar.dragging {
        opacity: 1;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        z-index: 50;
      }

      .resize-handle {
        width: 8px;
        height: 100%;
        position: absolute;
        top: 0;
        cursor: col-resize;
        opacity: 0;
        transition: all 0.2s ease;
        z-index: 3;
      }

      .resize-handle:hover {
        opacity: 1;
        background: rgba(255,255,255,0.4);
      }

      .resize-handle.start {
        left: 0;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
      }

      .resize-handle.end {
        right: 0;
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
      }

      .resize-handle.dragging {
        opacity: 1;
        background: rgba(255,255,255,0.6);
      }

      .timeline-cell {
        min-width: 40px;
        height: 40px;
        border-right: 1px solid #DFE1E6;
        border-bottom: 1px solid #DFE1E6;
        position: relative;
      }

      .timeline-cell.weekend {
        background: #F8F9FA;
      }

      .timeline-cell.today {
        background: #E6FCFF;
        position: relative;
      }

      .timeline-cell.today::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #00B8D9;
      }

      .timeline-cell.today::after {
        content: 'Today';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        font-weight: 600;
        color: #00B8D9;
        background: rgba(0, 184, 217, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
      }

      .task-tooltip {
        position: absolute;
        background: #172B4D;
        color: white;
        padding: 8px 12px;
        border-radius: 3px;
        font-size: 12px;
        z-index: 100;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        min-width: 200px;
        pointer-events: none;
      }

      .task-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255,255,255,0.3);
        transition: width 0.3s ease;
      }

      .task-progress-bar {
        height: 100%;
        background: #FFFFFF;
        border-radius: 1px;
      }

      .task-status {
        position: absolute;
        top: 2px;
        right: 4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .task-priority {
        position: absolute;
        top: 2px;
        left: 4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .subtask-indicator {
        position: absolute;
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #DFE1E6;
      }

      .month-header {
        background: #F4F5F7;
        border-bottom: 1px solid #DFE1E6;
        padding: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #172B4D;
      }

      .day-header {
        text-align: center;
        padding: 4px;
        font-size: 11px;
        color: #6B778C;
      }

      .weekend-header {
        color: #97A0AF;
      }

      .task-row {
        position: relative;
        height: 40px;
        border-bottom: 1px solid #DFE1E6;
      }

      .task-row:hover {
        background-color: #F8F9FA;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent, task: Task | Subtask, type: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggedTask(task);
    document.body.style.cursor = "col-resize";

    const target = e.currentTarget as HTMLElement;
    const taskBar = target.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    target.dataset.dragging = "true";
    target.dataset.dragType = type;
    target.dataset.startX = e.clientX.toString();
    target.dataset.originalLeft = taskBar.style.left;
    target.dataset.originalWidth = taskBar.style.width;
    target.dataset.taskId = 'taskId' in task ? task.taskId : task.subtaskId;

    taskBar.classList.add("dragging");

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!draggedTask) return;
    e.preventDefault();

    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement;
    if (!draggingElement) return;

    const taskBar = draggingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const startX = parseInt(draggingElement.dataset.startX || "0", 10);
    const originalLeft = parseInt(draggingElement.dataset.originalLeft || "0", 10);
    const originalWidth = parseInt(draggingElement.dataset.originalWidth || "0", 10);
    const dragType = draggingElement.dataset.dragType;
    const deltaX = e.clientX - startX;
    
    // คำนวณจำนวนวันที่ต้องบวก/ลบ (1 วัน = 40px)
    const daysToMove = Math.floor(deltaX / 40);
    
    let newLeft = originalLeft;
    let newWidth = originalWidth;

    if (dragType === 'start') {
      newLeft = originalLeft + (daysToMove * 40);
      newWidth = originalWidth - (daysToMove * 40);
      if (newWidth >= 40) {
        taskBar.style.left = `${newLeft}px`;
        taskBar.style.width = `${newWidth}px`;
      }
    } else if (dragType === 'end') {
      newWidth = originalWidth + (daysToMove * 40);
      if (newWidth >= 40) {
        taskBar.style.width = `${newWidth}px`;
      }
    }

    // คำนวณวันที่ใหม่
    const startDate = parseDate(draggedTask.startDate);
    const endDate = parseDate(draggedTask.endDate);
    
    let newStartDate = new Date(startDate);
    let newEndDate = new Date(endDate);

    if (dragType === 'start') {
      newStartDate.setDate(startDate.getDate() + daysToMove);
      newStartDate.setHours(0, 0, 0, 0);
    } else {
      newEndDate.setDate(endDate.getDate() + daysToMove);
      newEndDate.setHours(0, 0, 0, 0);
    }

    // Calculate duration in days
    const duration = Math.round((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Update tooltip with current dates and days moved
    const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
    if (tooltip) {
      const daysMovedText = daysToMove > 0 ? `(+${daysToMove} days)` : daysToMove < 0 ? `(${daysToMove} days)` : '';
      tooltip.innerHTML = `
        <div class="font-medium mb-1">${getName(draggedTask)}</div>
        <div class="text-xs text-gray-300">
          <div>Current Start: ${formatDateForTooltip(newStartDate)} ${dragType === 'start' ? daysMovedText : ''}</div>
          <div>Current End: ${formatDateForTooltip(newEndDate)} ${dragType === 'end' ? daysMovedText : ''}</div>
          <div>Duration: ${duration} days</div>
        </div>
      `;
      tooltip.style.display = 'block';
    }

    // Store the calculated dates and days moved in the dataset
    taskBar.dataset.newStartDate = newStartDate.toISOString();
    taskBar.dataset.newEndDate = newEndDate.toISOString();
    taskBar.dataset.daysMoved = daysToMove.toString();
  };

  const handleDragEnd = async (e: MouseEvent) => {
    if (!draggedTask) return;
    e.preventDefault();

    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement;
    if (!draggingElement) return;

    const taskBar = draggingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const dragType = draggingElement.dataset.dragType;
    const daysMoved = parseInt(taskBar.dataset.daysMoved || "0", 10);

    if (daysMoved === 0) {
      resetDragUI(draggingElement, taskBar);
      return;
    }

    try {
      const isSubtask = 'subtaskId' in draggedTask;
      const taskId = isSubtask ? draggedTask.subtaskId : draggedTask.taskId;
      const startDate = parseDate(draggedTask.startDate);
      const endDate = parseDate(draggedTask.endDate);
      let updatedStartDate = startDate;
      let updatedEndDate = endDate;

      if (dragType === 'start') {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(startDate.getDate() + daysMoved);
        newStartDate.setHours(0, 0, 0, 0);
        
        if (newStartDate < endDate) {
          if (isSubtask) {
            await updateStartDateSubtask({
              subtask_id: taskId,
              start_date: newStartDate.toISOString().split('T')[0]
            });
          } else {
            await updateStartDateTask({
              task_id: taskId,
              start_date: newStartDate.toISOString().split('T')[0]
            });
          }

          // อัพเดทข้อมูลในตัวแปร tasks โดยตรง
          const updatedTasks = tasks.map(task => {
            if (isSubtask) {
              // ถ้าเป็น subtask ให้อัพเดทใน subtasks array
              if (task.subtasks) {
                const updatedSubtasks = task.subtasks.map(subtask => {
                  if (subtask.subtaskId === taskId) {
                    return {
                      ...subtask,
                      startDate: newStartDate.toISOString().split('T')[0]
                    };
                  }
                  return subtask;
                });
                return { ...task, subtasks: updatedSubtasks };
              }
            } else if (task.taskId === taskId) {
              return {
                ...task,
                startDate: newStartDate.toISOString().split('T')[0]
              };
            }
            return task;
          });
          setTaskList(updatedTasks);
          updatedStartDate = newStartDate;
        }
      } else if (dragType === 'end') {
        const newEndDate = new Date(endDate);
        newEndDate.setDate(endDate.getDate() + daysMoved);
        newEndDate.setHours(0, 0, 0, 0);
        
        if (newEndDate > startDate) {
          if (isSubtask) {
            await updateEndDateSubtask({
              subtask_id: taskId,
              end_date: newEndDate.toISOString().split('T')[0]
            });
          } else {
            await updateEndDateTask({
              task_id: taskId,
              end_date: newEndDate.toISOString().split('T')[0]
            });
          }

          // อัพเดทข้อมูลในตัวแปร tasks โดยตรง
          const updatedTasks = tasks.map(task => {
            if (isSubtask) {
              // ถ้าเป็น subtask ให้อัพเดทใน subtasks array
              if (task.subtasks) {
                const updatedSubtasks = task.subtasks.map(subtask => {
                  if (subtask.subtaskId === taskId) {
                    return {
                      ...subtask,
                      endDate: newEndDate.toISOString().split('T')[0]
                    };
                  }
                  return subtask;
                });
                return { ...task, subtasks: updatedSubtasks };
              }
            } else if (task.taskId === taskId) {
              return {
                ...task,
                endDate: newEndDate.toISOString().split('T')[0]
              };
            }
            return task;
          });
          setTaskList(updatedTasks);
          updatedEndDate = newEndDate;
        }
      }

      // อัพเดท UI โดยตรง
      const { startCol, span } = calculateStartColAndSpan(
        updatedStartDate.toISOString().split('T')[0],
        updatedEndDate.toISOString().split('T')[0],
        year
      );

      taskBar.style.left = `${(startCol - 1) * 40}px`;
      taskBar.style.width = `${span * 40}px`;


    } catch (error) {
      console.error("Error updating dates:", error);
    }

    // Reset UI
    resetDragUI(draggingElement, taskBar);
  };

  // Helper function to reset UI after drag
  const resetDragUI = (draggingElement: HTMLElement, taskBar: HTMLElement) => {
    draggingElement.dataset.dragging = "false";
    draggingElement.dataset.dragType = "";
    taskBar.style.transform = "";
    taskBar.classList.remove("dragging");
    document.body.style.cursor = "default";
    setDraggedTask(null);

    // Clear stored data
    delete taskBar.dataset.newStartDate;
    delete taskBar.dataset.newEndDate;
    delete taskBar.dataset.daysMoved;

    // Hide tooltip
    const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.display = 'none';
    }

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task | Subtask, direction: "start" | "end") => {
    e.preventDefault();
    e.stopPropagation();

    setResizingTask(task);
    setResizeDirection(direction);
    document.body.style.cursor = direction === "start" ? "w-resize" : "e-resize";

    const target = e.currentTarget as HTMLElement;
    const taskBar = target.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    target.dataset.resizing = direction;
    target.dataset.startX = e.clientX.toString();
    target.dataset.originalWidth = taskBar.style.width;
    target.dataset.originalLeft = taskBar.style.left;

    taskBar.classList.add("resizing");

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingTask || !resizeDirection) return;
    e.preventDefault();

    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const taskBar = resizingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const originalWidth = parseInt(resizingElement.dataset.originalWidth || "0", 10);
    const originalLeft = parseInt(resizingElement.dataset.originalLeft || "0", 10);
    const deltaX = e.clientX - startX;
    const snappedDeltaX = snapToGrid(deltaX);

    if (resizeDirection === "start") {
      const newLeft = originalLeft + snappedDeltaX;
      const newWidth = originalWidth - snappedDeltaX;

      if (newWidth >= 40) { // Minimum width of 1 day
        taskBar.style.left = `${newLeft}px`;
        taskBar.style.width = `${newWidth}px`;
      }
    } else {
      const newWidth = originalWidth + snappedDeltaX;
      if (newWidth >= 40) { // Minimum width of 1 day
        taskBar.style.width = `${newWidth}px`;
      }
    }

    // Update tooltip with new dates
    const newStartDate = resizeDirection === "start"
      ? getDateFromPosition(parseInt(taskBar.style.left), year)
      : getDateFromPosition(originalLeft, year);
    const newEndDate = resizeDirection === "end"
      ? getDateFromPosition(parseInt(taskBar.style.left) + parseInt(taskBar.style.width), year)
      : getDateFromPosition(originalLeft + parseInt(taskBar.style.width), year);

    const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.innerHTML = `
        <div class="font-medium mb-1">${getName(resizingTask)}</div>
        <div class="text-xs text-gray-300">
          <div>Resizing ${resizeDirection}</div>
          <div>New Start: ${formatDateForTooltip(newStartDate)}</div>
          <div>New End: ${formatDateForTooltip(newEndDate)}</div>
        </div>
      `;
    }
  };

  const handleResizeEnd = async (e: MouseEvent) => {
    if (!resizingTask || !resizeDirection) return;
    e.preventDefault();

    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 40);

    if (daysMoved !== 0) {
      try {
        // Check if it's a task or subtask
        const taskId = 'taskId' in resizingTask ? resizingTask.taskId : resizingTask.subtaskId;

        if (resizeDirection === "start") {
          const newStartDate = new Date(parseDate(resizingTask.startDate));
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
          const formattedStartDate = newStartDate.toISOString().split('T')[0];

          if (newStartDate < parseDate(resizingTask.endDate)) {
            await updateStartDateTask({
              task_id: taskId,
              start_date: formattedStartDate
            });
          }
        } else {
          const newEndDate = new Date(parseDate(resizingTask.endDate));
          newEndDate.setDate(newEndDate.getDate() + daysMoved);
          const formattedEndDate = newEndDate.toISOString().split('T')[0];

          if (newEndDate > parseDate(resizingTask.startDate)) {
            await updateEndDateTask({
              task_id: taskId,
              end_date: formattedEndDate
            });
          }
        }

        fetchTasks();
      } catch (error) {
        console.error("Error updating task date:", error);
      }
    }

    // Reset UI
    resizingElement.dataset.resizing = "";
    resizingElement.style.transform = "";
    resizingElement.style.width = "";
    document.body.style.cursor = "default";
    setResizingTask(null);
    setResizeDirection(null);

    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Update the task bar rendering
  const renderTaskBar = (task: Task | Subtask, isSubtask: boolean = false) => {
    const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
    const progress = task.progress || 0;

    return (
      <div
        className={`task-bar ${getStatusColor(task.status)} group`}
        style={{
          position: "absolute",
          left: `${(startCol - 1) * 40}px`,
          width: `${span * 40}px`,
          top: "8px",
        }}
      >
        <div
          className="resize-handle start"
          onMouseDown={(e) => handleDragStart(e, task, 'start')}
        />
        <div
          className="resize-handle end"
          onMouseDown={(e) => handleDragStart(e, task, 'end')}
        />
        <div className="px-2 py-1 text-white text-xs truncate flex items-center justify-between">
          <span>{getName(task)}</span>
          {task.priority && (
            <div className={`task-priority ${getPriorityColor(task.priority)}`} />
          )}
          {task.status && (
            <div className={`task-status ${getStatusColor(task.status)}`} />
          )}
        </div>
        <div className="task-progress">
          <div
            className="task-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="task-tooltip hidden group-hover:block">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">{getName(task)}</div>
              <div className="text-xs text-gray-400">{task.description}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{span} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Start:</span>
              <span className="text-white">{formatDateFromString(task.startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">End:</span>
              <span className="text-white">{formatDateFromString(task.endDate)}</span>
            </div>
            {task.assignee && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Assignee:</span>
                <span className="text-white">{task.assignee}</span>
              </div>
            )}
            {task.priority && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Priority:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            )}
            {task.budget && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Budget:</span>
                <span className="text-white">${task.budget.toLocaleString()}</span>
              </div>
            )}
            {task.progress !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getStatusColor(task.status)} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // เพิ่มฟังก์ชันใหม่สำหรับการเรียงลำดับ task และ subtask
  const sortTasks = (tasks: Task[]) => {
    return tasks.map(task => {
      if (task.subtasks) {
        // เรียง subtasks ตามวันที่เริ่มต้น
        const sortedSubtasks = [...task.subtasks].sort((a, b) => {
          const dateA = new Date(a.startDate).getTime();
          const dateB = new Date(b.startDate).getTime();
          return dateA - dateB;
        });
        return { ...task, subtasks: sortedSubtasks };
      }
      return task;
    }).sort((a, b) => {
      // เรียง tasks ตามวันที่เริ่มต้น
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  };

  // อัพเดท useEffect สำหรับการเรียงลำดับ tasks
  useEffect(() => {
    const sortedTasks = sortTasks(tasks);
    setTaskList(sortedTasks);
  }, [tasks]);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2 className="text-lg font-semibold text-gray-900">{year} Project Timeline</h2>
      </div>

      <div className="timeline-grid">
        {/* Sidebar */}
        <div className="timeline-sidebar">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Tasks</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <DotsHorizontalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {taskList.map((task) => (
              <div key={task.taskId} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSubtasks(task.taskId)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedTasks.includes(task.taskId) ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                    <DialogEditTask
                      getTaskData={fetchTasks}
                      fetchTasks={fetchTasks}
                      taskId={task.taskId}
                      trigger={
                        <Text className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                          {task.taskName}
                        </Text>
                      }
                    />
                  </div>
                  <DialogAddSubTask
                    getSubtaskData={fetchSubtasks}
                    taskId={task.taskId}
                    taskName={task.taskName}
                  />
                </div>

                {expandedTasks.includes(task.taskId) &&
                  task.subtasks?.map((subtask) => (
                    <div key={subtask.subtaskId} className="ml-6 mt-2 p-2 bg-gray-50 rounded">
                      <DialogEditSubTask
                        getSubtaskData={fetchSubtasks}
                        subtaskId={subtask.subtaskId}
                        trigger={
                          <Text className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer">
                            {subtask.subtaskName}
                          </Text>
                        }
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Content */}
        <div className="timeline-content">
          <div className="sticky top-0 bg-white z-10">
            <div className="flex">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const month = new Date(year, monthIndex).toLocaleString("default", { month: "short" });
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                return (
                  <div
                    key={monthIndex}
                    className="flex-1 border-r border-gray-200"
                    style={{ minWidth: `${daysInMonth * 40}px` }}
                  >
                    <div className="month-header">
                      {month}
                    </div>
                    <div className="flex">
                      {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const dayOfYear = dayIndex + 1 + new Date(year, 0, 0).getDate();
                        const isWeekendDay = isWeekend(year, dayOfYear);
                        return (
                          <div
                            key={dayIndex}
                            className={`timeline-cell ${isWeekendDay ? "weekend" : ""} ${isToday(year, dayOfYear) ? "today" : ""
                              }`}
                          >
                            <div className={`day-header ${isWeekendDay ? "weekend-header" : ""}`}>
                              {dayIndex + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            {taskList.map((task) => (
              <React.Fragment key={task.taskId}>
                {/* Main Task */}
                <div className="task-row">
                  {renderTaskBar(task)}
                </div>

                {/* Subtasks */}
                {expandedTasks.includes(task.taskId) &&
                  task.subtasks?.map((subtask) => (
                    <div key={subtask.subtaskId} className="task-row ml-4">
                      {renderTaskBar(subtask, true)}
                    </div>
                  ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTable;

