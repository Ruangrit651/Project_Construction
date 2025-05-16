import React, { useState, useEffect, useMemo } from "react";
import { Table, Text, Button, Flex, Badge, Select, TextField, Tooltip } from "@radix-ui/themes";
import { getTask, updateStartDateTask, updateEndDateTask, updateTaskDates, patchTask } from "@/services/task.service";
import DialogEditTask from "./components/DialogEditTask";
import DialogEditSubTask from "./components/DialogEditSubtask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  Cross2Icon,
  SliderIcon,
  PlusIcon,
  DownloadIcon
} from "@radix-ui/react-icons";

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
  progress?: number; // Add progress field
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
  progress?: number; // Add progress field
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

    // กรณีที่เป็นรูปแบบ dd/mm/yy หรือ dd/mm/yyyy
    if (dateString.includes('/')) {
      const [day, month, yearShort] = dateString.split("/").map(Number);
      const year = yearShort < 100 ? 2000 + yearShort : yearShort; // ถ้าปีเป็นตัวเลข 2 หลัก ให้เพิ่ม 2000
      return new Date(year, month - 1, day); // เดือนใน JavaScript เริ่มจาก 0
    }

    // กรณีที่เป็นรูปแบบ ISO (YYYY-MM-DD)
    return new Date(dateString);
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return new Date(); // กรณีมีข้อผิดพลาดให้ส่งคืนวันที่ปัจจุบัน
  }
};

const isWeekend = (year: number, dayOfYear: number) => {
  const date = new Date(year, 0, dayOfYear);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
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

  // Convert the input year to a full year (e.g., 2025)
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

const formatDate = (dateString: string) => {
  const [day, month, year] = dateString.split("/").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 2000}`;
};

// Add this function to get appropriate color based on status
const getStatusColor = (status: string, isDarkMode: boolean) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return `${isDarkMode ? 'bg-green-600' : 'bg-green-500'} group-hover:bg-green-600`;
    case 'in progress':
      return `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} group-hover:bg-blue-600`;
    case 'delayed':
      return `${isDarkMode ? 'bg-red-600' : 'bg-red-500'} group-hover:bg-red-600`;
    case 'pending':
      return `${isDarkMode ? 'bg-amber-600' : 'bg-amber-500'} group-hover:bg-amber-600`;
    default:
      return `${isDarkMode ? 'bg-gray-600' : 'bg-gray-500'} group-hover:bg-gray-600`;
  }
};

const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "quarter" | "year">("month");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  
  const handleExportData = () => {
    // Implement CSV or Excel export functionality
    const data = tasks.map(task => ({
      'Task Name': task.taskName,
      'Start Date': task.startDate,
      'End Date': task.endDate,
      'Status': task.status,
      'Budget': task.budget,
      'Progress': task.progress || 0
    }));
    
    // Create CSV content
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `construction_tasks_${year}.csv`);
    link.click();
  };
  
  // Filter tasks based on search and status filter
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Calculate months to display based on view mode
  const visibleMonths = useMemo(() => {
    const allMonths = Array.from({ length: 12 }, (_, index) => ({
      name: new Date(year, index).toLocaleString("default", { month: "short" }),
      days: new Date(year, index + 1, 0).getDate(),
    }));
    
    if (viewMode === "month") {
      return [allMonths[currentMonth]];
    } else if (viewMode === "quarter") {
      const quarterStart = Math.floor(currentMonth / 3) * 3;
      return allMonths.slice(quarterStart, quarterStart + 3);
    } else {
      return allMonths;
    }
  }, [year, viewMode, currentMonth]);

    const handleDragStart = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    document.body.style.cursor = "grabbing"; // เปลี่ยน cursor

    const target = e.currentTarget as HTMLElement;
    target.dataset.dragging = "true";
    target.dataset.startX = e.clientX.toString();

    // เพิ่ม Event Listener บน document
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    e.preventDefault();
    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement;
    if (!draggingElement) return;

    const startX = parseInt(draggingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 20);

    // หา task-bar element (parent ของส่วนที่กำลังลาก)
    const taskBar = draggingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    // แทนการใช้ transform (ซึ่งทำให้เส้นหาย) ให้ใช้ marginLeft แทน
    taskBar.style.marginLeft = `${deltaX}px`;

    // แสดง tooltip บอกจำนวนวันที่กำลังจะเลื่อน
    if (!taskBar.querySelector('.drag-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.className = 'drag-tooltip absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 bg-gray-800 text-white px-2 py-1 rounded text-xs z-40';
      taskBar.appendChild(tooltip);
    }

    const tooltip = taskBar.querySelector('.drag-tooltip') as HTMLElement;
    tooltip.textContent = `${daysMoved > 0 ? '+' : ''}${daysMoved} day${Math.abs(daysMoved) !== 1 ? 's' : ''}`;
  };

  // ปรับปรุงฟังก์ชัน handleDragEnd เพื่อใช้ endpoint อัพเดตทั้ง start_date และ end_date
  const handleDragEnd = async (e: MouseEvent) => {
    e.preventDefault();
    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement;
    if (!draggingElement) return;

    // หา task-bar element
    const taskBar = draggingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const taskId = taskBar.dataset.taskId;
    if (!taskId) return;

    // คำนวณจำนวนวันที่เลื่อน
    const startX = parseInt(draggingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 20);

    if (daysMoved === 0) {
      // ไม่มีการเปลี่ยนแปลงวันที่
      draggingElement.dataset.dragging = "false";
      taskBar.style.marginLeft = ""; // รีเซ็ต margin
      document.body.style.cursor = "default";

      // ลบ tooltip ถ้ามี
      const tooltip = taskBar.querySelector('.drag-tooltip');
      if (tooltip) tooltip.remove();

      // ลบ Event Listener
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      return;
    }

    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return;

    try {
      console.log("Moving task:", task.taskName, "by", daysMoved, "days");
      console.log("Original dates: Start:", task.startDate, "End:", task.endDate);

      // แปลงวันที่ให้อยู่ในรูปแบบที่ถูกต้อง
      const startDate = parseDate(task.startDate);
      const endDate = parseDate(task.endDate);

      // เพิ่มวันตามจำนวนที่เลื่อน
      startDate.setDate(startDate.getDate() + daysMoved);
      endDate.setDate(endDate.getDate() + daysMoved);

      console.log("New dates: Start:", startDate.toISOString(), "End:", endDate.toISOString());

      // แปลงเป็นรูปแบบ ISO string แล้วตัดส่วน time ออก (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      console.log("Formatted dates for API: Start:", formattedStartDate, "End:", formattedEndDate);

      // อัพเดตทั้งสองวันที่พร้อมกันเพื่อประสิทธิภาพ
      const response = await updateTaskDates({
        task_id: taskId,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });

      console.log("API response:", response);

      // Refresh data
      fetchTasks();
    } catch (error) {
      console.error("Error updating task dates:", error);
    }

    // Reset UI state
    draggingElement.dataset.dragging = "false";
    taskBar.style.marginLeft = ""; // รีเซ็ต margin แทนการใช้ transform
    document.body.style.cursor = "default";

    // ลบ tooltip
    const tooltip = taskBar.querySelector('.drag-tooltip');
    if (tooltip) tooltip.remove();

    // ลบ Event Listener
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task, direction: "start" | "end") => {
    e.preventDefault();
    e.stopPropagation(); // ป้องกันการทริกเกอร์ handleDragStart ของ parent

    document.body.style.cursor = direction === "start" ? "w-resize" : "e-resize"; // เปลี่ยน cursor

    const target = e.currentTarget as HTMLElement;
    // เก็บข้อมูลใน dataset ของ target
    target.dataset.resizing = direction;
    target.dataset.startX = e.clientX.toString();
    target.dataset.taskId = task.taskId;

    // เพิ่ม event listeners ที่ document
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    e.preventDefault();

    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 20);

    // หา task bar
    const taskBar = resizingElement.closest(".task-bar") as HTMLElement;
    if (!taskBar) return;

    const direction = resizingElement.dataset.resizing as "start" | "end";

    // แสดง visual feedback ของการปรับขนาด
    if (direction === "start") {
      taskBar.style.left = `${deltaX}px`;
      taskBar.style.width = `calc(100% - ${deltaX}px)`;
    } else { // "end"
      taskBar.style.width = `calc(100% + ${deltaX}px)`;
    }

    // แสดง tooltip
    if (!taskBar.querySelector('.resize-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.className = 'resize-tooltip absolute text-white bg-gray-800 px-2 py-1 rounded text-xs z-40';

      if (direction === "start") {
        tooltip.style.left = '0';
        tooltip.style.top = '-24px';
      } else {
        tooltip.style.right = '0';
        tooltip.style.top = '-24px';
      }

      taskBar.appendChild(tooltip);
    }

    const tooltip = taskBar.querySelector('.resize-tooltip') as HTMLElement;
    tooltip.textContent = direction === "start"
      ? `Start: ${daysMoved > 0 ? '+' : ''}${daysMoved} days`
      : `End: ${daysMoved > 0 ? '+' : ''}${daysMoved} days`;
  };

  const handleResizeEnd = async (e: MouseEvent) => { // เปลี่ยนเป็น MouseEvent จาก DOM
    e.preventDefault();

    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const taskId = resizingElement.dataset.taskId;
    const direction = resizingElement.dataset.resizing as "start" | "end";

    if (!taskId || !direction) {
      // รีเซ็ตสถานะ resize
      resizingElement.dataset.resizing = "";
      document.body.style.cursor = "default";
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      return;
    }

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 20);

    if (daysMoved === 0) {
      // ไม่มีการเปลี่ยนแปลงวันที่
      const taskBar = resizingElement.closest(".task-bar") as HTMLElement;
      if (taskBar) {
        taskBar.style.marginLeft = "";
        taskBar.style.width = "";

        const tooltip = taskBar.querySelector('.resize-tooltip');
        if (tooltip) tooltip.remove();
      }

      resizingElement.dataset.resizing = "";
      document.body.style.cursor = "default";
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      return;
    }

    try {
      const task = tasks.find(t => t.taskId === taskId);
      if (!task) return;

      // คำนวณวันที่ใหม่
      if (direction === "start") {
        const newStartDate = new Date(parseDate(task.startDate));
        newStartDate.setDate(newStartDate.getDate() + daysMoved);
        const formattedStartDate = newStartDate.toISOString().split('T')[0];

        // ตรวจสอบว่าไม่เกินวันสิ้นสุด
        const endDate = parseDate(task.endDate);
        if (newStartDate < endDate) {
          await updateStartDateTask({
            task_id: taskId,
            start_date: formattedStartDate
          });
        }
      } else if (direction === "end") {
        const newEndDate = new Date(parseDate(task.endDate));
        newEndDate.setDate(newEndDate.getDate() + daysMoved);
        const formattedEndDate = newEndDate.toISOString().split('T')[0];

        // ตรวจสอบว่าไม่น้อยกว่าวันเริ่มต้น
        const startDate = parseDate(task.startDate);
        if (newEndDate > startDate) {
          await updateEndDateTask({
            task_id: taskId,
            end_date: formattedEndDate
          });
        }
      }

      // รีเฟรชข้อมูล
      fetchTasks();
    } catch (error) {
      console.error(`Error updating task ${direction} date:`, error);
    }

    // รีเซ็ตสถานะ UI
    const taskBar = resizingElement.closest(".task-bar") as HTMLElement;
    if (taskBar) {
      taskBar.style.marginLeft = "";
      taskBar.style.width = "";

      const tooltip = taskBar.querySelector('.resize-tooltip');
      if (tooltip) tooltip.remove();
    }

    resizingElement.dataset.resizing = "";
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  return (
    <div className={`relative w-full overflow-hidden border rounded-lg shadow-md 
                    ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
      
      {/* Enhanced header with controls */}
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarIcon className="mr-2" />
            {year} Construction Project Timeline
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search box */}
            <div className={`relative flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-md border px-2`}>
              <MagnifyingGlassIcon className="text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-2 py-1 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} focus:outline-none`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                  <Cross2Icon />
                </button>
              )}
            </div>
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} border`}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in progress">In Progress</option>
              <option value="delayed">Delayed</option>
              <option value="pending">Pending</option>
            </select>
            
            {/* View mode selector */}
            <div className="flex border rounded-md overflow-hidden">
              <button 
                onClick={() => setViewMode("month")} 
                className={`px-3 py-1 text-xs ${viewMode === "month" 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                Month
              </button>
              <button 
                onClick={() => setViewMode("quarter")} 
                className={`px-3 py-1 text-xs ${viewMode === "quarter" 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                Quarter
              </button>
              <button 
                onClick={() => setViewMode("year")} 
                className={`px-3 py-1 text-xs ${viewMode === "year" 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                Year
              </button>
            </div>
            
            {/* Month navigation */}
            {viewMode !== "year" && (
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setCurrentMonth(prev => Math.max(0, prev - 1))}
                  disabled={currentMonth === 0}
                  className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} 
                             ${currentMonth === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <span className="text-sm">{new Date(year, currentMonth).toLocaleString('default', { month: 'long' })}</span>
                <button 
                  onClick={() => setCurrentMonth(prev => Math.min(11, prev + 1))}
                  disabled={currentMonth === 11}
                  className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} 
                             ${currentMonth === 11 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
            
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`px-3 py-1 rounded-md flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isDarkMode ? (
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                ) : (
                  <circle cx="12" cy="12" r="5"></circle>
                )}
                {!isDarkMode && <line x1="12" y1="1" x2="12" y2="3"></line>}
                {!isDarkMode && <line x1="12" y1="21" x2="12" y2="23"></line>}
                {!isDarkMode && <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>}
                {!isDarkMode && <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>}
                {!isDarkMode && <line x1="1" y1="12" x2="3" y2="12"></line>}
                {!isDarkMode && <line x1="21" y1="12" x2="23" y2="12"></line>}
                {!isDarkMode && <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>}
                {!isDarkMode && <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>}
              </svg>
              <span className="ml-1 text-xs">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
            
            {/* Export button */}
            <button 
              onClick={handleExportData}
              className={`px-3 py-1 rounded-md text-sm flex items-center ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}>
              <DownloadIcon className="mr-1" />
              Export
            </button>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</div>
            <div className="text-xl font-semibold">{tasks.length}</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
            <div className="text-xl font-semibold">
              {tasks.filter(t => t.status.toLowerCase() === 'completed').length}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
            <div className="text-xl font-semibold">
              {tasks.filter(t => t.status.toLowerCase() === 'in progress').length}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">Delayed</div>
            <div className="text-xl font-semibold">
              {tasks.filter(t => t.status.toLowerCase() === 'delayed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Project timeline progress indicator */}
      <div className={`px-4 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs">Project Timeline Progress</span>
          <span className="text-xs font-medium">
            {Math.round(
              (tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / (tasks.length * 100)) * 100
            )}%
          </span>
        </div>
        <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.round(
                (tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / (tasks.length * 100)) * 100
              )}%`
            }}
          ></div>
        </div>
      </div>

      {/* Your existing table structure with improved styling */}
      <div className="relative w-screen overflow-hidden">
        {/* Fixed left columns container */}
        <div className="absolute left-0 top-0 z-10 overflow-hidden">
          <Table.Root 
            variant="surface" 
            className={`w-auto shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <Table.Header className="h-[88px]">
              <Table.Row className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}>
                <Table.ColumnHeaderCell 
                  rowSpan={2} 
                  className={`w-[350px] text-left align-middle ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  Task Name
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell 
                  rowSpan={2} 
                  className={`w-[100px] text-center align-middle ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  Start Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell 
                  rowSpan={2} 
                  className={`w-[100px] text-center align-middle ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  End Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell 
                  rowSpan={2} 
                  className={`w-[100px] text-center align-middle border-r-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}
                >
                  Status
                </Table.ColumnHeaderCell>
              </Table.Row>
              <Table.Row></Table.Row> {/* Empty row for alignment */}
            </Table.Header>

            <Table.Body>
              {filteredTasks.map((task, taskIndex) => (
                <React.Fragment key={taskIndex}>
                  <Table.Row className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <Table.Cell className="w-[350px] flex items-center">
                      <button 
                        onClick={() => toggleSubtasks(task.taskId)} 
                        className={`mr-2 p-1 rounded-full focus:outline-none ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
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
                          <Text className={`cursor-pointer ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'} hover:underline font-medium`}>
                            {task.taskName}
                          </Text>
                        }
                      />
                      <div className="ml-4 flex items-center">
                        <span 
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            task.status.toLowerCase() === 'completed' ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800') :
                            task.status.toLowerCase() === 'in progress' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') :
                            task.status.toLowerCase() === 'delayed' ? (isDarkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800') :
                            (isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800')
                          }`}
                        >
                          {task.status}
                        </span>
                        <DialogAddSubTask
                          getSubtaskData={fetchSubtasks}
                          taskId={task.taskId}
                          taskName={task.taskName}
                          trigger={
                            <button className={`ml-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          }
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="w-[100px]">{formatDate(task.startDate)}</Table.Cell>
                    <Table.Cell className="w-[100px]">{formatDate(task.endDate)}</Table.Cell>
                    <Table.Cell className={`w-[100px] border-r-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-center">
                        <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-1.5 rounded-full ${
                              task.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                              task.status.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                              task.status.toLowerCase() === 'delayed' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs">{task.progress || 0}%</span>
                      </div>
                    </Table.Cell>
                  </Table.Row>

                  {expandedTasks.includes(task.taskId) &&
                    task.subtasks?.map((subtask, subtaskIndex) => (
                      <Table.Row 
                        key={subtaskIndex} 
                        className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                      >
                        <Table.Cell className="pl-8 w-[350px]">
                          <div className="flex items-center">
                            <div className={`w-4 h-0.5 mr-2 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                            <DialogEditSubTask
                              getSubtaskData={fetchSubtasks}
                              subtaskId={subtask.subtaskId}
                              trigger={
                                <Text className={`cursor-pointer ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'} hover:underline`}>
                                  {subtask.subtaskName}
                                </Text>
                              }
                            />
                            <span 
                              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                subtask.status.toLowerCase() === 'completed' ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800') :
                                subtask.status.toLowerCase() === 'in progress' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') :
                                subtask.status.toLowerCase() === 'delayed' ? (isDarkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800') :
                                (isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800')
                              }`}
                            >
                              {subtask.status}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="w-[100px]">{formatDate(subtask.startDate)}</Table.Cell>
                        <Table.Cell className="w-[100px]">{formatDate(subtask.endDate)}</Table.Cell>
                        <Table.Cell className={`w-[100px] border-r-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                          <div className="flex items-center justify-center">
                            <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-1.5 rounded-full ${
                                  subtask.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                                  subtask.status.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                                  subtask.status.toLowerCase() === 'delayed' ? 'bg-red-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${subtask.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs">{subtask.progress || 0}%</span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </React.Fragment>
              ))}
            </Table.Body>
          </Table.Root>
        </div>

        {/* Enhanced scrollable right columns container */}
        <div className="ml-[650px] overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table.Root 
            variant="surface" 
            className={`w-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <Table.Header>
              <Table.Row>
                {visibleMonths.map((month, index) => (
                  <Table.ColumnHeaderCell
                    key={index}
                    colSpan={month.days}
                    className={`text-center ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-gray-300'} 
                               ${index < visibleMonths.length - 1 ? "border-r border-gray-300" : ""}`}
                  >
                    <Text size="2" className="font-medium">{month.name}</Text>
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
              <Table.Row>
                {visibleMonths.map((month, monthIndex) =>
                  Array.from({ length: month.days }, (_, dayIndex) => {
                    // Calculate actual day of year
                    const dayOfYear = dayIndex + 1 + visibleMonths.slice(0, monthIndex).reduce((acc, m) => acc + m.days, 0);
                    const isWeekendDay = isWeekend(year, dayOfYear);
                    const isTodayDay = isToday(year, dayOfYear);
                    
                    return (
                      <Table.ColumnHeaderCell
                        key={`${monthIndex}-${dayIndex}`}
                        className={`text-center ${
                          isWeekendDay 
                            ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') 
                            : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50')
                        } ${
                          isTodayDay
                            ? (isDarkMode ? 'border-t-2 border-b-2 border-red-400' : 'border-t-2 border-b-2 border-red-500')
                            : ''
                        } ${
                          dayIndex === month.days - 1 && monthIndex < visibleMonths.length - 1
                            ? (isDarkMode ? "border-r border-gray-600" : "border-r border-gray-300")
                            : ""
                        }`}
                      >
                        <Text 
                          size="1" 
                          className={isTodayDay ? (isDarkMode ? "font-bold text-red-400" : "font-bold text-red-600") : ""}
                        >
                          {dayIndex + 1}
                        </Text>
                      </Table.ColumnHeaderCell>
                    );
                  })
                )}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {filteredTasks.map((task, taskIndex) => {
                // Calculate task position
                const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
                
                // Only show visible days based on view mode
                const visibleStartDay = visibleMonths[0] ? 
                  visibleMonths.slice(0, 1).reduce((acc, m) => acc + 0, 0) + 1 : 1;
                  
                const visibleEndDay = visibleMonths.reduce((acc, m, i) => 
                  acc + m.days, 0);
                
                const isVisible = !(startCol > visibleEndDay || (startCol + span - 1) < visibleStartDay);
                
                // Adjust position for visible portion
                const adjustedStartCol = Math.max(startCol - visibleStartDay + 1, 1);
                const visibleSpan = Math.min(span, visibleEndDay - startCol + 1);

                return (
                  <React.Fragment key={taskIndex}>
                    <Table.Row>
                      {Array.from({ length: visibleMonths.reduce((acc, m) => acc + m.days, 0) }).map((_, dayIndex) => {
                        const isStart = dayIndex + visibleStartDay === startCol;
                        
                        return (
                          <Table.Cell 
                            key={dayIndex}
                            className={`relative group border-b ${
                              isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            } ${
                              isWeekend(year, dayIndex + visibleStartDay)
                                ? (isDarkMode ? 'bg-gray-750' : 'bg-gray-50')
                                : ''
                            }`}
                          >
                            {isStart && isVisible && (
                              <div
                                className={`absolute h-8 top-1/2 transform -translate-y-1/2 rounded-md transition-all duration-300 task-bar
                                           ${getStatusColor(task.status, isDarkMode)}`}
                                style={{
                                  left: 0,
                                  width: `calc(${visibleSpan} * 100%)`,
                                  zIndex: 10
                                }}
                                data-task-id={task.taskId}
                              >
                                {/* Resize handle - start */}
                                <div
                                  className={`absolute left-0 top-0 bottom-0 w-4 cursor-w-resize 
                                             ${isDarkMode ? 'hover:bg-blue-600' : 'hover:bg-blue-700'} transition-colors duration-150
                                             rounded-l-md flex items-center justify-center`}
                                  onMouseDown={(e) => handleResizeStart(e, task, "start")}
                                >
                                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                                    <path d="M5 1L1 6L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>

                                {/* Task content */}
                                <div
                                  className="absolute left-4 right-4 top-0 bottom-0 cursor-grab active:cursor-grabbing flex items-center px-2"
                                  onMouseDown={(e) => handleDragStart(e, task)}
                                >
                                  {visibleSpan > 5 && (
                                    <div className="w-full flex justify-between items-center">
                                      <span className="text-white text-xs truncate font-medium">{task.taskName}</span>
                                      {task.progress !== undefined && visibleSpan > 12 && (
                                        <div className="flex items-center">
                                          <div className="w-16 bg-black bg-opacity-20 rounded-full h-1 mr-1">
                                            <div className="bg-white h-1 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                          </div>
                                          <span className="text-white text-xs font-medium">{task.progress}%</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Resize handle - end */}
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-4 cursor-e-resize 
                                             ${isDarkMode ? 'hover:bg-blue-600' : 'hover:bg-blue-700'} transition-colors duration-150
                                             rounded-r-md flex items-center justify-center`}
                                  onMouseDown={(e) => handleResizeStart(e, task, "end")}
                                >
                                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                                    <path d="M1 1L5 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>

                                {/* Enhanced tooltip */}
                                <div className={`absolute invisible group-hover:visible ${
                                  isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
                                } text-white p-3 rounded-lg shadow-xl text-xs z-30 bottom-full left-0 mb-2 w-72 
                                opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100`}>
                                  <div className="flex justify-between items-start">
                                    <p className="font-bold text-base">{task.taskName}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      task.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                                      task.status.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                                      task.status.toLowerCase() === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-gray-400 text-xs mb-1">Start Date</p>
                                      <p className="font-medium">{formatDate(task.startDate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-xs mb-1">End Date</p>
                                      <p className="font-medium">{formatDate(task.endDate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-xs mb-1">Duration</p>
                                      <p className="font-medium">{span} days</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-xs mb-1">Budget</p>
                                      <p className="font-medium">${task.budget?.toLocaleString()}</p>
                                    </div>
                                  </div>
                                  
                                  {task.description && (
                                    <div className="mt-2">
                                      <p className="text-gray-400 text-xs mb-1">Description</p>
                                      <p className="text-sm text-gray-200">{task.description}</p>
                                    </div>
                                  )}
                                  
                                  {task.progress !== undefined && (
                                    <div className="mt-3">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-400">Progress</span>
                                        <span className="text-xs font-medium">{task.progress}%</span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className={`${
                                            task.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                                            task.status.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                                            task.status.toLowerCase() === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'
                                          } h-1.5 rounded-full`}
                                          style={{ width: `${task.progress}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="absolute w-3 h-3 bg-inherit transform rotate-45 left-4 -bottom-1.5"></div>
                                </div>
                              </div>
                            )}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>

                    {/* Subtasks with improved styling */}
                    {expandedTasks.includes(task.taskId) &&
                      task.subtasks?.map((subtask, subtaskIndex) => {
                        const { startCol: subtaskStartCol, span: subtaskSpan } = calculateStartColAndSpan(
                          subtask.startDate,
                          subtask.endDate,
                          year
                        );
                        
                        // Adjust for visible range
                        const isSubtaskVisible = !(subtaskStartCol > visibleEndDay || (subtaskStartCol + subtaskSpan - 1) < visibleStartDay);
                        const adjustedSubtaskStartCol = Math.max(subtaskStartCol - visibleStartDay + 1, 1);
                        const visibleSubtaskSpan = Math.min(subtaskSpan, visibleEndDay - subtaskStartCol + 1);

                        return (
                          <Table.Row 
                            key={subtaskIndex} 
                            className={isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}
                          >
                            {Array.from({ length: visibleMonths.reduce((acc, m) => acc + m.days, 0) }).map((_, dayIndex) => {
                              const isStart = dayIndex + visibleStartDay === subtaskStartCol;

                              return (
                                <Table.Cell 
                                  key={dayIndex} 
                                  className={`relative group ${
                                    isDarkMode ? 'border-gray-700' : 'border-gray-300'
                                  } ${
                                    isWeekend(year, dayIndex + visibleStartDay)
                                      ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                                      : ''
                                  }`}
                                >
                                  {isStart && isSubtaskVisible && (
                                    <div
                                      className={`absolute h-6 top-1/2 transform -translate-y-1/2 rounded-md 
                                                transition-all duration-300 cursor-grab active:cursor-grabbing 
                                                overflow-visible hover:shadow-lg hover:z-20
                                                ${getStatusColor(subtask.status, isDarkMode)}`}
                                      style={{
                                        left: 0,
                                        width: `calc(${visibleSubtaskSpan} * 100%)`,
                                      }}
                                    >
                                      {visibleSubtaskSpan > 10 && (
                                        <div className="flex items-center justify-between px-2 h-full">
                                          <span className="text-xs text-white px-2 truncate max-w-full">
                                            {subtask.subtaskName}
                                          </span>
                                          {subtask.progress !== undefined && visibleSubtaskSpan > 20 && (
                                            <span className="text-xs text-white font-medium">{subtask.progress}%</span>
                                          )}
                                        </div>
                                      )}

                                      {/* Enhanced subtask tooltip */}
                                      <div
                                        className={`absolute invisible group-hover:visible ${
                                          isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
                                        } text-white p-3 rounded-lg shadow-xl text-xs z-30 bottom-full left-0 mb-2 w-64
                                        opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100`}
                                      >
                                        <div className="flex justify-between items-start">
                                          <p className="font-bold text-sm">{subtask.subtaskName}</p>
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            subtask.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                                            subtask.status.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                                            subtask.status.toLowerCase() === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'
                                          }`}>
                                            {subtask.status}
                                          </span>
                                        </div>
                                        
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-gray-400 text-xs mb-1">From</p>
                                            <p className="font-medium">{formatDate(subtask.startDate)}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400 text-xs mb-1">To</p>
                                            <p className="font-medium">{formatDate(subtask.endDate)}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400 text-xs mb-1">Duration</p>
                                            <p className="font-medium">{subtaskSpan} days</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400 text-xs mb-1">Budget</p>
                                            <p className="font-medium">${subtask.budget?.toLocaleString()}</p>
                                          </div>
                                        </div>
                                        
                                        {subtask.description && (
                                          <div className="mt-2">
                                            <p className="text-gray-400 text-xs mb-1">Description</p>
                                            <p className="text-sm text-gray-200">{subtask.description}</p>
                                          </div>
                                        )}
                                        
                                        {subtask.progress !== undefined && (
                                          <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-xs text-gray-400">Progress</span>
                                              <span className="text-xs font-medium">{subtask.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                              <div
                                                className={`${
                                                  subtask.status.toLowerCase() === 'completed' ? 'bg-green-400' :
                                                  subtask.status.toLowerCase() === 'in progress' ? 'bg-blue-400' :
                                                  subtask.status.toLowerCase() === 'delayed' ? 'bg-red-400' : 'bg-yellow-400'
                                                } h-1.5 rounded-full`}
                                                style={{ width: `${subtask.progress}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="absolute w-3 h-3 bg-inherit transform rotate-45 left-4 -bottom-1.5"></div>
                                      </div>
                                    </div>
                                  )}
                                </Table.Cell>
                              );
                            })}
                          </Table.Row>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </div>
  );
};

export default DateTable;