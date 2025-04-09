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
    return new Date(year + 2000, month - 1, day); // เพิ่ม 2000 เพื่อให้เป็นปี 2025
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

    if (start.getFullYear() !== year && end.getFullYear() !== year) {
        return { startCol: 0, span: 0 };
    }

    const startCol = Math.max(
        1,
        Math.floor((start.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const endCol = Math.min(
        365,
        Math.floor((end.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
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
        const target = e.currentTarget as HTMLElement; // แปลงประเภทเป็น HTMLElement
        target.dataset.dragging = "true";
        target.dataset.startX = e.clientX.toString();
        target.dataset.taskId = task.taskId;
    };

    const handleDragMove = (e: React.MouseEvent) => {
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
        const target = e.currentTarget as HTMLElement;
        target.dataset.resizing = direction;
        target.dataset.startX = e.clientX.toString();
        target.dataset.taskId = task.taskId;
    };

    const handleResizeMove = (e: React.MouseEvent) => {
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
            <div className="flex space-x-2">
              {/* You could add controls here like zoom, filter, etc. */}
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Today</button>
              <select className="border rounded px-2 py-1">
                <option>Filter by Status</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Delayed</option>
              </select>
            </div>
          </div>
          
          {/* Your existing table structure */}
          <div className="relative w-screen overflow-hidden">
            {/* Fixed left columns container */}
            <div className="absolute left-0 top-0 z-10 overflow-hidden">
              <Table.Root variant="surface" className="w-auto shadow-md">
                <Table.Header className=" h-[88px]">
                  <Table.Row>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[50px] bg-yellow-200 text-left align-middle">
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
                          className={`text-center ${
                            isWeekend(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0)) 
                              ? 'bg-gray-100' 
                              : 'bg-gray-50'
                          } ${
                            isToday(year, dayIndex + 1 + months.slice(0, index).reduce((acc, m) => acc + m.days, 0))
                              ? 'border-t-2 border-b-2 border-red-500'
                              : ''
                          } ${
                            dayIndex === month.days - 1 && index < months.length - 1
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
                                    className={`absolute h-6 top-1/2 transform -translate-y-1/2 rounded ${getStatusColor(task.status)} transition-all duration-300 cursor-move overflow-hidden`}
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
                                        className="absolute top-0 left-0 h-full bg-opacity-30 bg-white" 
                                        style={{ width: `${task.progress}%` }}
                                      ></div>
                                    )}
                                    
                                    {/* Task name */}
                                    {span > 30 && (
                                      <span className="text-xs text-white px-2 truncate max-w-full inline-block relative z-10">
                                        {task.taskName}
                                      </span>
                                    )}
                                    
                                    {/* Tooltip */}
                                    <div className="absolute invisible group-hover:visible bg-gray-900 text-white p-2 rounded text-xs z-30 bottom-full left-0 mb-1 w-48">
                                      <p className="font-bold">{task.taskName}</p>
                                      <p>{formatDate(task.startDate)} - {formatDate(task.endDate)}</p>
                                      <p>Status: <span className={`font-medium ${task.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>{task.status}</span></p>
                                    </div>
                                    
                                    {/* Resize handles */}
                                    <div 
                                      className="absolute left-0 top-0 w-2 h-full bg-blue-700 cursor-w-resize opacity-0 group-hover:opacity-100"
                                      onMouseDown={(e) => {e.stopPropagation(); handleResizeStart(e, task, "start");}}
                                      onMouseMove={handleResizeMove}
                                      onMouseUp={handleResizeEnd}
                                    ></div>
                                    <div 
                                      className="absolute right-0 top-0 w-2 h-full bg-blue-700 cursor-e-resize opacity-0 group-hover:opacity-100"
                                      onMouseDown={(e) => {e.stopPropagation(); handleResizeStart(e, task, "end");}}
                                      onMouseMove={handleResizeMove}
                                      onMouseUp={handleResizeEnd}
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
                                          className="absolute h-4 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
                                          style={{
                                            left: 0,
                                            width: `calc(${span} * 100%)`,
                                            borderLeft: "2px solid #10b981",
                                          }}
                                        >
                                          {span > 30 && (
                                            <span className="text-xs text-white px-2 truncate max-w-full inline-block">
                                              {subtask.subtaskName}
                                            </span>
                                          )}
                                          
                                          {/* Subtask tooltip */}
                                          <div className="absolute invisible group-hover:visible bg-gray-900 text-white p-2 rounded text-xs z-30 bottom-full left-0 mb-1 w-48">
                                            <p className="font-bold">{subtask.subtaskName}</p>
                                            <p>{formatDate(subtask.startDate)} - {formatDate(subtask.endDate)}</p>
                                            <p>Status: <span className={`font-medium ${subtask.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>{subtask.status}</span></p>
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
