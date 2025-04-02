import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { postTask, getTask } from "@/services/task.service";

interface DialogAddTaskProps {
    getTaskData: () => void;
}

const DialogAddTask: React.FC<DialogAddTaskProps> = ({ getTaskData }) => {
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0"); // สำหรับแสดง budget แบบ formatted
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [tasks, setTasks] = useState<{ task_id: string; task_name: string }[]>([]);

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
        const fetchTasks = async () => {
            const response = await getTask();
            setTasks(response.responseObject);
        };
        fetchTasks();
    }, []);

    const handleAddTask = async () => {
        if (!taskName || !description || !budget || !startDate || !endDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const response = await postTask({
                task_name: taskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status: status,
            });

            if (response.success) {
                // รีเซ็ตฟอร์ม
                setTaskName("");
                setDescription("");
                setBudget(0);
                setFormattedBudget("0");
                setStartDate("");
                setEndDate("");
                setStatus("pending");

                getTaskData();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to add task:", error);
            alert("An error occurred while adding the task.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant="soft" className="cursor-pointer">+ Add Task</Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Add Task</Dialog.Title>
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
                            placeholder="Enter Task Budget"
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
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleAddTask}>Save</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddTask;