// import { useState, useEffect } from "react";
// import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
// import { patchTask, getTask } from "@/services/task.service";
// import { patchSubtask } from "@/services/subtask.service";
// import AlertDialogDeleteTask from "./alertDialogDeleteTask";

// interface DialogEditTaskProps {
//     getTaskData: () => void;
//     fetchTasks?: () => void; // Add fetchTasks as an optional prop
//     taskId: string;
//     trigger: React.ReactNode;
//   }

// const DialogEditTask: React.FC<DialogEditTaskProps> = ({ getTaskData, taskId, trigger }) => {
//     const [taskName, setTaskName] = useState("");
//     const [description, setDescription] = useState("");
//     const [budget, setBudget] = useState(0);
//     const [formattedBudget, setFormattedBudget] = useState("0"); // สำหรับแสดง budget แบบ formatted
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [status, setStatus] = useState("pending");
//     const [loading, setLoading] = useState(false);

//     const formatNumber = (value: number) => {
//         return new Intl.NumberFormat("en-US").format(value);
//     };

//     const handleBudgetChange = (event: any) => {
//         const value = event.target.value.replace(/,/g, ""); // ลบ comma ออกจาก input
//         const numericValue = value === "" ? 0 : Number(value);
//         setBudget(numericValue); // อัปเดตค่า budget
//         setFormattedBudget(formatNumber(numericValue)); // อัปเดตค่า formattedBudget
//     };

//     const updateTaskStatus = async (taskId: string, status: string) => {
//         try {
//             await patchTask({ task_id: taskId, status });
//             if (status === "Completed") {
//                 const response = await getTask(taskId); // ดึงข้อมูล Task พร้อม Subtasks
//                 const task = response.responseObject;
//                 if (task && task.subtasks) {
//                     const updatePromises = task.subtasks.map((subtask: any) =>
//                         patchSubtask({ subtask_id: subtask.subtask_id, status })
//                     );
//                     await Promise.all(updatePromises); // อัปเดต Subtasks พร้อมกัน
//                 }
//             }
//             getTaskData(); // รีเฟรชข้อมูล Task
//         } catch (error) {
//             console.error("Failed to update task status:", error);
//         }
//     };

//     useEffect(() => {
//         console.log("taskId:", taskId); // Debugging: ตรวจสอบ taskId
//         const fetchTaskDetails = async () => {
//             if (taskId) {
//                 setLoading(true);
//                 try {
//                     const response = await getTask(taskId); // ดึงข้อมูล Task ตาม ID
//                     console.log("API Response:", response); // Debugging: ตรวจสอบ API Response
//                     if (response.responseObject && response.responseObject.length > 0) {
//                         // ค้นหา Task ที่ตรงกับ taskId
//                         const taskData = response.responseObject.find(
//                             (task: any) => task.task_id === taskId
//                         );

//                         if (taskData) {
//                             setTaskName(taskData.task_name || "");
//                             setDescription(taskData.description || "");
//                             setBudget(Number(taskData.budget || 0)); // แปลง budget เป็นตัวเลข
//                             setFormattedBudget(formatNumber(Number(taskData.budget || 0))); // แสดง budget แบบมี comma
//                             setStartDate(taskData.start_date || "");
//                             setEndDate(taskData.end_date || "");
//                             setStatus(taskData.status || "pending");
//                         } else {
//                             console.error("Task not found.");
//                             alert("Task not found.");
//                         }
//                     } else {
//                         console.error("No task data found.");
//                         alert("No task data found.");
//                     }
//                 } catch (error) {
//                     console.error("Failed to fetch task details:", error);
//                     alert("An error occurred while fetching task details.");
//                 } finally {
//                     setLoading(false);
//                 }
//             }
//         };

//         fetchTaskDetails();
//     }, [taskId]);

//     const handleEditTask = async () => {
//         if (!taskName || !description || !budget || !startDate || !endDate) {
//             alert("Please fill out all required fields.");
//             return;
//         }

//         try {
//             const response = await patchTask({
//                 task_id: taskId,
//                 task_name: taskName,
//                 description,
//                 budget: Number(budget),
//                 start_date: startDate,
//                 end_date: endDate,
//                 status,
//             });

//             if (response.success) {
//                 // เรียก updateTaskStatus ถ้าสถานะ Task เป็น Completed
//                 if (status === "Completed") {
//                     await updateTaskStatus(taskId, "Completed");
//                 }
//                 getTaskData();
//             } else {
//                 alert(`Error: ${response.message}`);
//             }
//         } catch (error) {
//             console.error("Failed to update task:", error);
//             alert("An error occurred while updating the task.");
//         }
//     };

//     return (
//         <Dialog.Root>
//             <Dialog.Trigger asChild>
//                 {trigger}
//             </Dialog.Trigger>
//             <Dialog.Content className="overflow-visible">
//                 <Dialog.Title>Edit Task</Dialog.Title>
//                 {loading ? (
//                     <Text>Loading task details...</Text>
//                 ) : (
//                     <Flex direction="column">
//                         <label>
//                             <Text as="div" size="2" mb="3" weight="bold">Task Name</Text>
//                             <TextField.Root
//                                 value={taskName}
//                                 type="text"
//                                 onChange={(e) => setTaskName(e.target.value)}
//                                 placeholder="Enter Task Name"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
//                             <TextField.Root
//                                 value={description}
//                                 type="text"
//                                 onChange={(e) => setDescription(e.target.value)}
//                                 placeholder="Enter Task Description"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
//                             <TextField.Root
//                                 value={formattedBudget} // ใช้ formattedBudget เพื่อแสดงค่า
//                                 type="text"
//                                 onChange={handleBudgetChange}
//                                 placeholder="Enter Budget"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date</Text>
//                             <TextField.Root
//                                 value={startDate}
//                                 type="date"
//                                 onChange={(e) => setStartDate(e.target.value)}
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date</Text>
//                             <TextField.Root
//                                 value={endDate}
//                                 type="date"
//                                 onChange={(e) => setEndDate(e.target.value)}
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Status</Text>
//                             <Select.Root value={status} onValueChange={setStatus}>
//                                 <Select.Trigger>{status}</Select.Trigger>
//                                 <Select.Content>
//                                     <Select.Item value="pending">Pending</Select.Item>
//                                     <Select.Item value="completed">Completed</Select.Item>
//                                 </Select.Content>
//                             </Select.Root>
//                         </label>
//                     </Flex>
//                 )}
//                 <Flex gap="3" mt="4" justify="end">
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
//                     </Dialog.Close>
//                     <Flex gap="3" mt="3">
//                         <Dialog.Close>
//                             <AlertDialogDeleteTask
//                                 getTaskData={getTaskData}
//                                 task_id={taskId}
//                                 task_name={taskName}
//                             />
//                         </Dialog.Close>
//                     </Flex>
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleEditTask}>Update</Button>
//                     </Dialog.Close>
//                 </Flex>
//             </Dialog.Content>
//         </Dialog.Root>
//     );
// };

// export default DialogEditTask;

import { Text, Dialog, Button, Flex, TextField, Strong, Select, Slider } from "@radix-ui/themes";
import { getSubtask, patchSubtask } from "@/services/subtask.service";
import { patchTask, getTask } from "@/services/task.service";
import { getTaskProgress, createProgress } from "@/services/progress.service";
import { useState, useEffect } from "react";
import AlertDialogDeleteTask from "./alertDialogDeleteTask";

interface DialogEditTaskProps {
    getTaskData: () => void;
    fetchTasks?: () => void;
    taskId: string;
    trigger: React.ReactNode;
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({
    getTaskData,
    fetchTasks,
    taskId,
    trigger
}) => {
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskBudget, setTaskBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0");
    const [taskStartDate, setTaskStartDate] = useState("");
    const [taskEndDate, setTaskEndDate] = useState("");
    const [taskStatus, setTaskStatus] = useState("pending");
    const [progressPercent, setProgressPercent] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const formatNumber = (value: number) => {
        return value.toLocaleString('en-US');
    };

    const handleStatusChange = (value: string) => {
        setTaskStatus(value);

        // อัปเดต progress ตาม status ที่เลือก
        if (value === "completed") {
            setProgressPercent(100);
        } else if (value === "in progress" && progressPercent === 0) {
            setProgressPercent(50);
        } else if (value === "pending") {
            setProgressPercent(0);
        }
    };

    const handleProgressChange = (values: number[]) => {
        const newProgress = values[0];
        setProgressPercent(newProgress);

        // อัปเดต status ตาม progress
        if (newProgress === 100) {
            setTaskStatus("completed");
        } else if (newProgress > 0) {
            setTaskStatus("in progress");
        } else {
            setTaskStatus("pending");
        }
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // ลบเครื่องหมาย comma และอักขระที่ไม่ใช่ตัวเลขออก
        const rawValue = event.target.value.replace(/[^0-9]/g, '');

        // แปลงเป็น number
        const numericValue = rawValue === '' ? 0 : parseInt(rawValue);

        // เก็บ value เป็น number ลงใน state
        setTaskBudget(numericValue);

        // Format สำหรับการแสดงผล
        setFormattedBudget(formatNumber(numericValue));
    };

    // ดึงข้อมูล Task เมื่อ Dialog เปิด
    useEffect(() => {
        if (open && taskId) {
            fetchTaskDetails();
        }
    }, [open, taskId]);

    // ดึงข้อมูล Task จาก API
    const fetchTaskDetails = async () => {
        try {
            setIsLoading(true);
            const response = await getTask(taskId);

            if (response.success && response.responseObject) {
                let taskData;

                // ตรวจสอบว่า response เป็น array หรือ object เดี่ยว
                if (Array.isArray(response.responseObject)) {
                    taskData = response.responseObject.find((t: any) => t.task_id === taskId);
                } else {
                    taskData = response.responseObject;
                }

                if (taskData) {
                    setTaskName(taskData.task_name || "");
                    setTaskDescription(taskData.description || "");

                    // แปลง budget เป็นตัวเลข
                    const budgetValue = typeof taskData.budget === 'string'
                        ? parseFloat(taskData.budget)
                        : Number(taskData.budget || 0);

                    setTaskBudget(budgetValue);
                    setFormattedBudget(formatNumber(budgetValue));

                    // จัดการวันที่
                    if (taskData.start_date) {
                        const startDateOnly = taskData.start_date.split('T')[0];
                        setTaskStartDate(startDateOnly);
                    }

                    if (taskData.end_date) {
                        const endDateOnly = taskData.end_date.split('T')[0];
                        setTaskEndDate(endDateOnly);
                    }

                    setTaskStatus(taskData.status || "pending");

                    // ดึงข้อมูลความคืบหน้า
                    fetchTaskProgress();
                }
            } else {
                setErrorMessage("Failed to load task details");
            }
        } catch (error) {
            console.error("Error fetching task:", error);
            setErrorMessage("An error occurred while loading task details");
        } finally {
            setIsLoading(false);
        }
    };

    // ดึงข้อมูลความคืบหน้าของ Task
    const fetchTaskProgress = async () => {
        try {
            const response = await getTaskProgress(taskId);

            if (response.success && response.responseObject.length > 0) {
                const latestProgress = response.responseObject[0].percent;
                setProgressPercent(latestProgress);
                setCurrentProgress(latestProgress);
            }
        } catch (error) {
            console.error("Failed to fetch task progress:", error);
        }
    };

    const handleEditTask = async () => {
        if (!taskName || !taskDescription || !taskStartDate || !taskEndDate) {
            setErrorMessage("Please fill out all required fields.");
            return;
        }

        try {
            // แน่ใจว่า budget เป็น number จริง ๆ ก่อนส่งไปยัง API
            const budgetNumber = Number(taskBudget);

            const response = await patchTask({
                task_id: taskId,
                task_name: taskName,
                description: taskDescription,
                budget: budgetNumber,
                start_date: taskStartDate,
                end_date: taskEndDate,
                status: taskStatus,
            });

            if (response.success) {
                // บันทึกความคืบหน้าใหม่ถ้ามีการเปลี่ยนแปลง
                if (progressPercent !== currentProgress) {
                    try {
                        await createProgress({
                            task_id: taskId,
                            percent: progressPercent,
                            description: `Updated task progress to ${progressPercent}%`,
                        });
                    } catch (progressError) {
                        console.error("Failed to update progress:", progressError);
                    }
                }

                // ถ้า status เป็น completed ให้อัปเดต subtasks ทั้งหมดเป็น completed ด้วย
                if (taskStatus === "completed") {
                    try {
                        // ดึง subtasks ทั้งหมดของ task นี้
                        const subtasksResponse = await getSubtask(taskId);
                        if (subtasksResponse.success && subtasksResponse.responseObject) {
                            // กรองเฉพาะ subtask ของ task นี้
                            const taskSubtasks = subtasksResponse.responseObject.filter(
                                (s: any) => s.task_id === taskId
                            );

                            // อัปเดตแต่ละ subtask เป็น completed
                            for (const subtask of taskSubtasks) {
                                await patchSubtask({
                                    subtask_id: subtask.subtask_id,
                                    status: "completed"
                                });

                                // อัปเดต progress ของ subtask เป็น 100%
                                await createProgress({
                                    subtask_id: subtask.subtask_id,
                                    percent: 100,
                                    description: "Auto-completed as task was completed",
                                });
                            }
                        }
                    } catch (error) {
                        console.error("Error updating subtasks:", error);
                    }
                }

                // เรียกฟังก์ชันเพื่ออัปเดตข้อมูลใหม่
                if (fetchTasks) fetchTasks();
                getTaskData();
                setOpen(false);
            } else {
                setErrorMessage(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to update task:", error);
            setErrorMessage("An error occurred while updating the task.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Edit Task</Dialog.Title>
                {isLoading ? (
                    <Flex justify="center" py="4">
                        <Text>Loading task details...</Text>
                    </Flex>
                ) : (
                    <Flex direction="column" gap="3">
                        <label>
                            <Text size="2"><Strong>Task ID: </Strong>{taskId}</Text>
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Task Name
                            </Text>
                            <TextField.Root
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Description
                            </Text>
                            <TextField.Root
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Budget
                            </Text>
                            <TextField.Root
                                value={formattedBudget}
                                onChange={handleBudgetChange}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Start Date
                            </Text>
                            <TextField.Root
                                type="date"
                                value={taskStartDate}
                                onChange={(e) => setTaskStartDate(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                End Date
                            </Text>
                            <TextField.Root
                                type="date"
                                value={taskEndDate}
                                onChange={(e) => setTaskEndDate(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Status
                            </Text>
                            <Select.Root
                                value={taskStatus}
                                onValueChange={(value) => {
                                    setTaskStatus(value);
                                    // อัปเดต progress ตาม status ที่เลือก
                                    if (value === "completed") {
                                        setProgressPercent(100);
                                    } else if (value === "in progress" && progressPercent === 0) {
                                        setProgressPercent(50);
                                    } else if (value === "pending") {
                                        setProgressPercent(0);
                                    }
                                }}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="in progress">In Progress</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                    <Select.Item value="cancelled">Cancelled</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Progress (%)
                            </Text>
                            <Flex gap="2" align="center">
                                <TextField.Root
                                    type="number"
                                    value={progressPercent}
                                    onChange={(e) => {
                                        // ตรวจสอบค่าอยู่ในช่วง 0-100
                                        let value = parseInt(e.target.value);
                                        if (isNaN(value)) value = 0;
                                        if (value < 0) value = 0;
                                        if (value > 100) value = 100;

                                        setProgressPercent(value);

                                        // อัปเดต status ตาม progress
                                        if (value === 100) {
                                            setTaskStatus("completed");
                                        } else if (value > 0) {
                                            setTaskStatus("in progress");
                                        } else {
                                            setTaskStatus("pending");
                                        }
                                    }}
                                    placeholder="0-100"
                                    min={0}
                                    max={100}
                                />
                                <Text>%</Text>
                            </Flex>
                        </label>

                        {errorMessage && (
                            <Text color="red" size="2">
                                {errorMessage}
                            </Text>
                        )}
                    </Flex>
                )}

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    {/* Add Delete Task Button */}
                    <AlertDialogDeleteTask
                        getTaskData={getTaskData}
                        task_id={taskId}
                        task_name={taskName}
                    />

                    <Button
                        className="cursor-pointer"
                        onClick={handleEditTask}
                        color="blue"
                        disabled={isLoading}
                    >
                        Update
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;