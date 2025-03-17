import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { postSubtask, getSubtask } from "@/services/subtask.service";
import { getTask } from "@/services/task.service";

interface DialogAddSubTaskProps {
    getSubtaskData: () => void;
}

const DialogAddSubTask: React.FC<DialogAddSubTaskProps> = ({ getSubtaskData }) => {
    const [taskId, setTaskId] = useState<string | null>(null);
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [tasks, setTasks] = useState<{ task_id: string; task_name: string }[]>([]);

    useEffect(() => {
        const fetchTasks = async () => {
            const response = await getTask();
            setTasks(response.responseObject);
        };
        fetchTasks();
    }, []);

    const handleAddSubtask = async () => {
        if (!subtaskName || !description || !budget || !startDate || !endDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const response = await postSubtask({
                task_id: taskId,
                subtask_name: subtaskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status: status,
            });

            if (response.success) {
                getSubtaskData();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to add subtask:", error);
            alert("An error occurred while adding the subtask.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant="soft" className="cursor-pointer">+ Add Subtask</Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Add Subtask</Dialog.Title>
                <Flex direction="column">
                    <label>
                        <Text as="div" size="2" mb="3" weight="bold">Task</Text>
                        <Select.Root value={taskId || ""} onValueChange={(value) => setTaskId(value)}>
                            <Select.Trigger>{taskId ? tasks.find(task => task.task_id === taskId)?.task_name : "Select Task"}</Select.Trigger>
                            <Select.Content>
                                {tasks.map(task => (
                                    <Select.Item key={task.task_id} value={task.task_id}>
                                        {task.task_name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Subtask Name</Text>
                        <TextField.Root 
                            value={subtaskName} 
                            type="text"
                            onChange={(e) => setSubtaskName(e.target.value)} 
                            placeholder="Enter Subtask Name" 
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
                        <TextField.Root 
                            value={description} 
                            type="text"
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Enter Subtask Description" 
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
                        <TextField.Root 
                            value={budget} 
                            type="text"
                            onChange={(e) => setBudget(Number(e.target.value))} 
                            placeholder="Enter Subtask Budget" 
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
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleAddSubtask}>Save</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddSubTask;