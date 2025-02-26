import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { patchTask, getTask } from "@/services/task.service";
import { PayloadUpdateTask } from "@/types/requests/request.task";
import { TypeTaskAll } from "@/types/response/response.task";

interface DialogEditTaskProps {
    task: TypeTaskAll;
    getTaskData: () => void;
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({ task, getTaskData }) => {
    const [taskName, setTaskName] = useState(task.task_name);
    const [description, setDescription] = useState(task.description || "");
    const [budget, setBudget] = useState(task.budget || 0);
    const [startDate, setStartDate] = useState(task.start_date || "");
    const [endDate, setEndDate] = useState(task.end_date || "");
    const [status, setStatus] = useState(task.status);
    const [tasks, setTasks] = useState<TypeTaskAll[]>([]);

    useEffect(() => {
        const fetchTasks = async () => {
            const response = await getTask();
            setTasks(response.responseObject);
        };
        fetchTasks();
    }, []);

    const handleEditTask = async () => {
        if (!taskName || !description || !budget || !startDate || !endDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const updatedTask: PayloadUpdateTask = {
                task_id: task.task_id,
                task_name: taskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status,
            };

            const response = await patchTask(updatedTask);
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
                <Button variant="soft" className="cursor-pointer">Edit</Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Edit Task</Dialog.Title>
                <Flex direction="column">
                    <label>
                        <Text size="2" weight="bold">Task Name</Text>
                        <TextField.Root value={taskName} onChange={(e) => setTaskName(e.target.value)} />
                    </label>
                    <label>
                        <Text size="2" weight="bold">Description</Text>
                        <TextField.Root value={description} onChange={(e) => setDescription(e.target.value)} />
                    </label>
                    <label>
                        <Text size="2" weight="bold">Budget</Text>
                        <TextField.Root 
                            value={budget.toString()}  
                            type="number" 
                            onChange={(e) => setBudget(Number(e.target.value) || 0)} 
                        />
                    </label>
                    <label>
                        <Text size="2" weight="bold">Start Date</Text>
                        <TextField.Root type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </label>
                    <label>
                        <Text size="2" weight="bold">End Date</Text>
                        <TextField.Root type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
                        <Button variant="soft" color="gray">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button variant="soft" onClick={handleEditTask}>Save</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;
