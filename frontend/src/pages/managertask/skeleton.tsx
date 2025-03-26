import React, { useEffect, useState } from "react";
import { Card, Text, Flex, Spinner, Button, Table } from "@radix-ui/themes";
import { getTask } from "@/services/task.service";
import { TypeTask } from "@/types/response/response.task";
import { getSubtask } from "@/services/subtask.service";
import { TypeSubTask } from "@/types/response/response.subtask";
import DialogAddTask from "./components/DialogAddTask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export default function TaskPage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [subtasks, setSubtasks] = useState<TypeSubTask[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

    // Helper function to toggle task expansion
    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Helper function to format date as dd/mm/yy
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
        
        return `${day}/${month}/${year}`;
    };

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await getTask();
            if (response.success) {
                const taskData = response.responseObject;
                setTasks(taskData);
                
                const taskYears: number[] = taskData.reduce((acc: number[], task) => {
                    if (task.start_date) {
                        const year = new Date(task.start_date).getFullYear();
                        if (!acc.includes(year)) acc.push(year);
                    }
                    if (task.end_date) {
                        const year = new Date(task.end_date).getFullYear();
                        if (!acc.includes(year)) acc.push(year);
                    }
                    return acc;
                }, []);
                
                // Set the years and default to current year if available
                if (taskYears.length > 0) {
                    setYears(taskYears.sort());
                    if (taskYears.includes(new Date().getFullYear())) {
                        setSelectedYear(new Date().getFullYear());
                    } else {
                        setSelectedYear(taskYears[0]);
                    }
                }
            } else {
                console.error("Failed to fetch tasks");
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubtasks = async () => {
        try {
            const response = await getSubtask();
            if (response.success) {
                setSubtasks(response.responseObject);
            } else {
                console.error("Failed to fetch subtasks");
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
        }
    };

    // Calculate the column position and span for a task based on its dates
    const calculateTaskPosition = (startDate: string | undefined, endDate: string | undefined, year: number) => {
        if (!startDate || !endDate) return { start: 1, span: 1 };
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Calculate start column (1-12 for Jan-Dec)
        let startCol = 1;
        if (start.getFullYear() === year) {
            startCol = start.getMonth() + 1;
        } else if (start.getFullYear() < year) {
            // If task starts before the selected year, start from January
            startCol = 1;
        } else {
            // If task starts after the selected year, it shouldn't be visible
            return { start: 0, span: 0 };
        }
        
        // Calculate end column and span
        let endCol = 12;
        if (end.getFullYear() === year) {
            endCol = end.getMonth() + 1;
        } else if (end.getFullYear() < year) {
            // If task ends before the selected year, it shouldn't be visible
            return { start: 0, span: 0 };
        }
        
        const span = endCol - startCol + 1;
        return { start: startCol, span: span > 0 ? span : 1 };
    };
    
    useEffect(() => {
        fetchTasks();
        fetchSubtasks();
    }, []);

    // Helper function to determine the status color
    const getStatusColor = (status: string | boolean) => {
        if (typeof status === "string") {
            return status.toLowerCase() === "done" ? "bg-green-500" : "bg-blue-500";
        }
        // If status is boolean
        return status ? "bg-green-500" : "bg-blue-500";
    };

    // Helper function to get subtask status color
    const getSubtaskStatusColor = (status: string | boolean) => {
        if (typeof status === "string") {
            return status.toLowerCase() === "done" ? "bg-green-300" : "bg-blue-300";
        }
        // If status is boolean
        return status ? "bg-green-300" : "bg-blue-300";
    };

    const getStatusColorClass = (status: string) => {
        switch (status) {
          case 'In Progress':
            return 'bg-blue-500 group-hover:bg-blue-600';
          case 'Completed':
            return 'bg-green-500 group-hover:bg-green-600';
          case 'Delayed':
            return 'bg-red-500 group-hover:bg-red-600';
          default:
            return 'bg-gray-400 group-hover:bg-gray-500';
        }
      };
      

    return (
        <Card variant="surface">
            {/* Header Task */}
            <Flex justify="between" mb="4">
                <Text size="4" weight="bold">Task Management</Text>
                <Flex gap="2">
                <DialogAddTask getTaskData={fetchTasks} />
                </Flex>
            </Flex>

            {/* Year Selector */}
            {years.length > 0 && (
                <Flex gap="2" mb="4">
                <Text>Year:</Text>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded"
                >
                    {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                </Flex>
            )}

            {/* ถ้า Loading */}
            {isLoading ? (
                <Flex justify="center" align="center" style={{ height: "200px" }}>
                <Spinner size="3" />
                </Flex>
            ) : (
                <div>
                   
                    <Table.Root variant="surface" className="min-w-[1200px] ">
                        {/* Header */}
                        <Table.Header>
                        <Table.Row>
                            {/* Sticky Left Columns */}
                            <Table.ColumnHeaderCell
                            className="w-[300px]" 
                            >
                            Task Name
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                            className="[100px]"
                            >
                            Start Date
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                            className=" w-[100px]"
                            >
                            End Date
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                            className=" w-[100px]"
                            >
                            Status
                            </Table.ColumnHeaderCell>

                            {/* Months Timeline Header */}
                            {Array.from({ length: 12 }).map((_, index) => (
                            <Table.ColumnHeaderCell
                                key={index}
                                className=" border border-gray-300 text-xs text-center min-w-[100px]"
                            >
                                {new Date(selectedYear, index).toLocaleString("default", { month: "short" })}
                            </Table.ColumnHeaderCell>
                            ))}
                        </Table.Row>
                        </Table.Header>

                        {/* Body */}
                        <Table.Body>
                        {tasks.map((task) => {
                            const { start: startCol, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
                            const taskSubtasks = subtasks.filter(subtask => subtask.task_id === task.task_id);
                            const hasSubtasks = taskSubtasks.length > 0;
                            const isExpanded = expandedTasks[task.task_id] || false;

                            return (
                            <React.Fragment key={task.task_id}>
                                {/* Task Row */}
                                <Table.Row className="hover:bg-gray-50 group relative">
                                {/* Sticky Left Columns */}
                                <Table.RowHeaderCell
                                    className=" w-[300px] p-2" // Increased width
                                >
                                    <Flex align="center" gap="2">
                                    {hasSubtasks && (
                                        <Button
                                        variant="ghost"
                                        size="1"
                                        onClick={() => toggleTaskExpansion(task.task_id)}
                                        className="p-0 cursor-pointer"
                                        >
                                        {isExpanded ?
                                            <ChevronDownIcon className="w-4 h-4" /> :
                                            <ChevronRightIcon className="w-4 h-4" />}
                                        </Button>
                                    )}
                                    <Text>{task.task_name}</Text>
                                    <DialogAddSubTask
                                        getSubtaskData={fetchSubtasks}
                                        taskId={task.task_id}
                                        taskName={task.task_name}
                                    />
                                    </Flex>
                                </Table.RowHeaderCell>

                                <Table.Cell
                                    className="w-[100px]"
                                >
                                    {formatDate(task.start_date)}
                                </Table.Cell>
                                <Table.Cell
                                    className=" w-[100px]"
                                >
                                    {formatDate(task.end_date)}
                                </Table.Cell>
                                <Table.Cell
                                    className=" w-[100px]"
                                >
                                    {task.status}
                                </Table.Cell>

                                {/* Timeline */}
                                {Array.from({ length: 12 }).map((_, monthIndex) => {
                                    const isStart = monthIndex + 1 === startCol;
                                    const showBar = monthIndex + 1 >= startCol && monthIndex + 1 < startCol + span;

                                    return (
                                    <Table.Cell
                                        key={monthIndex}
                                        className="border border-gray-300 relative min-w-[100px] h-[50px] p-0"
                                    >
                                        {isStart && (
                                        <div
                                            className="absolute h-4 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
                                            style={{
                                            left: 0,
                                            width: `calc(${span} * 100%)`
                                            }}
                                        >
                                            {/* Hover Tooltip */}
                                            <div className="hidden group-hover:block absolute top-[-32px] left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-gray-700 text-white rounded shadow">
                                            {task.task_name}<br />
                                            {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                            </div>
                                        </div>
                                        )}
                                    </Table.Cell>
                                    );
                                })}
                                </Table.Row>

                                {/* Subtask Rows */}
                                {isExpanded && taskSubtasks.map((subtask) => {
                                const { start: subStartCol, span: subSpan } = calculateTaskPosition(subtask.start_date, subtask.end_date, selectedYear);
                                if (subStartCol === 0 || subSpan === 0) return null;

                                return (
                                    <Table.Row key={subtask.subtask_id} className="hover:bg-gray-50 group relative bg-gray-50">
                                    <Table.RowHeaderCell
                                        className=" w-[300px] p-2 pl-8" // Increased width
                                    >
                                        {subtask.subtask_name}
                                    </Table.RowHeaderCell>
                                    <Table.Cell
                                        className=" w-[100px]"
                                    >
                                        {formatDate(subtask.start_date)}
                                    </Table.Cell>
                                    <Table.Cell
                                        className=" w-[100px]"
                                    >
                                        {formatDate(subtask.end_date)}
                                    </Table.Cell>
                                    <Table.Cell
                                        className=" w-[100px]"
                                    >
                                        {subtask.status}
                                    </Table.Cell>

                                    {/* Subtask Timeline */}
                                    {Array.from({ length: 12 }).map((_, monthIndex) => {
                                        const isStart = monthIndex + 1 === subStartCol;

                                        return (
                                        <Table.Cell
                                            key={monthIndex}
                                            className=" border border-gray-300 relative min-w-[100px] h-[50px] p-0"
                                        >
                                            {isStart && (
                                            <div
                                                className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
                                                style={{
                                                left: 0,
                                                width: `calc(${subSpan} * 100%)`
                                                }}
                                            >
                                                {/* Hover Tooltip */}
                                                <div className="hidden group-hover:block absolute top-[-32px] left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-gray-700 text-white rounded shadow">
                                                {subtask.subtask_name}<br />
                                                {formatDate(subtask.start_date)} - {formatDate(subtask.end_date)}
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
            )}
            </Card>


    );
}