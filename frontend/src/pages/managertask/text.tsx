import React, { useState, useEffect } from "react";
import { Table, Text } from "@radix-ui/themes";
import { getTask, updateStartDateTask, updateEndDateTask, updateTaskDates, patchTask } from "@/services/task.service";
import DialogEditTask from "./components/DialogEditTask";
import DialogEditSubTask from "./components/DialogEditSubtask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

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
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500 group-hover:bg-green-600';
    case 'in progress':
      return 'bg-blue-500 group-hover:bg-blue-600';
    case 'delayed':
      return 'bg-red-500 group-hover:bg-red-600';
    case 'pending':
      return 'bg-yellow-500 group-hover:bg-yellow-600';
    default:
      return 'bg-gray-500 group-hover:bg-gray-600';
  }
};

// Add new utility function for progress bar color
const getProgressColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-400';
    case 'in progress':
      return 'bg-blue-400';
    case 'delayed':
      return 'bg-red-400';
    case 'pending':
      return 'bg-yellow-400';
    default:
      return 'bg-gray-400';
  }
};

// Main Component

const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);

  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     const response = await getTask();
  //     const mappedTasks = response.responseObject.map((task: any) => ({
  //       taskId: task.task_id,
  //       taskName: task.task_name,
  //       description: task.description,
  //       budget: Number(task.budget),
  //       startDate: task.start_date,
  //       endDate: task.end_date,
  //       status: task.status,
  //       subtasks: task.subtasks || [],
  //     }));
  //   };

  //   fetchTasks();
  // }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await getTask();

      const mappedTasks = response.responseObject.map((task: any) => ({
        // ...mapping...
      }));
      setTaskList(mappedTasks);
    };
    fetchTasks();

    const style = document.createElement('style');
    style.textContent = `
    .task-bar {
      transition: background-color 0.2s ease;
    }
    
    .task-bar:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .task-bar > div:first-child,
    .task-bar > div:last-child {
      opacity: 0;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }
    
    .task-bar:hover > div:first-child,
    .task-bar:hover > div:last-child {
      opacity: 1;
    }
    
    .drag-tooltip,
    .resize-tooltip {
      pointer-events: none;
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const months = Array.from({ length: 12 }, (_, index) => ({
    name: new Date(year, index).toLocaleString("default", { month: "short" }),
    days: new Date(year, index + 1, 0).getDate(),
  }));

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
    <div className="relative w-full overflow-hidden border rounded-lg shadow-sm">
      {/* Title and controls */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold">{year} Construction Project Timeline</h2>
        <div className="flex space-x-2"></div>
      </div>

      {/* Your existing table structure */}
      <div className="relative w-screen overflow-hidden">
        {/* Fixed left columns container */}
        <div className="absolute left-0 top-0 z-10 overflow-hidden">
          <Table.Root variant="surface" className="w-auto shadow-md">
            <Table.Header className=" h-[88px]">
              <Table.Row>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[350px]  text-left align-middle">
                  Task Name
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px]  text-center align-middle">
                  Start Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px]  text-center align-middle">
                  End Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px]  text-center align-middle border-r-2 border-gray-300">
                  Status
                </Table.ColumnHeaderCell>
              </Table.Row>
              <Table.Row></Table.Row> {/* Empty row for alignment */}
            </Table.Header>

            <Table.Body>
              {tasks.map((task, taskIndex) => (
                <React.Fragment key={taskIndex}>
                  <Table.Row>
                    <Table.Cell className="w-[350px]  flex items-center">
                      {/* Your task name cell content */}
                      <button onClick={() => toggleSubtasks(task.taskId)} className="mr-2 focus:outline-none">
                        {expandedTasks.includes(task.taskId) ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </button>
                      <DialogEditTask
                        getTaskData={fetchTasks}
                        fetchTasks={fetchTasks} // ส่ง fetchTasks เข้ามา
                        taskId={task.taskId}
                        trigger={
                          <Text className="cursor-pointer hover:text-blue-600 hover:underline">
                            {task.taskName}
                          </Text>
                        }
                      />
                      <div className="ml-4 flex items-center">
                        <DialogAddSubTask
                          getSubtaskData={fetchSubtasks}
                          taskId={task.taskId}
                          taskName={task.taskName}
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="w-[100px] ">{formatDate(task.startDate)}</Table.Cell>
                    <Table.Cell className="w-[100px] ">{formatDate(task.endDate)}</Table.Cell>
                    <Table.Cell className="w-[100px]  border-r-2 border-gray-300">{task.status}</Table.Cell>
                  </Table.Row>

                  {expandedTasks.includes(task.taskId) &&
                    task.subtasks?.map((subtask, subtaskIndex) => (
                      <Table.Row key={subtaskIndex} className="bg-gray-50">
                        <Table.Cell className="pl-8 w-[250px] ">
                          <DialogEditSubTask
                            getSubtaskData={fetchSubtasks}
                            subtaskId={subtask.subtaskId}
                            trigger={
                              <Text className="cursor-pointer hover:text-blue-600 hover:underline">
                                {subtask.subtaskName}
                              </Text>
                            }
                          />
                        </Table.Cell>
                        <Table.Cell className="w-[100px] ">{formatDate(subtask.startDate)}</Table.Cell>
                        <Table.Cell className="w-[100px] ">{formatDate(subtask.endDate)}</Table.Cell>
                        <Table.Cell className="w-[100px]  border-r-2 border-gray-300">
                          {subtask.status}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </React.Fragment>
              ))}
            </Table.Body>
          </Table.Root>
        </div>

        {/* Scrollable right columns container */}
        <div className="ml-[650px] overflow-x-auto">
          <Table.Root variant="surface" className="w-auto">
            <Table.Header>
              <Table.Row>
                {months.map((month, index) => (
                  <Table.ColumnHeaderCell
                    key={index}
                    colSpan={month.days}
                    className={`text-center  ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                  >
                    <Text size="2">{month.name}</Text>
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
              <Table.Row>
                {months.map((month, index) =>
                  Array.from({ length: month.days }, (_, dayIndex) => (
                    <Table.ColumnHeaderCell
                      key={`${index}-${dayIndex}`}
                      className={`text-center  ${isWeekend(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0))
                        ? 'bg-gray-100'
                        : 'bg-gray-50'
                        } ${isToday(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0))
                          ? 'border-t-2 border-b-2 border-red-500'
                          : ''
                        } ${dayIndex === month.days - 1 && index < months.length - 1
                          ? "border-r border-gray-300"
                          : ""
                        }`}
                    >
                      <Text size="1" className={isToday(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0)) ? "font-bold text-red-600" : ""}>
                        {dayIndex + 1}
                      </Text>
                    </Table.ColumnHeaderCell>
                  ))
                )}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {tasks.map((task, taskIndex) => {
                const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);

                return (
                  <React.Fragment key={taskIndex}>
                    <Table.Row>
                      {Array.from({ length: 365 }).map((_, dayIndex) => {
                        const isStart = dayIndex + 1 === startCol;
                        const isEnd = dayIndex + 1 === startCol + span - 1;

                        return (
                          <Table.Cell key={dayIndex} className="relative group border-b border-gray-300">
                            {isStart && (
                              <div
                                className={`absolute h-8 top-1/2 transform -translate-y-1/2 rounded-md ${getStatusColor(task.status)} transition-all duration-200 task-bar shadow-sm hover:shadow-md`}
                                style={{
                                  left: 0,
                                  width: `calc(${span} * 100%)`,
                                  zIndex: 10
                                }}
                                data-task-id={task.taskId}
                              >
                                {/* Resize handle for start date */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-4 cursor-w-resize hover:bg-opacity-30 hover:bg-white transition-colors duration-150 flex items-center justify-center"
                                  onMouseDown={(e) => handleResizeStart(e, task, "start")}
                                >
                                  <div className="w-1 h-4 bg-white opacity-0 group-hover:opacity-100 rounded-full"></div>
                                </div>

                                {/* Main content area */}
                                <div
                                  className="absolute left-4 right-4 top-0 bottom-0 cursor-grab active:cursor-grabbing flex items-center justify-between px-2"
                                  onMouseDown={(e) => handleDragStart(e, task)}
                                >
                                  {span > 10 && (
                                    <div className="flex-1 min-w-0">
                                      <span className="text-white text-xs font-medium truncate block">{task.taskName}</span>
                                      {task.progress !== undefined && (
                                        <div className="mt-1">
                                          <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                                            <div
                                              className={`${getProgressColor(task.status)} h-1.5 rounded-full transition-all duration-300`}
                                              style={{ width: `${task.progress}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Resize handle for end date */}
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize hover:bg-opacity-30 hover:bg-white transition-colors duration-150 flex items-center justify-center"
                                  onMouseDown={(e) => handleResizeStart(e, task, "end")}
                                >
                                  <div className="w-1 h-4 bg-white opacity-0 group-hover:opacity-100 rounded-full"></div>
                                </div>

                                {/* Enhanced tooltip */}
                                <div className="absolute invisible group-hover:visible bg-gray-900 text-white p-4 rounded-lg shadow-xl text-xs z-30 bottom-full left-0 mb-2 w-72 opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-sm flex-1">{task.taskName}</p>
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
                                      <span className="text-white">{formatDate(task.startDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400">End:</span>
                                      <span className="text-white">{formatDate(task.endDate)}</span>
                                    </div>
                                    {task.description && (
                                      <div className="mt-2 pt-2 border-t border-gray-700">
                                        <p className="text-gray-400 mb-1">Description:</p>
                                        <p className="text-white text-xs">{task.description}</p>
                                      </div>
                                    )}
                                    {task.budget && (
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
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
                                            className={`${getProgressColor(task.status)} h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${task.progress}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>

                    {/* Subtasks */}
                    {expandedTasks.includes(task.taskId) &&
                      task.subtasks?.map((subtask, subtaskIndex) => {
                        const { startCol, span } = calculateStartColAndSpan(
                          subtask.startDate,
                          subtask.endDate,
                          year
                        );

                        return (
                          <Table.Row key={subtaskIndex} className="bg-gray-50">
                            {Array.from({ length: 365 }).map((_, dayIndex) => {
                              const isStart = dayIndex + 1 === startCol;

                              return (
                                <Table.Cell key={dayIndex} className="relative group">
                                  {isStart && (
                                    <div
                                      className={`absolute h-6 top-1/2 transform -translate-y-1/2 rounded-md ${getStatusColor(subtask.status)} transition-all duration-300 cursor-grab active:cursor-grabbing overflow-visible hover:shadow-lg hover:z-20`}
                                      style={{
                                        left: 0,
                                        width: `calc(${span} * 100%)`,
                                      }}
                                    >
                                      {span > 30 && (
                                        <span className="text-xs text-white px-2 truncate max-w-full inline-block">
                                          {subtask.subtaskName}
                                        </span>
                                      )}

                                      {/* Subtask tooltip */}
                                      <div
                                        className="absolute invisible group-hover:visible bg-gray-900 text-white p-3 rounded shadow-lg text-xs z-30 bottom-full left-0 mb-2 w-60 opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 opacity-100"
                                      >
                                        <p className="font-bold text-sm">{subtask.subtaskName}</p>
                                        <div className="flex justify-between items-center mt-1 mb-2">
                                          <p className="text-gray-300">Duration: {span} days</p>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${subtask.status === "Completed"
                                              ? "bg-green-500"
                                              : subtask.status === "In Progress"
                                                ? "bg-blue-500"
                                                : subtask.status === "Delayed"
                                                  ? "bg-red-500"
                                                  : ""
                                              }`}
                                          >
                                            {subtask.status}
                                          </span>
                                        </div>
                                        <p className="text-gray-300 mb-1">From: {formatDate(subtask.startDate)}</p>
                                        <p className="text-gray-300">To: {formatDate(subtask.endDate)}</p>
                                        {subtask.progress !== undefined && (
                                          <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-xs">Progress</span>
                                              <span className="text-xs">{subtask.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                              <div
                                                className={`${getProgressColor(subtask.status)} h-1.5 rounded-full`}
                                                style={{ width: `${subtask.progress}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        )}
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

