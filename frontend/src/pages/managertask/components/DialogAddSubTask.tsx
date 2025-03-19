import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { postSubtask } from "@/services/subtask.service";
import { getTask } from "@/services/task.service";

interface DialogAddSubTaskProps {
    getSubtaskData: () => void;
}

const DialogAddSubTask: React.FC<DialogAddSubTaskProps> = ({ getSubtaskData }) => {
    const [taskId, setTaskId] = useState<string>("");
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [tasks, setTasks] = useState<{ task_id: string; task_name: string }[]>([]);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await getTask();
                if (response.success) {
                    setTasks(response.responseObject);
                } else {
                    console.error("Failed to fetch tasks:", response.message);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };
        fetchTasks();
    }, []);

    const handleAddSubtask = async (e: React.MouseEvent) => {
        e.preventDefault();
        setErrorMessage("");

        // Validate inputs
        if (!taskId) {
            setErrorMessage("Please select a task.");
            return;
        }

        if (!subtaskName || !description || budget <= 0 || !startDate || !endDate) {
            setErrorMessage("Please fill out all required fields properly.");
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
                // Reset form
                setTaskId("");
                setSubtaskName("");
                setDescription("");
                setBudget(0);
                setStartDate("");
                setEndDate("");
                setStatus("pending");
                
                // Fetch updated subtask data
                getSubtaskData();
            } else {
                setErrorMessage(response.message || "Failed to add subtask");
            }
        } catch (error) {
            console.error("Failed to add subtask:", error);
            setErrorMessage("An error occurred while adding the subtask.");
        }
    };

    // Find selected task name
    const selectedTaskName = taskId 
        ? tasks.find(task => task.task_id === taskId)?.task_name || "Select Task" 
        : "Select Task";

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant="soft" className="cursor-pointer">+ Add Subtask</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Add Subtask</Dialog.Title>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Flex direction="column" gap="2">
                        {errorMessage && (
                            <Text color="red" size="2">{errorMessage}</Text>
                        )}
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Task *</Text>
                            <Select.Root value={taskId} onValueChange={setTaskId}>
                                <Select.Trigger placeholder="Select Task" />
                                <Select.Content position="popper">
                                    {tasks.length > 0 ? (
                                        tasks.map(task => (
                                            <Select.Item key={task.task_id} value={task.task_id}>
                                                {task.task_name}
                                            </Select.Item>
                                        ))
                                    ) : (
                                        <Select.Item value="no-tasks" disabled>
                                            No tasks available
                                        </Select.Item>
                                    )}
                                </Select.Content>
                            </Select.Root>
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Subtask Name *</Text>
                            <TextField.Root 
                                value={subtaskName} 
                                onChange={(e) => setSubtaskName(e.target.value)} 
                                placeholder="Enter Subtask Name" 
                            />
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Description *</Text>
                            <TextField.Root 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Enter Subtask Description" 
                            />
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Budget *</Text>
                            <TextField.Root 
                                value={budget} 
                                type="number"
                                onChange={(e) => setBudget(Number(e.target.value))} 
                                placeholder="Enter Subtask Budget" 
                            />
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Start Date *</Text>
                            <TextField.Root 
                                value={startDate} 
                                type="date"
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">End Date *</Text>
                            <TextField.Root 
                                value={endDate} 
                                type="date"
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                        </label>
                        
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Status</Text>
                            <Select.Root value={status} onValueChange={setStatus}>
                                <Select.Trigger />
                                <Select.Content position="popper">
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="in_progress">In Progress</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>
                    </Flex>
                    
                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button 
                            type="submit" 
                            onClick={handleAddSubtask}
                        >
                            Save
                        </Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddSubTask;