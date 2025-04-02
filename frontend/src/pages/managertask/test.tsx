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
        <Table.Root variant="surface" className="min-w-[1400px]">
            {/* Table Header */}
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[200px] text-left align-middle ; ">
                        Task Name
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[200px] text-center align-middle ;" >
                        Start Date
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[200px] text-center align-middle ;" >
                        End Date
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[200px] text-center align-middle border-r-2 border-gray-300 ;" >
                        Status
                    </Table.ColumnHeaderCell>
                    {months.map((month, index) => (
                        <Table.ColumnHeaderCell
                            key={index}
                            colSpan={month.days}
                            className={`text-center bg-gray-100 ${index < months.length - 1 ? "border-r border-gray-300" : ""
                                }`}
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
                                className={`text-center bg-gray-50 ${dayIndex === month.days - 1 && index < months.length - 1
                                    ? "border-r border-gray-300"
                                    : ""
                                    }`}
                            >
                                <Text size="1">{dayIndex + 1}</Text>
                            </Table.ColumnHeaderCell>
                        ))
                    )}
                </Table.Row>
            </Table.Header>

            {/* Table Body */}
            <Table.Body>
                {tasks.map((task, taskIndex) => {
                    const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
                    return (
                        <React.Fragment key={taskIndex}>
                            <Table.Row>
                                <Table.Cell className="w-[350px] flex items-center;">
                                    <button
                                        onClick={() => toggleSubtasks(task.taskId)}
                                        className="mr-2 focus:outline-none"
                                    >
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
                                <Table.Cell className="w-[200px]">{formatDate(task.startDate)}</Table.Cell>
                                <Table.Cell className="w-[200px]">{formatDate(task.endDate)}</Table.Cell>
                                <Table.Cell className="w-[200px] border-r-2 border-gray-300">{task.status}</Table.Cell>
                                {Array.from({ length: 365 }).map((_, dayIndex) => {
                                    const isStart = dayIndex + 1 === startCol;
                                    return (
                                        <Table.Cell key={dayIndex} className="relative group">
                                            {isStart && span > 0 && (
                                                <div
                                                    className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
                                                    style={{
                                                        left: 0,
                                                        width: `calc(${span} * 100%)`,
                                                    }}
                                                >
                                                    <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                                        <strong>Task Name:</strong> {task.taskName}
                                                        <br />
                                                        <strong>Description:</strong> {task.description}
                                                        <br />
                                                        <strong>Start Date:</strong> {task.startDate}
                                                        <br />
                                                        <strong>End Date:</strong> {task.endDate}
                                                        <br />
                                                        <strong>Status:</strong> {task.status}
                                                    </div>

                                                    {/* Handle สำหรับ Resize ด้านซ้าย */}
                                                    <div
                                                        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                                                        onMouseDown={(e) => handleResizeStart(e, task, "start")}
                                                        onMouseMove={handleResizeMove}
                                                        onMouseUp={handleResizeEnd}
                                                    ></div>

                                                    {/* Handle สำหรับ Resize ด้านขวา */}
                                                    <div
                                                        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                                                        onMouseDown={(e) => handleResizeStart(e, task, "end")}
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
                                            <Table.Cell className="pl-8 w-[250px]">
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
                                            <Table.Cell className="w-[150px]">{formatDate(subtask.startDate)}</Table.Cell>
                                            <Table.Cell className="w-[150px]">{formatDate(subtask.endDate)}</Table.Cell>
                                            <Table.Cell className="w-[150px] border-r-2 border-gray-300">
                                                {subtask.status}
                                            </Table.Cell>
                                            {Array.from({ length: 365 }).map((_, dayIndex) => {
                                                const isStart = dayIndex + 1 === startCol;
                                                return (
                                                    <Table.Cell key={dayIndex} className="relative group">
                                                        {isStart && (
                                                            <div
                                                                className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
                                                                style={{
                                                                    left: 0,
                                                                    width: `calc(${span} * 100%)`,
                                                                }}
                                                            >
                                                                <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                                                    <strong>SubTask Name:</strong> {subtask.subtaskName}
                                                                    <br />
                                                                    <strong>Description:</strong> {subtask.description}
                                                                    <br />
                                                                    <strong>Start Date:</strong> {subtask.startDate}
                                                                    <br />
                                                                    <strong>End Date:</strong> {subtask.endDate}
                                                                    <br />
                                                                    <strong>Status:</strong> {subtask.status}
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
    );
};

export default DateTable;