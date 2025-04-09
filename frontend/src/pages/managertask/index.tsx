import React, { useEffect, useState } from "react";
import { Card, Text, Flex, Spinner, Button, Table } from "@radix-ui/themes";
import { getTask } from "@/services/task.service";
import { TypeTask } from "@/types/response/response.task";
import { getSubtask } from "@/services/subtask.service";
import { TypeSubTask } from "@/types/response/response.subtask";
import DialogAddTask from "./components/DialogAddTask";
import DateTable from "./test";


export default function TaskPage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [subtasks, setSubtasks] = useState<TypeSubTask[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);

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

    return (
        <Card variant="surface">
            <Flex justify="between" mb="4">
                <Text size="4" weight="bold">Task Management</Text>
                <Flex gap="2">
                    <DialogAddTask getTaskData={fetchTasks} />
                </Flex>
            </Flex>

            {/* Year selector */}
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

            {isLoading ? (
                <Flex justify="center" align="center" style={{ height: "200px" }}>
                    <Spinner size="3" />
                </Flex>
            ) : (
                <div>
                    <Table.Root variant="surface" className="min-w-[1200px] overflow-hidden">
                        <DateTable
                        
                            year={selectedYear}
                            tasks={tasks.map(task => {
                                const { start, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
                                const taskSubtasks = subtasks
                                    .filter(subtask => subtask.task_id === task.task_id)
                                    .map(subtask => {
                                        const { start: subStart, span: subSpan } = calculateTaskPosition(subtask.start_date, subtask.end_date, selectedYear);
                                        return {
                                            subtaskName: subtask.subtask_name,
                                            startDate: formatDate(subtask.start_date),
                                            endDate: formatDate(subtask.end_date),
                                            description: subtask.description,
                                            budget: subtask.budget,
                                            status: subtask.status,
                                            startCol: subStart,
                                            span: subSpan,
                                            subtaskId: subtask.subtask_id,
                                        };
                                    });
                                return {
                                    taskName: task.task_name,
                                    startDate: formatDate(task.start_date),
                                    endDate: formatDate(task.end_date),
                                    description: task.description,
                                    budget: task.budget,
                                    status: task.status,
                                    startCol: start,
                                    span: span,
                                    taskId: task.task_id,
                                    subtasks: taskSubtasks,
                                };
                            })}
                            fetchTasks={fetchTasks}
                            fetchSubtasks={fetchSubtasks}
                        />
                    </Table.Root>
                </div>
            )}
        </Card>
    );
}

