import React, { useState, useEffect } from "react";
import { Table, Text } from "@radix-ui/themes";
import { getTask, updateStartDateTask, updateEndDateTask } from "@/services/task.service";
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
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year + 2000, month - 1, day);
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

// Main Component
const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);


  useEffect(() => {
    const fetchTasks = async () => {
      const response = await getTask();
      const mappedTasks = response.responseObject.map((task: any) => ({
        taskId: task.task_id,
        taskName: task.task_name,
        description: task.description,
        budget: Number(task.budget),
        startDate: task.start_date,
        endDate: task.end_date,
        status: task.status,
        subtasks: task.subtasks || [],
      }));
    };

    fetchTasks();


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
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const target = e.currentTarget as HTMLElement; // แปลงประเภทเป็น HTMLElement
    target.dataset.dragging = "true";
    target.dataset.startX = e.clientX.toString();
    target.dataset.taskId = task.taskId;
  };

  const handleDragMove = (e: React.MouseEvent) => {
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement; // แปลงประเภทเป็น HTMLElement
    if (!draggingElement) return;

    const startX = parseInt(draggingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;

    // คำนวณจำนวนวันที่เลื่อน
    const daysMoved = Math.round(deltaX / 20); // สมมติว่า 20px = 1 วัน
    const taskId = draggingElement.dataset.taskId;

    if (taskId) {
      const task = tasks.find((t) => t.taskId === taskId);
      if (task) {
        const newStartDate = new Date(parseDate(task.startDate));
        const newEndDate = new Date(parseDate(task.endDate));

        newStartDate.setDate(newStartDate.getDate() + daysMoved);
        newEndDate.setDate(newEndDate.getDate() + daysMoved);

        // อัปเดตวันที่ใหม่ใน UI (ถ้าจำเป็น)
        draggingElement.style.transform = `translateX(${deltaX}px)`;
      }
    }
  };

  const handleDragEnd = async (e: React.MouseEvent) => {
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement; // แปลงประเภทเป็น HTMLElement
    if (!draggingElement) return;

    const taskId = draggingElement.dataset.taskId;
    const deltaX = parseInt(draggingElement.style.transform.replace("translateX(", "").replace("px)", ""), 10);
    const daysMoved = Math.round(deltaX / 20);

    if (taskId) {
      const task = tasks.find((t) => t.taskId === taskId);
      if (task) {
        const newStartDate = new Date(parseDate(task.startDate));
        const newEndDate = new Date(parseDate(task.endDate));

        newStartDate.setDate(newStartDate.getDate() + daysMoved);
        newEndDate.setDate(newEndDate.getDate() + daysMoved);

        try {
          // เรียก API เพื่ออัปเดตวันที่
          console.log("Payload:", { task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
          await updateStartDateTask({ task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
          await updateEndDateTask({ task_id: taskId, end_date: newEndDate.toISOString().split("T")[0] });

          // รีเฟรชข้อมูล Task
          fetchTasks();
        } catch (error) {
          console.error("Failed to update task dates:", error);
        }
      }
    }

    // รีเซ็ตสถานะการลาก
    draggingElement.dataset.dragging = "false";
    draggingElement.style.transform = "";
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task, direction: "start" | "end") => {
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const target = e.currentTarget as HTMLElement;
    target.dataset.resizing = direction;
    target.dataset.startX = e.clientX.toString();
    target.dataset.taskId = task.taskId;
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const startX = parseInt(resizingElement.dataset.startX || "0", 10);
    const deltaX = e.clientX - startX;
    const daysMoved = Math.round(deltaX / 20); // สมมติว่า 20px = 1 วัน
    const taskId = resizingElement.dataset.taskId;
    const direction = resizingElement.dataset.resizing as "start" | "end";

    if (taskId && direction) {
      const task = tasks.find((t) => t.taskId === taskId);
      if (task) {
        const newStartDate = new Date(parseDate(task.startDate));
        const newEndDate = new Date(parseDate(task.endDate));

        if (direction === "start") {
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
        } else if (direction === "end") {
          newEndDate.setDate(newEndDate.getDate() + daysMoved);
        }

        // อัปเดตวันที่ใหม่ใน UI (ถ้าจำเป็น)
        resizingElement.style.transform = `translateX(${deltaX}px)`;
      }
    }
  };

  const handleResizeEnd = async (e: React.MouseEvent) => {
    e.preventDefault(); // ป้องกันการเลือกข้อความขณะลาก
    const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
    if (!resizingElement) return;

    const taskId = resizingElement.dataset.taskId;
    const deltaX = parseInt(resizingElement.style.transform.replace("translateX(", "").replace("px)", ""), 10);
    const daysMoved = Math.round(deltaX / 20);
    const direction = resizingElement.dataset.resizing as "start" | "end";

    if (taskId && direction) {
      const task = tasks.find((t) => t.taskId === taskId);
      if (task) {
        const newStartDate = new Date(parseDate(task.startDate));
        const newEndDate = new Date(parseDate(task.endDate));

        if (direction === "start") {
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
        } else if (direction === "end") {
          newEndDate.setDate(newEndDate.getDate() + daysMoved);
        }

        try {
          // เรียก API เพื่ออัปเดตวันที่
          if (direction === "start") {
            await updateStartDateTask({ task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
          } else if (direction === "end") {
            await updateEndDateTask({ task_id: taskId, end_date: newEndDate.toISOString().split("T")[0] });
          }

          // รีเฟรชข้อมูล Task
          fetchTasks();
        } catch (error) {
          console.error("Failed to update task dates:", error);
        }
      }
    }

    // รีเซ็ตสถานะการปรับขนาด
    resizingElement.dataset.resizing = "";
    resizingElement.style.transform = "";
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
                <Table.ColumnHeaderCell rowSpan={2} className="w-[350px] bg-yellow-200 text-left align-middle">
                  Task Name
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle">
                  Start Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle">
                  End Date
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle border-r-2 border-gray-300">
                  Status
                </Table.ColumnHeaderCell>
              </Table.Row>
              <Table.Row></Table.Row> {/* Empty row for alignment */}
            </Table.Header>

            <Table.Body>
              {tasks.map((task, taskIndex) => (
                <React.Fragment key={taskIndex}>
                  <Table.Row>
                    <Table.Cell className="w-[350px] bg-yellow-200 flex items-center">
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
                    <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(task.startDate)}</Table.Cell>
                    <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(task.endDate)}</Table.Cell>
                    <Table.Cell className="w-[100px] bg-yellow-200 border-r-2 border-gray-300">{task.status}</Table.Cell>
                  </Table.Row>

                  {expandedTasks.includes(task.taskId) &&
                    task.subtasks?.map((subtask, subtaskIndex) => (
                      <Table.Row key={subtaskIndex} className="bg-gray-50">
                        <Table.Cell className="pl-8 w-[250px] bg-yellow-200">
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
                        <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.startDate)}</Table.Cell>
                        <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.endDate)}</Table.Cell>
                        <Table.Cell className="w-[100px] bg-yellow-200 border-r-2 border-gray-300">
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
                    className={`text-center ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
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
                      className={`text-center ${isWeekend(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0))
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
                        return (
                          <Table.Cell key={dayIndex} className="relative group">
                            {isStart && span > 0 && (
                              <div
                                className={`absolute h-6 top-1/2 transform -translate-y-1/2 rounded-md ${getStatusColor(task.status)} transition-all duration-300 cursor-grab active:cursor-grabbing overflow-visible hover:shadow-lg hover:z-20`}
                                style={{
                                  left: 0,
                                  width: `calc(${span} * 100%)`,
                                }}
                                onMouseDown={(e) => handleDragStart(e, task)}
                                onMouseMove={handleDragMove}
                                onMouseUp={handleDragEnd}
                                onMouseLeave={handleDragEnd}
                              >
                                {/* Progress bar */}
                                {task.progress !== undefined && (
                                  <div
                                    className="absolute top-0 left-0 h-full bg-opacity-30 bg-white rounded-l-md"
                                    style={{ width: `${task.progress}%` }}
                                  ></div>
                                )}

                                {/* Task name */}
                                {span > 100 && (
                                  <span className="text-xs text-white px-2 truncate max-w-full inline-block relative z-10">
                                    {task.taskName}
                                  </span>
                                )}

                                {/* Enhanced tooltip with more details */}
                                <div className="absolute invisible group-hover:visible bg-gray-900 text-white p-3 rounded shadow-lg text-xs z-30 bottom-full left-0 mb-2 w-60 opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 opacity-100">
                                  <p className="font-bold text-sm">{task.taskName}</p>
                                  <div className="flex justify-between items-center mt-1 mb-2">
                                    <p className="text-gray-300">Duration: {span} days</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : task.status === 'Delayed' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 mb-1">From: {formatDate(task.startDate)}</p>
                                  <p className="text-gray-300">To: {formatDate(task.endDate)}</p>
                                  {task.progress !== undefined && (
                                    <div className="mt-2">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs">Progress</span>
                                        <span className="text-xs">{task.progress}%</span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                                        <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* ส่วนจับขยายขอบด้านซ้าย */}
                                <div
                                  className="absolute left-0 top-0 w-3 h-full bg-gradient-to-r from-blue-700 to-transparent cursor-w-resize opacity-0 group-hover:opacity-80 hover:opacity-100 rounded-l-md transition-all duration-150 ease-in-out"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleResizeStart(e, task, "start");
                                  }}
                                  onMouseMove={(e) => {
                                    e.preventDefault();
                                    handleResizeMove(e);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    handleResizeEnd(e);
                                  }}
                                  title="ลากเพื่อปรับวันที่เริ่มต้น"
                                >
                                  <div className="flex items-center justify-center h-full">
                                    <div className="w-0.5 h-3 bg-white mx-0.5"></div>
                                  </div>
                                </div>

                                {/* ส่วนจับขยายขอบด้านขวา */}
                                <div
                                  className="absolute right-0 top-0 w-3 h-full bg-gradient-to-l from-blue-700 to-transparent cursor-e-resize opacity-0 group-hover:opacity-80 hover:opacity-100 rounded-r-md transition-all duration-150 ease-in-out"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleResizeStart(e, task, "end");
                                  }}
                                  onMouseMove={(e) => {
                                    e.preventDefault();
                                    handleResizeMove(e);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    handleResizeEnd(e);
                                  }}
                                  title="ลากเพื่อปรับวันที่สิ้นสุด"
                                >
                                  <div className="flex items-center justify-center h-full">
                                    <div className="w-0.5 h-3 bg-white mx-0.5"></div>
                                  </div>
                                </div>

                                {/* ส่วนจับลากตรงกลาง */}
                                <div
                                  className="absolute inset-0 cursor-grab active:cursor-grabbing hover:bg-black hover:bg-opacity-10 transition-colors duration-200"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleDragStart(e, task);
                                  }}
                                  onMouseMove={(e) => {
                                    e.preventDefault();
                                    handleDragMove(e);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    handleDragEnd(e);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.preventDefault();
                                    handleDragEnd(e);
                                  }}
                                  title="ลากเพื่อย้ายงาน"
                                ></div>

                              </div>
                            )}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>

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
                                                    : "bg-yellow-500"
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
                                                className="bg-blue-400 h-1.5 rounded-full"
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
