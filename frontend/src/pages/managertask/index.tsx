// // import { useEffect, useState, Fragment } from "react";
// // import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
// // import { getTask } from "@/services/task.service";
// // import { TypeTask } from "@/types/response/response.task";
// // import DialogAddTask from "./components/DialogAddTask";
// // import DialogEditTask from "./components/DialogEditTask";
// // import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";

// // export default function TaskPage() {
// //     const [tasks, setTasks] = useState<TypeTask[]>([]);
// //     const [isLoading, setIsLoading] = useState<boolean>(true);

// //     const fetchTasks = async () => {
// //         setIsLoading(true);
// //         try {
// //             const response = await getTask();
// //             if (response.success) {
// //                 setTasks(response.responseObject);
// //             } else {
// //                 console.error("Failed to fetch tasks");
// //             }
// //         } catch (error) {
// //             console.error("Error fetching tasks:", error);
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     };

// //     useEffect(() => {
// //         fetchTasks();
// //     }, []);

// //     return (
// //         <Card variant="surface">
// //             <Flex justify="between" mb="4">
// //                 <Text size="4" weight="bold">Task Management</Text>
// //                 <DialogAddTask getTaskData={fetchTasks} />
// //             </Flex>
// //             {isLoading ? (
// //                 <Flex justify="center" align="center" style={{ height: "200px" }}>
// //                     <Spinner size="3" />
// //                 </Flex>
// //             ) : (
// //                 <Table.Root variant="surface">
// //                     <Table.Header>
// //                         <Table.Row>
// //                             <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
// //                             <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
// //                             <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
// //                             <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
// //                             <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
// //                             <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
// //                         </Table.Row>
// //                     </Table.Header>
// //                     <Table.Body>
// //                         {tasks.map((task) => (
// //                             <Table.Row key={task.task_id}>
// //                                 <Table.Cell>{task.task_name}</Table.Cell>
// //                                 <Table.Cell>{task.budget || "-"}</Table.Cell>
// //                                 <Table.Cell>{task.start_date || "-"}</Table.Cell>
// //                                 <Table.Cell>{task.end_date || "-"}</Table.Cell>
// //                                 <Table.Cell>{task.status ? "Active" : "Inactive"}</Table.Cell>
// //                                 <Table.Cell>
// //                                     <Flex gap="2">
// //                                         <DialogEditTask task={task} getTaskData={fetchTasks} />
// //                                         <AlertDialogDeleteTask 
// //                                             getTaskData={fetchTasks}
// //                                             task_id={task.task_id}
// //                                             task_name={task.task_name}
// //                                         />
// //                                     </Flex>
// //                                 </Table.Cell>
// //                             </Table.Row>
// //                         ))}
// //                     </Table.Body>
// //                 </Table.Root>
// //             )}
// //         </Card>
// //     );
// // }

import { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
import { getTask } from "@/services/task.service";
import { TypeTask } from "@/types/response/response.task";
import DialogAddTask from "./components/DialogAddTask";
import DialogEditTask from "./components/DialogEditTask";
import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";

export default function TaskPage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await getTask();
            if (response.success) {
                setTasks(response.responseObject);
            } else {
                console.error("Failed to fetch tasks");
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDaysBetween = (start: Date, end: Date) => {
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };
    
    const getDayOffset = (start: Date, referenceDate: Date) => {
        return Math.floor((start.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    };
    
    // กำหนดวันแรกของเดือนเพื่อเป็นจุดเริ่มต้นของ Timeline
    const timelineStartDate = new Date(new Date().getFullYear(), 0, 1);
    const totalDaysInYear = getDaysBetween(timelineStartDate, new Date(new Date().getFullYear(), 11, 31));
    
    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <Card variant="surface">
            <Flex justify="between" mb="4">
                <Text size="4" weight="bold">Task Management</Text>
                <DialogAddTask getTaskData={fetchTasks} />
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" style={{ height: "200px" }}>
                    <Spinner size="3" />
                </Flex>
            ) : (
                <>
                    <Table.Root variant="surface">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {tasks.map((task) => (
                                <Table.Row key={task.task_id}>
                                    <Table.Cell>{task.task_name}</Table.Cell>
                                    <Table.Cell>{task.budget || "-"}</Table.Cell>
                                    <Table.Cell>{task.start_date || "-"}</Table.Cell>
                                    <Table.Cell>{task.end_date || "-"}</Table.Cell>
                                    <Table.Cell>{task.status ? "Active" : "Inactive"}</Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2">
                                            <DialogEditTask task={task} getTaskData={fetchTasks} />
                                            <AlertDialogDeleteTask 
                                                getTaskData={fetchTasks}
                                                task_id={task.task_id}
                                                task_name={task.task_name}
                                            />
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                        <Table.Body>
                            
                        </Table.Body>
                    </Table.Root>
                    
                    {/* Gantt Chart */}

                    <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md mt-6">
                        <Text size="4" weight="bold">Gantt Chart Timeline</Text>
                        <div className="flex bg-gray-200 p-2 rounded-t-lg">
                            <div className="w-32 flex-shrink-0"></div>
                            <div className="flex-1 grid grid-cols-12 gap-1">
                                {Array.from({ length: 12 }).map((_, index) => (
                                    <div key={index} className="text-center">
                                        {new Date(2025, index).toLocaleString("default", { month: "short" })}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-2 rounded-b-lg">
                            {tasks.map((task) => {
                                const startMonth = task.start_date ? new Date(task.start_date).getMonth() : 0;
                                const endMonth = task.end_date ? new Date(task.end_date).getMonth() : 0;
                                const span = endMonth - startMonth + 1;
                                return (
                                    <div key={task.task_id} className="flex items-center mb-2">
                                        <div className="w-32 flex-shrink-0 font-medium">{task.task_name}</div>
                                        <div className="flex-1 grid grid-cols-12 gap-1 relative">
                                            <div
                                                className={`col-start-${startMonth + 1} col-span-${span} h-8 rounded ${task.status ? "bg-green-500" : "bg-blue-500"}`}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}

// import { useEffect, useState } from "react";
// import { Card, Table, Text, Flex, Spinner, Button } from "@radix-ui/themes";
// import { getTask } from "@/services/task.service";
// import { TypeTask } from "@/types/response/response.task";
// import DialogAddTask from "./components/DialogAddTask";
// import DialogEditTask from "./components/DialogEditTask";
// import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";

// export default function TaskPage() {
//     const [tasks, setTasks] = useState<TypeTask[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//     const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    
//     const fetchTasks = async () => {
//         setIsLoading(true);
//         try {
//             const response = await getTask();
//             if (response.success) {
//                 setTasks(response.responseObject);
//             } else {
//                 console.error("Failed to fetch tasks");
//             }
//         } catch (error) {
//             console.error("Error fetching tasks:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchTasks();
//     }, []);

//     const handlePrevMonth = () => {
//         setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
//     };
    
//     const handleNextMonth = () => {
//         setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
//     };
    
//     return (
//         <Flex gap="4" wrap="wrap">
//             {/* Task Management Card */}
//             <Card variant="surface" style={{ flex: 1 }}>
//                 <Flex justify="between" mb="4">
//                     <Text size="4" weight="bold">Task Management</Text>
//                     <DialogAddTask getTaskData={fetchTasks} />
//                 </Flex>
//                 {isLoading ? (
//                     <Flex justify="center" align="center" style={{ height: "200px" }}>
//                         <Spinner size="3" />
//                     </Flex>
//                 ) : (
//                     <Table.Root variant="surface">
//                         <Table.Header>
//                             <Table.Row>
//                                 <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
//                             </Table.Row>
//                         </Table.Header>
//                         <Table.Body>
//                             {tasks.map((task) => (
//                                 <Table.Row key={task.task_id}>
//                                     <Table.Cell>{task.task_name}</Table.Cell>
//                                     <Table.Cell>{task.budget || "-"}</Table.Cell>
//                                     <Table.Cell>{task.start_date || "-"}</Table.Cell>
//                                     <Table.Cell>{task.end_date || "-"}</Table.Cell>
//                                     <Table.Cell>{task.status ? "Active" : "Inactive"}</Table.Cell>
//                                     <Table.Cell>
//                                         <Flex gap="2">
//                                             <DialogEditTask task={task} getTaskData={fetchTasks} />
//                                             <AlertDialogDeleteTask 
//                                                 getTaskData={fetchTasks}
//                                                 task_id={task.task_id}
//                                                 task_name={task.task_name}
//                                             />
//                                         </Flex>
//                                     </Table.Cell>
//                                 </Table.Row>
//                             ))}
//                         </Table.Body>
//                     </Table.Root>
//                 )}
//             </Card>
            
//             {/* Gantt Chart Card */}
//             <Card variant="surface" style={{ flex: 1 }}>
//                 <Flex justify="between" mb="4">
//                     <Button onClick={handlePrevMonth}>← Previous</Button>
//                     <Text size="4" weight="bold">{new Date(2025, currentMonth).toLocaleString("default", { month: "long" })}</Text>
//                     <Button onClick={handleNextMonth}>Next →</Button>
//                 </Flex>
//                 <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
//                     {tasks.map((task) => {
//                         const startMonth = task.start_date ? new Date(task.start_date).getMonth() : 0;
//                         const endMonth = task.end_date ? new Date(task.end_date).getMonth() : 0;
             
//                         if (startMonth > currentMonth || endMonth < currentMonth) return null;
                        
//                         return (
//                             <div key={task.task_id} className="flex items-center mb-2">
//                                 <Text className="w-32 flex-shrink-0">{task.task_name}</Text>
//                                 <div className="flex-1 bg-blue-500 h-8 rounded"></div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </Card>
//         </Flex>
//     );
// }

