import { useEffect, useState } from "react";
import { Card, Text, Flex, Spinner, Button, Table } from "@radix-ui/themes";
import { getTask } from "@/services/task.service";
import { TypeTask } from "@/types/response/response.task";
import { getSubtask } from "@/services/subtask.service";
import { TypeSubTask } from "@/types/response/response.subtask";
import DialogAddTask from "./components/DialogAddTask";
import DialogAddSubTask from "./components/DialogAddSubTask";

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

    return (
        <Card variant="surface">
            <Flex justify="between" mb="4">
                <Text size="4" weight="bold">Task Management</Text>
                <Flex gap="2">
                    <DialogAddTask getTaskData={fetchTasks} />
                    <DialogAddSubTask getSubtaskData={fetchSubtasks} />
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
                <div className="overflow-x-auto">
                    <Table.Root variant="surface" className="min-w-[1200px]">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell className="w-[200px]">Task Name</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell className="w-[100px]">Start Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell className="w-[100px]">End Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell className="w-[100px]">Status</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>
                                    <div className="flex-1">
                                        <Flex className="text-lg font-semibold mb-2">Timeline - {selectedYear}</Flex>
                                        <Flex className="grid grid-cols-12 gap-1">
                                            {Array.from({ length: 12 }).map((_, index) => (
                                                <Text key={index} className="text-center text-xs">
                                                    {new Date(selectedYear, index).toLocaleString("default", { month: "short" })}
                                                </Text>
                                            ))}
                                        </Flex>
                                    </div>
                                </Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {tasks
                                .filter(task => {
                                    const { start, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
                                    return start !== 0 && span !== 0;
                                })
                                .map((task) => {
                                    const { start: startCol, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
                                    
                                    return (
                                        <>
                                            <Table.Row key={task.task_id} className="border-b border-gray-200">
                                                <Table.Cell>{task.task_name}</Table.Cell>
                                                <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
                                                <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
                                                <Table.Cell>{task.status}</Table.Cell>
                                                <Table.Cell>
                                                    <div className="grid grid-cols-12 gap-1 h-8">
                                                        <div 
                                                            className={`col-start-${startCol} col-span-${span} h-6 rounded-md ${getStatusColor(task.status)}`}
                                                            style={{ gridColumn: `${startCol} / span ${span}` }}
                                                        ></div>
                                                    </div>
                                                </Table.Cell>
                                            </Table.Row>
                                            
                                            {subtasks
                                                .filter(subtask => subtask.task_id === task.task_id)
                                                .map(subtask => {
                                                    const { start: subStartCol, span: subSpan } = calculateTaskPosition(
                                                        subtask.start_date, 
                                                        subtask.end_date, 
                                                        selectedYear
                                                    );
                                                    
                                                    // Skip subtasks that don't fall within the selected year
                                                    if (subStartCol === 0 || subSpan === 0) return null;
                                                    
                                                    return (
                                                        <Table.Row key={subtask.subtask_id} className="bg-gray-50">
                                                            <Table.Cell className="pl-8">{subtask.subtask_name}</Table.Cell>
                                                            <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
                                                            <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
                                                            <Table.Cell>{subtask.status}</Table.Cell>
                                                            <Table.Cell>
                                                                <div className="grid grid-cols-12 gap-1 h-6">
                                                                    <div 
                                                                        className={`col-start-${subStartCol} col-span-${subSpan} h-4 rounded-md ${getSubtaskStatusColor(subtask.status)}`}
                                                                        style={{ gridColumn: `${subStartCol} / span ${subSpan}` }}
                                                                    ></div>
                                                                </div>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    );
                                                })}
                                        </>
                                    );
                                })}
                        </Table.Body>
                    </Table.Root>
                </div>
            )}
        </Card>
    );
}