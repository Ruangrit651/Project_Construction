// import React, { useEffect, useState } from "react";
// import { Card, Text, Flex, Spinner, Button, Table } from "@radix-ui/themes";
// import { getTask } from "@/services/task.service";
// import { TypeTask } from "@/types/response/response.task";
// import { getSubtask } from "@/services/subtask.service";
// import { TypeSubTask } from "@/types/response/response.subtask";
// import DialogAddTask from "./components/DialogAddTask";
// import DialogAddSubTask from "./components/DialogAddSubTask";
// import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
// import DialogEditTask from "./components/DialogEditTask";
// import DialogEditSubTask from "./components/DialogEditSubtask";
// import TaskRow from "./components/taskRow";
// import SubtaskRow from "./components/subtaskRow";
// import Gatt from "./components/Gatt.css";
// import DateTable from "./test";


// export default function TaskPage() {
//     const [tasks, setTasks] = useState<TypeTask[]>([]);
//     const [subtasks, setSubtasks] = useState<TypeSubTask[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//     const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
//     const [years, setYears] = useState<number[]>([]);
//     const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

//     // Helper function to toggle task expansion
//     const toggleTaskExpansion = (taskId: string) => {
//         setExpandedTasks(prev => ({
//             ...prev,
//             [taskId]: !prev[taskId]
//         }));
//     };

//     // Helper function to format date as dd/mm/yy
//     const formatDate = (dateString: string | undefined) => {
//         if (!dateString) return "-";
        
//         const date = new Date(dateString);
//         const day = date.getDate().toString().padStart(2, '0');
//         const month = (date.getMonth() + 1).toString().padStart(2, '0');
//         const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
        
//         return `${day}/${month}/${year}`;
//     };

//     const fetchTasks = async () => {
//         setIsLoading(true);
//         try {
//             const response = await getTask();
//             if (response.success) {
//                 const taskData = response.responseObject;
//                 setTasks(taskData);
                
//                 const taskYears: number[] = taskData.reduce((acc: number[], task) => {
//                     if (task.start_date) {
//                         const year = new Date(task.start_date).getFullYear();
//                         if (!acc.includes(year)) acc.push(year);
//                     }
//                     if (task.end_date) {
//                         const year = new Date(task.end_date).getFullYear();
//                         if (!acc.includes(year)) acc.push(year);
//                     }
//                     return acc;
//                 }, []);
                
//                 // Set the years and default to current year if available
//                 if (taskYears.length > 0) {
//                     setYears(taskYears.sort());
//                     if (taskYears.includes(new Date().getFullYear())) {
//                         setSelectedYear(new Date().getFullYear());
//                     } else {
//                         setSelectedYear(taskYears[0]);
//                     }
//                 }
//             } else {
//                 console.error("Failed to fetch tasks");
//             }
//         } catch (error) {
//             console.error("Error fetching tasks:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const fetchSubtasks = async () => {
//         try {
//             const response = await getSubtask();
//             if (response.success) {
//                 setSubtasks(response.responseObject);
//             } else {
//                 console.error("Failed to fetch subtasks");
//             }
//         } catch (error) {
//             console.error("Error fetching subtasks:", error);
//         }
//     };

//     // Calculate the column position and span for a task based on its dates
//     const calculateTaskPosition = (startDate: string | undefined, endDate: string | undefined, year: number) => {
//         if (!startDate || !endDate) return { start: 1, span: 1 };
        
//         const start = new Date(startDate);
//         const end = new Date(endDate);
        
//         // Calculate start column (1-12 for Jan-Dec)
//         let startCol = 1;
//         if (start.getFullYear() === year) {
//             startCol = start.getMonth() + 1;
//         } else if (start.getFullYear() < year) {
//             // If task starts before the selected year, start from January
//             startCol = 1;
//         } else {
//             // If task starts after the selected year, it shouldn't be visible
//             return { start: 0, span: 0 };
//         }
        
//         // Calculate end column and span
//         let endCol = 12;
//         if (end.getFullYear() === year) {
//             endCol = end.getMonth() + 1;
//         } else if (end.getFullYear() < year) {
//             // If task ends before the selected year, it shouldn't be visible
//             return { start: 0, span: 0 };
//         }
        
//         const span = endCol - startCol + 1;
//         return { start: startCol, span: span > 0 ? span : 1 };
//     };
    
//     useEffect(() => {
//         fetchTasks();
//         fetchSubtasks();
//     }, []);

//     // Helper function to determine the status color
//     const getStatusColor = (status: string | boolean) => {
//         if (typeof status === "string") {
//             return status.toLowerCase() === "done" ? "bg-green-500" : "bg-blue-500";
//         }
//         // If status is boolean
//         return status ? "bg-green-500" : "bg-blue-500";
//     };

//     // Helper function to get subtask status color
//     const getSubtaskStatusColor = (status: string | boolean) => {
//         if (typeof status === "string") {
//             return status.toLowerCase() === "done" ? "bg-green-300" : "bg-blue-300";
//         }
//         // If status is boolean
//         return status ? "bg-green-300" : "bg-blue-300";
//     };

//     return (
//         <Card variant="surface">
//             <Flex justify="between" mb="4">
//                 <Text size="4" weight="bold">Task Management</Text>
//                 <Flex gap="2">
//                     <DialogAddTask getTaskData={fetchTasks} />
//                 </Flex>
//             </Flex>
            
//             {/* Year selector */}
//             {years.length > 0 && (
//                 <Flex gap="2" mb="4">
//                     <Text>Year:</Text>
//                     <select 
//                         value={selectedYear}
//                         onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                         className="px-2 py-1 border border-gray-300 rounded"
//                     >
//                         {years.map(year => (
//                             <option key={year} value={year}>{year}</option>
//                         ))}
//                     </select>
//                 </Flex>
//             )}
            
//             {isLoading ? (
//                 <Flex justify="center" align="center" style={{ height: "200px" }}>
//                     <Spinner size="3" />
//                 </Flex>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <Table.Root variant="surface" className="min-w-[1200px]">
//                         <Table.Header>
//                             <Table.Row>
//                                 <Table.ColumnHeaderCell className="w-[180px]">Task Name</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell className="w-[100px]">Start Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell className="w-[100px]">End Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell className="w-[100px] border-r-2 border-gray-300">Status</Table.ColumnHeaderCell>
//                                 {Array.from({ length: 12 }).map((_, index) => (
//                                     <Table.ColumnHeaderCell key={index} className="sticky top-0">
//                                         <Text className="text-center text-xs">
//                                             {new Date(selectedYear, index).toLocaleString("default", { month: "short" })}
//                                         </Text>
//                                     </Table.ColumnHeaderCell>
//                                 ))}
//                             </Table.Row>
//                         </Table.Header>
//                         <Table.Body>
//                                 {tasks
//                                     .filter(task => {
//                                         const { start, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
//                                         return start !== 0 && span !== 0;
//                                     })
//                                     .map((task) => {
//                                         const { start: startCol, span } = calculateTaskPosition(task.start_date, task.end_date, selectedYear);
//                                         const taskSubtasks = subtasks.filter(subtask => subtask.task_id === task.task_id);
//                                         const hasSubtasks = taskSubtasks.length > 0;
//                                         const isExpanded = expandedTasks[task.task_id] || false;

//                                         return (
//                                             <React.Fragment key={task.task_id}>
//                                                 <Table.Row >
//                                                     <Table.Cell className="hover:bg-gray-100 cursor-pointer">
//                                                         <Flex align="center" gap="2">
//                                                             {hasSubtasks && (
//                                                                 <Button
//                                                                     variant="ghost"
//                                                                     size="1"
//                                                                     onClick={() => toggleTaskExpansion(task.task_id)}
//                                                                     className="p-0 cursor-pointer"
//                                                                 >
//                                                                     {isExpanded ? (
//                                                                         <ChevronDownIcon className="w-4 h-4" />
//                                                                     ) : (
//                                                                         <ChevronRightIcon className="w-4 h-4" />
//                                                                     )}
//                                                                 </Button>
//                                                             )}
//                                                             <DialogEditTask
//                                                                 getTaskData={fetchTasks}
//                                                                 taskId={task.task_id}
//                                                                 trigger={<Text className="cursor-pointer hover:text-blue-500">{task.task_name}</Text>}
//                                                             />
//                                                             <DialogAddSubTask
//                                                                 getSubtaskData={fetchSubtasks}
//                                                                 taskId={task.task_id}
//                                                                 taskName={task.task_name}
//                                                             />
//                                                         </Flex>
//                                                     </Table.Cell>
//                                                     <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
//                                                     <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
//                                                     <TaskRow
//                                                         taskName={task.task_name}
//                                                         startDate={formatDate(task.start_date)}
//                                                         endDate={formatDate(task.end_date)}
//                                                         status={task.status}
//                                                         startCol={startCol}
//                                                         span={span}
//                                                     />
//                                                 </Table.Row>

//                                                 {isExpanded &&
//                                                     taskSubtasks.map(subtask => {
//                                                         const { start: subStartCol, span: subSpan } = calculateTaskPosition(
//                                                             subtask.start_date,
//                                                             subtask.end_date,
//                                                             selectedYear
//                                                         );

//                                                         if (subStartCol === 0 || subSpan === 0) return null;

//                                                         return (
//                                                             <Table.Row key={subtask.subtask_id} className="bg-gray-50">
//                                                                 <Table.Cell className=" hover:bg-gray-100 cursor-pointer" colSpan={1}>
//                                                                     <DialogEditSubTask
//                                                                         getSubtaskData={fetchSubtasks}
//                                                                         subtaskId={subtask.subtask_id}
//                                                                         trigger={<Text className="cursor-pointer hover:text-blue-500">{subtask.subtask_name}</Text>}
//                                                                     />
//                                                                 </Table.Cell>
//                                                                 <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
//                                                                 <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
//                                                                 <SubtaskRow
//                                                                     subtaskName={subtask.subtask_name}
//                                                                     startDate={formatDate(subtask.start_date)}
//                                                                     endDate={formatDate(subtask.end_date)}
//                                                                     status={subtask.status}
//                                                                     startCol={subStartCol}
//                                                                     span={subSpan}
//                                                                 />
//                                                             </Table.Row>
//                                                         );
//                                                     })}
//                                             </React.Fragment>
//                                         );
//                                     })}
//                             </Table.Body>
//                     </Table.Root>
//                 </div>
                
//             )}
//         </Card>
//     );
// }

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
                <div className="overflow-x-auto">
                    <Table.Root variant="surface" className="min-w-[1200px]">
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

