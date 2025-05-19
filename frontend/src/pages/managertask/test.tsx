import React, { useState, useEffect } from "react";
import { Table, Text } from "@radix-ui/themes";
import { getTask, updateStartDateTask, updateEndDateTask } from "@/services/task.service";
import { getSubtask, updateStartDateSubtask, updateEndDateSubtask } from "@/services/subtask.service";
import DialogEditTask from "./components/DialogEditTask";
import DialogEditSubTask from "./components/DialogEditSubtask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { ChevronDownIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  TimelineContainer,
  TimelineHeader,
  TimelineGrid,
  TimelineSidebar,
  TimelineContent,
  TimelineContentInner,
  TaskRow,
  SubtaskRow,
  TaskBar,
  ResizeHandle,
  TaskTooltip,
  TaskProgress,
  StatusIndicator,
  PriorityIndicator,
  MonthHeader,
  DayCell
} from './components/Tailwind';

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
  projectId?: string | null;
  // เพิ่ม props ใหม่
  updateTaskStatus?: (taskId: string) => void;
  addSubtaskToState?: (taskId: string, newSubtask: any) => void;
}

// Utility Functions
const parseDate = (dateString: string) => {
  try {
    if (!dateString) return new Date();
    if (dateString.includes('/')) {
      const [day, month, yearShort] = dateString.split("/").map(Number);
      const year = yearShort < 100 ? 2000 + yearShort : yearShort;
      // สร้างวันที่โดยกำหนดเวลาเป็น 7:00:00
      return new Date(year, month - 1, day, 7, 0, 0, 0);
    }
    // ถ้าเป็น ISO string ให้แปลงเป็นวันที่และกำหนดเวลาเป็น 7:00:00
    const date = new Date(dateString);
    date.setHours(7, 0, 0, 0);
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

// แก้ไขฟังก์ชัน isToday ให้ถูกต้อง
const isToday = (year: number, monthIndex: number, dayOfMonth: number) => {
  const today = new Date();

  // ตรวจสอบทั้ง ปี เดือน และวัน
  return today.getDate() === dayOfMonth &&
    today.getMonth() === monthIndex &&
    today.getFullYear() === year;
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
  date.setHours(7, 0, 0, 0); // เปลี่ยนจาก 0 เป็น 7
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
  date.setHours(7, 0, 0, 0);
  return date;
};

// Main Component
const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks, projectId, updateTaskStatus,
  addSubtaskToState }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | Subtask | null>(null);
  const [resizingTask, setResizingTask] = useState<Task | Subtask | null>(null);
  const [resizeDirection, setResizeDirection] = useState<"start" | "end" | null>(null);

  // ในส่วน useEffect ที่ประกาศ style
  useEffect(() => {
    setTaskList(tasks);

    // เพิ่ม CSS สำหรับ animations ต่างๆ
    const style = document.createElement('style');
    style.textContent = `
  /* โค้ด CSS เดิม... */
  
  /* เอฟเฟกต์สำหรับเส้นไฮไลท์วันปัจจุบัน - เปลี่ยนเป็นสีแดง */
  .today-line {
    animation: glow 2s infinite alternate;
    position: relative;
  }
  
  /* เพิ่มสไตล์สำหรับ highlight-flash */
  .highlight-flash {
    animation: flash 0.7s ease-in-out 3;
  }
  
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [tasks]);

  const handleDragStart = (e: React.MouseEvent, task: Task | Subtask, type: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();

    setDraggedTask(task);
    document.body.style.cursor = "grabbing"; // เปลี่ยนเป็น grabbing แทน col-resize

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

    // เพิ่ม tooltip บอกจำนวนวันที่กำลังจะเลื่อน ถ้ายังไม่มี
    if (!taskBar.querySelector('.drag-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.className = 'drag-tooltip absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 bg-gray-800 text-white px-2 py-1 rounded text-xs z-40';
      taskBar.appendChild(tooltip);
    }

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
      newStartDate.setHours(7, 0, 0, 0);
    } else {
      newEndDate.setDate(endDate.getDate() + daysToMove);
      newEndDate.setHours(7, 0, 0, 0);
    }

    // Calculate duration in days
    const duration = Math.round((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // แสดง tooltip ทั้งใน task-tooltip และ drag-tooltip
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

    // อัพเดท drag-tooltip
    const dragTooltip = taskBar.querySelector('.drag-tooltip') as HTMLElement;
    if (dragTooltip) {
      dragTooltip.textContent = `${daysToMove > 0 ? '+' : ''}${daysToMove} day${Math.abs(daysToMove) !== 1 ? 's' : ''}`;
      dragTooltip.style.display = 'block';
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
      let newStartDateString = draggedTask.startDate;
      let newEndDateString = draggedTask.endDate;

      if (dragType === 'start') {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(startDate.getDate() + daysMoved);
        newStartDate.setHours(7, 0, 0, 0);

        if (newStartDate < endDate) {
          newStartDateString = newStartDate.toISOString().split('T')[0];

          if (isSubtask) {
            await updateStartDateSubtask({
              subtask_id: taskId,
              start_date: newStartDateString
            });
          } else {
            await updateStartDateTask({
              task_id: taskId,
              start_date: newStartDateString
            });
          }

          updatedStartDate = newStartDate;
        }
      } else if (dragType === 'end') {
        const newEndDate = new Date(endDate);
        newEndDate.setDate(endDate.getDate() + daysMoved);
        newEndDate.setHours(7, 0, 0, 0);

        if (newEndDate > startDate) {
          newEndDateString = newEndDate.toISOString().split('T')[0];

          if (isSubtask) {
            await updateEndDateSubtask({
              subtask_id: taskId,
              end_date: newEndDateString
            });
          } else {
            await updateEndDateTask({
              task_id: taskId,
              end_date: newEndDateString
            });
          }

          updatedEndDate = newEndDate;
        }
      }

      // อัพเดต state โดยตรงแทนที่จะเรียก fetchTasks()
      setTaskList(prevTasks => {
        return prevTasks.map(task => {
          if (isSubtask) {
            if (task.subtasks) {
              const updatedSubtasks = task.subtasks.map(subtask => {
                if (subtask.subtaskId === taskId) {
                  return {
                    ...subtask,
                    startDate: dragType === 'start' ? newStartDateString : subtask.startDate,
                    endDate: dragType === 'end' ? newEndDateString : subtask.endDate
                  };
                }
                return subtask;
              });
              return { ...task, subtasks: updatedSubtasks };
            }
          } else if (task.taskId === taskId) {
            return {
              ...task,
              startDate: dragType === 'start' ? newStartDateString : task.startDate,
              endDate: dragType === 'end' ? newEndDateString : task.endDate
            };
          }
          return task;
        });
      });

      // อัพเดต UI โดยตรง
      const { startCol, span } = calculateStartColAndSpan(
        updatedStartDate.toISOString().split('T')[0],
        updatedEndDate.toISOString().split('T')[0],
        year
      );

      taskBar.style.left = `${(startCol - 1) * 40}px`;
      taskBar.style.width = `${span * 40}px`;

    } catch (error) {
      console.error("Error updating dates:", error);
    } finally {
      // สำคัญ: ต้องรีเซ็ต UI ในทุกกรณี
      resetDragUI(draggingElement, taskBar);
    }
  };

  // Helper function to reset UI after drag
  const resetDragUI = (draggingElement: HTMLElement, taskBar: HTMLElement) => {
    // ล้างข้อมูลใน dataset
    if (draggingElement) {
      draggingElement.dataset.dragging = "false";
      draggingElement.dataset.dragType = "";
      delete draggingElement.dataset.startX;
      delete draggingElement.dataset.originalLeft;
      delete draggingElement.dataset.originalWidth;
    }

    // รีเซ็ต styles ของ taskBar
    if (taskBar) {
      taskBar.classList.remove("dragging");
      taskBar.style.marginLeft = ""; // รีเซ็ต margin ถ้ามีการใช้

      // ล้างข้อมูลใน dataset ของ taskBar
      delete taskBar.dataset.newStartDate;
      delete taskBar.dataset.newEndDate;
      delete taskBar.dataset.daysMoved;

      // ซ่อน tooltip
      const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
      if (tooltip) {
        tooltip.style.display = 'none';
      }

      // ลบ drag-tooltip
      const dragTooltip = taskBar.querySelector('.drag-tooltip');
      if (dragTooltip) {
        dragTooltip.remove();
      }
    }

    // รีเซ็ต cursor
    document.body.style.cursor = "default";

    // รีเซ็ต state
    setDraggedTask(null);

    // ลบ event listeners
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
    // แก้ไขส่วนคำนวณวันที่จากตำแหน่งใน handleResizeMove
    const newStartDate = resizeDirection === "start"
      ? getDateFromPosition(parseInt(taskBar.style.left), year)
      : getDateFromPosition(originalLeft, year);

    // แก้ไขวิธีคำนวณวันสิ้นสุด
    const newEndDate = resizeDirection === "end"
      ? getDateFromPosition(parseInt(taskBar.style.left) + parseInt(taskBar.style.width), year)
      : getDateFromPosition(originalLeft + parseInt(taskBar.style.width), year);

    // Calculate duration
    const duration = Math.round((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.innerHTML = `
        <div class="font-medium mb-1">${getName(resizingTask)}</div>
        <div class="text-xs text-gray-300">
          <div>Resizing ${resizeDirection === "start" ? "start" : "end"}</div>
          <div>New Start: ${formatDateForTooltip(newStartDate)}</div>
          <div>New End: ${formatDateForTooltip(newEndDate)}</div>
          <div>Duration: ${duration} days</div>
        </div>
      `;
      tooltip.style.display = 'block';
    }
  };

  const handleResizeEnd = async (e: MouseEvent) => {
    if (!resizingTask || !resizeDirection) return;
    e.preventDefault();

    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const taskBar = resizingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 40);

    if (daysMoved !== 0) {
      try {
        // Check if it's a task or subtask
        const isSubtask = 'subtaskId' in resizingTask;
        const taskId = 'taskId' in resizingTask ? resizingTask.taskId : resizingTask.subtaskId;

        if (resizeDirection === "start") {
          const newStartDate = new Date(parseDate(resizingTask.startDate));
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
          newStartDate.setHours(7, 0, 0, 0);
          const formattedStartDate = newStartDate.toISOString().split('T')[0];

          if (newStartDate < parseDate(resizingTask.endDate)) {
            if (isSubtask) {
              await updateStartDateSubtask({
                subtask_id: taskId,
                start_date: formattedStartDate
              });
            } else {
              await updateStartDateTask({
                task_id: taskId,
                start_date: formattedStartDate
              });
            }

            // อัพเดต state โดยตรง
            setTaskList(prevTasks => {
              return prevTasks.map(task => {
                if (isSubtask) {
                  if (task.subtasks) {
                    const updatedSubtasks = task.subtasks.map(subtask => {
                      if (subtask.subtaskId === taskId) {
                        return {
                          ...subtask,
                          startDate: formattedStartDate
                        };
                      }
                      return subtask;
                    });
                    return { ...task, subtasks: updatedSubtasks };
                  }
                } else if (task.taskId === taskId) {
                  return {
                    ...task,
                    startDate: formattedStartDate
                  };
                }
                return task;
              });
            });
          }
        } else {
          const newEndDate = new Date(parseDate(resizingTask.endDate));
          newEndDate.setDate(newEndDate.getDate() + daysMoved);
          newEndDate.setHours(7, 0, 0, 0);
          const formattedEndDate = newEndDate.toISOString().split('T')[0];

          if (newEndDate > parseDate(resizingTask.startDate)) {
            if (isSubtask) {
              await updateEndDateSubtask({
                subtask_id: taskId,
                end_date: formattedEndDate
              });
            } else {
              await updateEndDateTask({
                task_id: taskId,
                end_date: formattedEndDate
              });
            }

            // อัพเดต state โดยตรง
            setTaskList(prevTasks => {
              return prevTasks.map(task => {
                if (isSubtask) {
                  if (task.subtasks) {
                    const updatedSubtasks = task.subtasks.map(subtask => {
                      if (subtask.subtaskId === taskId) {
                        return {
                          ...subtask,
                          endDate: formattedEndDate
                        };
                      }
                      return subtask;
                    });
                    return { ...task, subtasks: updatedSubtasks };
                  }
                } else if (task.taskId === taskId) {
                  return {
                    ...task,
                    endDate: formattedEndDate
                  };
                }
                return task;
              });
            });
          }
        }
      } catch (error) {
        console.error("Error updating task date:", error);
      }
    }

    // Reset UI
    taskBar.classList.remove("resizing");
    resizingElement.dataset.resizing = "";
    document.body.style.cursor = "default";
    setResizingTask(null);
    setResizeDirection(null);

    // ซ่อน tooltip
    const tooltip = taskBar.querySelector('.task-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.display = 'none';
    }

    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const renderTaskBar = (task: Task | Subtask, isSubtask: boolean = false) => {
    const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
    const progress = task.progress || 0;

    return (
      <TaskBar
        status={task.status}
        dragging={draggedTask === task}
        className="relative group" // เพิ่ม relative และ group สำหรับ hover effects
        style={{
          left: `${(startCol - 1) * 40}px`,
          width: `${span * 40}px`,
        }}
      >
        {/* ปรับแต่ง ResizeHandle ด้วย Tailwind */}
        <ResizeHandle
          position="start"
          className="drag-handle-start opacity-50 hover:opacity-100 group-hover:opacity-100 group-hover:bg-white/50 transform scale-[1.2] transition-all duration-200"
          onMouseDown={(e) => handleDragStart(e, task, 'start')}
        />
        <ResizeHandle
          position="end"
          className="drag-handle-end opacity-50 hover:opacity-100 group-hover:opacity-100 group-hover:bg-white/50 transform scale-[1.2] transition-all duration-200"
          onMouseDown={(e) => handleDragStart(e, task, 'end')}
        />

        <div className="px-2 py-1 text-white text-xs truncate flex items-center justify-between">
          <span>{getName(task)}</span>
          {task.priority && <PriorityIndicator priority={task.priority} />}
          {task.status && <StatusIndicator status={task.status} />}
        </div>

        <TaskProgress progress={progress} />

        {/* ให้ TaskTooltip มี transition ด้วย Tailwind */}
        <TaskTooltip className="transition-opacity duration-300 ease-in-out">
          <div className="font-medium mb-1">{getName(task)}</div>
          <div className="text-xs text-gray-300">
            <div>Start: {formatDateFromString(task.startDate)}</div>
            <div>End: {formatDateFromString(task.endDate)}</div>
            <div>Duration: {span} days</div>
            {task.assignee && <div>Assignee: {task.assignee}</div>}
            {task.priority && <div>Priority: {task.priority}</div>}
            {task.progress !== undefined && <div>Progress: {task.progress}%</div>}
          </div>
        </TaskTooltip>
      </TaskBar>
    );
  };

  // เพิ่มฟังก์ชันใหม่สำหรับการเรียงลำดับ task และ subtask
  const sortTasks = (tasks: Task[]): Task[] => {
    // เราจะไม่เรียงลำดับใหม่ แต่จะใช้ลำดับที่ได้รับจาก API
    return tasks.map(task => {
      // สำหรับ subtasks ก็เช่นกัน ไม่ต้องเรียงลำดับใหม่
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          // แต่ละ subtask ควรคงตำแหน่งเดิม
          subtasks: [...task.subtasks]
        };
      }
      return task;
    });
  };

  // แก้ไขฟังก์ชัน scrollToToday ให้ทำงานได้อย่างถูกต้อง
  const scrollToToday = () => {
    const today = new Date();

    // Find the scrollable container - using a more specific selector
    const timelineContent = document.querySelector('.timeline-content');

    if (!timelineContent) {
      console.error("Timeline content element not found");
      return;
    }

    if (today.getFullYear() !== year) {
      console.log("Current year doesn't match - can't scroll to today");
      return;
    }

    // Calculate today's position
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const todayPosition = dayOfYear * 40; // 40px per day

    // Calculate scroll position to center today
    const scrollPosition = todayPosition - (timelineContent.clientWidth / 2) + 20;

    // Smooth scroll to position
    timelineContent.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });

    // Add visual feedback
    const todayCells = document.querySelectorAll('.day-cell-today');
    todayCells.forEach(cell => {
      cell.classList.add('highlight-flash');
      setTimeout(() => {
        cell.classList.remove('highlight-flash');
      }, 2100);
    });
  };

  const highlightTodayColumn = () => {
    const todayCells = document.querySelectorAll('.day-cell-today');

    if (todayCells.length === 0) {
      console.warn("No today cells found. Check if isToday function is working correctly.");
      return;
    }

    // เพิ่ม CSS Animation สำหรับเอฟเฟกต์กระพริบด้วยสีแดง
    const style = document.createElement('style');
    style.textContent = `
  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; background-color: rgba(239, 68, 68, 0.4); }
  }
  .highlight-flash {
    animation: flash 0.7s ease-in-out 3;
  }
`;
    document.head.appendChild(style);

    // ลบ style element หลังจาก animation เสร็จสิ้น
    setTimeout(() => {
      document.head.removeChild(style);
    }, 3500);
  };

  // อัพเดท useEffect สำหรับการเรียงลำดับ tasks
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // ใช้ฟังก์ชัน sortTasks แทนการเรียงลำดับแบบอื่น
      const sortedTasks = sortTasks(tasks);
      setTaskList(sortedTasks);
    }
  }, [tasks]);

  // อัพเดท useEffect สำหรับการเรียงลำดับ tasks
  useEffect(() => {
    const sortedTasks = sortTasks(tasks);
    setTaskList(sortedTasks);
  }, [tasks]);

  return (
    <TimelineContainer>
      <TimelineHeader>
        <div className="flex justify-between items-center">
          {/* ด้านซ้าย: แสดงชื่อปีหรือข้อความอื่น */}
          <h2 className="text-lg font-semibold text-gray-900">{year} Project Timeline</h2>

          {/* ด้านขวา: ปุ่ม Today */}
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log("Today button clicked");
              scrollToToday();
            }}
            className="px-3 py-1.5 bg-blue-600 text-white border border-blue-700 rounded shadow-sm hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5 font-medium"
          >
            <span>Today</span>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          </button>
        </div>
      </TimelineHeader>

      <TimelineGrid>
        {/* Sidebar */}
        <TimelineSidebar>
          <div className="p-4 border-b border-gray-200 bg-gray-50 h-10">
            <h3 className="text-sm font-medium text-gray-700">Tasks</h3>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {taskList.map((task) => (
              <React.Fragment key={task.taskId}>
                <div className="p-4 border-b border-gray-200 hover:bg-gray-50" style={{ height: "40px" }}>
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
                          <div className="flex items-center">
                            <Text className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                              {task.taskName}
                            </Text>
                            {task.status && (
                              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getStatusTextColor(task.status)} bg-opacity-20 ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            )}
                          </div>
                        }
                      />
                    </div>
                    <DialogAddSubTask
                      getSubtaskData={fetchSubtasks}
                      taskId={task.taskId}
                      taskName={task.taskName}
                      projectId={projectId}
                      updateTaskStatus={updateTaskStatus}
                      addSubtaskToState={addSubtaskToState}
                    />
                  </div>
                </div>

                {expandedTasks.includes(task.taskId) &&
                  task.subtasks?.map((subtask) => (
                    <div key={subtask.subtaskId} className="pl-6 pr-4 py-4 border-b border-gray-200 bg-gray-50" style={{ height: "40px" }}>
                      <DialogEditSubTask
                        getSubtaskData={fetchSubtasks}
                        subtaskId={subtask.subtaskId}
                        trigger={
                          <div className="flex items-center">
                            <Text className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer">
                              {subtask.subtaskName}
                            </Text>
                            {subtask.status && (
                              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getStatusTextColor(subtask.status)} bg-opacity-20 ${getStatusColor(subtask.status)}`}>
                                {subtask.status}
                              </span>
                            )}
                          </div>
                        }
                      />
                    </div>
                  ))}
              </React.Fragment>
            ))}
          </div>
        </TimelineSidebar>

        {/* Timeline Content */}
        <TimelineContent className="timeline-content">
          <TimelineContentInner>
            {/* เพิ่มเส้นไฮไลท์วันปัจจุบันก่อนเนื้อหาอื่นๆ */}
            {(() => {
              const today = new Date();
              if (today.getFullYear() === year) {
                const startOfYear = new Date(year, 0, 1);
                const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
                const position = (dayOfYear * 40) + 20; // 40px ต่อวัน

                return (
                  <div
                    className="absolute top-[40px] w-[2px] bg-red-500 z-[1000]"
                    style={{
                      left: `${position}px`,
                      height: '3000px', // ตั้งค่าความสูงมากพอเพื่อให้ปลายเส้นยาวเกินเนื้อหาทั้งหมด
                      pointerEvents: 'none' // ให้คลิกผ่านเส้นได้
                    }}
                  />
                );
              }
              return null;
            })()}

            <div className="sticky top-0 bg-white z-10 border-b border-gray-200" style={{ height: "40px" }}>
              {/* Month and day headers */}
              <div className="flex flex-col h-full">
                <div className="flex h-[20px]">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const month = new Date(year, monthIndex).toLocaleString("default", { month: "short" });
                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                    return (
                      <MonthHeader
                        key={monthIndex}
                        month={month}
                        width={`${daysInMonth * 40}px`}
                      />
                    );
                  })}
                </div>
                <div className="flex h-[20px]">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                    return (
                      <div
                        key={monthIndex}
                        className="flex"
                        style={{ width: `${daysInMonth * 40}px` }}
                      >
                        {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                          const dayOfMonth = dayIndex + 1;
                          const date = new Date(year, monthIndex, dayOfMonth);
                          const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
                          // แก้ไขการเรียกใช้ฟังก์ชัน isToday ให้ส่งพารามิเตอร์ที่ถูกต้อง
                          const isCurrentDay = isToday(year, monthIndex, dayOfMonth);

                          return (
                            <DayCell
                              key={dayIndex}
                              day={dayOfMonth}
                              isWeekend={isWeekendDay}
                              isToday={isCurrentDay}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative">
              {taskList.map((task) => (
                <React.Fragment key={task.taskId}>
                  {/* Main Task */}
                  <TaskRow
                    id={`task-${task.taskId}`}
                    style={{ width: 'max-content', minWidth: '100%' }}
                  >
                    {renderTaskBar(task)}
                  </TaskRow>

                  {/* Subtasks */}
                  {expandedTasks.includes(task.taskId) &&
                    task.subtasks?.map((subtask) => (
                      <SubtaskRow
                        key={subtask.subtaskId}
                        id={`subtask-${subtask.subtaskId}`}
                        style={{ width: 'max-content', minWidth: '100%' }}
                      >
                        {renderTaskBar(subtask, true)}
                      </SubtaskRow>
                    ))}
                </React.Fragment>
              ))}
            </div>
          </TimelineContentInner>
        </TimelineContent>
      </TimelineGrid>
    </TimelineContainer>
  );
}

export default DateTable;