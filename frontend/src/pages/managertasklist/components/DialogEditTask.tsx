import { Text, Dialog, Button, Flex, TextField, Strong, Select, Slider } from "@radix-ui/themes";
import { getSubtask, patchSubtask } from "@/services/subtask.service";
import { patchTask } from "@/services/task.service";
import { getTaskProgress, createProgress } from "@/services/progress.service";
import { useState, useEffect } from "react";

interface DialogEditTaskProps {
    getTaskData: () => void;
    task_id: string;
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
    updateSubtasksOnComplete?: boolean;
    updateTaskStatusFromSubtasks?: (taskId: string) => void; // เพิ่ม prop นี้
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({
    getTaskData,
    task_id,
    task_name,
    description = "",
    budget = 0,
    start_date = "",
    end_date = "",
    status,
    updateSubtasksOnComplete = true,
    updateTaskStatusFromSubtasks
}) => {
    const [taskName, setTaskName] = useState(task_name);
    const [taskDescription, setTaskDescription] = useState(description);
    const [taskBudget, setTaskBudget] = useState(budget);
    const [formattedBudget, setFormattedBudget] = useState(
        budget ? budget.toLocaleString('en-US') : "0"
    );
    const [taskStartDate, setTaskStartDate] = useState(start_date ? start_date.split('T')[0] : "");
    const [taskEndDate, setTaskEndDate] = useState(end_date ? end_date.split('T')[0] : "");
    const [taskStatus, setTaskStatus] = useState(status);
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

        console.log("Budget set to:", numericValue, "(type:", typeof numericValue, ")");
    };

    // ดึงข้อมูลความคืบหน้าของ Task เมื่อ Dialog เปิด
    const fetchTaskProgress = async () => {
        try {
            setIsLoading(true);
            const response = await getTaskProgress(task_id);

            if (response.success && response.responseObject.length > 0) {
                const latestProgress = response.responseObject[0].percent;
                setProgressPercent(latestProgress);
                setCurrentProgress(latestProgress);
                console.log("Task progress loaded:", latestProgress);
            }
        } catch (error) {
            console.error("Failed to fetch task progress:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // เรียกใช้ fetchTaskProgress เมื่อ dialog เปิด
    useEffect(() => {
        if (open) {
            fetchTaskProgress();
        }
    }, [open, task_id]);

    const handleEditTask = async () => {
        if (!taskName || !taskDescription || !taskStartDate || !taskEndDate) {
            setErrorMessage("Please fill out all required fields.");
            return;
        }

        try {
            // แน่ใจว่า budget เป็น number จริง ๆ ก่อนส่งไปยัง API
            const budgetNumber = Number(taskBudget);

            console.log("Updating task with payload:", {
                task_id,
                task_name: taskName,
                description: taskDescription,
                budget: budgetNumber,
                budget_type: typeof budgetNumber,
                start_date: taskStartDate,
                end_date: taskEndDate,
                status: taskStatus
            });

            const response = await patchTask({
                task_id,
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
                            task_id: task_id,
                            percent: progressPercent,
                            description: `Updated task progress to ${progressPercent}%`,
                        });
                        console.log("Updated task progress to:", progressPercent);
                    } catch (progressError) {
                        console.error("Failed to update progress:", progressError);
                    }
                }

                // ถ้า status เป็น completed และต้องการอัปเดต subtasks
                if (taskStatus === "completed" && updateSubtasksOnComplete) {
                    try {
                        // 1. ดึง subtasks ทั้งหมดของ task นี้
                        const subtasksResponse = await getSubtask(task_id);
                        if (subtasksResponse.success && subtasksResponse.responseObject) {
                            // กรองเฉพาะ subtask ของ task นี้
                            const taskSubtasks = subtasksResponse.responseObject.filter(
                                (s: any) => s.task_id === task_id
                            );

                            console.log(`Found ${taskSubtasks.length} subtasks to update to completed`);

                            // 2. อัปเดตแต่ละ subtask เป็น completed
                            for (const subtask of taskSubtasks) {
                                await patchSubtask({
                                    subtask_id: subtask.subtask_id,
                                    status: "completed"
                                });

                                // 3. อัปเดต progress ของ subtask เป็น 100%
                                await createProgress({
                                    subtask_id: subtask.subtask_id,
                                    percent: 100,
                                    description: "Auto-completed as task was completed",
                                });
                            }
                            console.log(`Updated ${taskSubtasks.length} subtasks to completed`);
                        }
                    } catch (error) {
                        console.error("Error updating subtasks:", error);
                    }
                }

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
            <Dialog.Trigger>
                <Button className="cursor-pointer" color="orange" variant="soft" size="1">
                    Edit
                </Button>
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Edit Task</Dialog.Title>
                <Flex direction="column" gap="3">
                    <label>
                        <Text size="2"><Strong>Task ID: </Strong>{task_id}</Text>
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

                    {/* เพิ่มส่วนสไลเดอร์สำหรับความคืบหน้า */}
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Progress: {progressPercent}%
                        </Text>
                        <Slider
                            value={[progressPercent]}
                            onValueChange={(values) => {
                                setProgressPercent(values[0]);
                                // อัปเดต status ตาม progress
                                if (values[0] === 100) {
                                    setTaskStatus("completed");
                                } else if (values[0] > 0) {
                                    setTaskStatus("in progress");
                                } else {
                                    setTaskStatus("pending");
                                }
                            }}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                        />
                    </label>

                    {errorMessage && (
                        <Text color="red" size="2">
                            {errorMessage}
                        </Text>
                    )}
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Button
                        className="cursor-pointer"
                        onClick={handleEditTask}
                        color="blue"
                    >
                        Update
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;