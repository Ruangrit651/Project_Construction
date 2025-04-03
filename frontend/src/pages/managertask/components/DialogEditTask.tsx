import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { patchTask, getTask } from "@/services/task.service";
import AlertDialogDeleteTask from "./alertDialogDeleteTask";

interface DialogEditTaskProps {
    getTaskData: () => void;
    taskId: string;
    trigger: React.ReactNode;
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({ getTaskData, taskId, trigger }) => {
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0"); // สำหรับแสดง budget แบบ formatted
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(false);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleBudgetChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // ลบ comma ออกจาก input
        const numericValue = value === "" ? 0 : Number(value);
        setBudget(numericValue); // อัปเดตค่า budget
        setFormattedBudget(formatNumber(numericValue)); // อัปเดตค่า formattedBudget
    };

    useEffect(() => {
        console.log("taskId:", taskId); // Debugging: ตรวจสอบ taskId
        const fetchTaskDetails = async () => {
            if (taskId) {
                setLoading(true);
                try {
                    const response = await getTask(taskId); // ดึงข้อมูล Task ตาม ID
                    console.log("API Response:", response); // Debugging: ตรวจสอบ API Response
                    if (response.responseObject && response.responseObject.length > 0) {
                        // ค้นหา Task ที่ตรงกับ taskId
                        const taskData = response.responseObject.find(
                            (task: any) => task.task_id === taskId
                        );
    
                        if (taskData) {
                            setTaskName(taskData.task_name || "");
                            setDescription(taskData.description || "");
                            setBudget(Number(taskData.budget || 0)); // แปลง budget เป็นตัวเลข
                            setFormattedBudget(formatNumber(Number(taskData.budget || 0))); // แสดง budget แบบมี comma
                            setStartDate(taskData.start_date || "");
                            setEndDate(taskData.end_date || "");
                            setStatus(taskData.status || "pending");
                        } else {
                            console.error("Task not found.");
                            alert("Task not found.");
                        }
                    } else {
                        console.error("No task data found.");
                        alert("No task data found.");
                    }
                } catch (error) {
                    console.error("Failed to fetch task details:", error);
                    alert("An error occurred while fetching task details.");
                } finally {
                    setLoading(false);
                }
            }
        };
    
        fetchTaskDetails();
    }, [taskId]);

    const handleEditTask = async () => {
        if (!taskName || !description || !budget || !startDate || !endDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const response = await patchTask({
                task_id: taskId,
                task_name: taskName,
                description,
                budget: Number(budget),
                start_date: startDate,
                end_date: endDate,
                status,
            });

            if (response.success) {
                getTaskData();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to update task:", error);
            alert("An error occurred while updating the task.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Edit Task</Dialog.Title>
                {loading ? (
                    <Text>Loading task details...</Text>
                ) : (
                    <Flex direction="column">
                        <label>
                            <Text as="div" size="2" mb="3" weight="bold">Task Name</Text>
                            <TextField.Root
                                value={taskName}
                                type="text"
                                onChange={(e) => setTaskName(e.target.value)}
                                placeholder="Enter Task Name"
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
                            <TextField.Root
                                value={description}
                                type="text"
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter Task Description"
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
                            <TextField.Root
                                value={formattedBudget} // ใช้ formattedBudget เพื่อแสดงค่า
                                type="text"
                                onChange={handleBudgetChange}
                                placeholder="Enter Budget"
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date</Text>
                            <TextField.Root
                                value={startDate}
                                type="date"
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date</Text>
                            <TextField.Root
                                value={endDate}
                                type="date"
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Status</Text>
                            <Select.Root value={status} onValueChange={setStatus}>
                                <Select.Trigger>{status}</Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>
                    </Flex>
                )}
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
                    </Dialog.Close>
                    <Flex gap="3" mt="3">
                        <Dialog.Close>
                            <AlertDialogDeleteTask
                                getTaskData={getTaskData}
                                task_id={taskId}
                                task_name={taskName}
                            />
                        </Dialog.Close>
                    </Flex>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleEditTask}>Update</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;