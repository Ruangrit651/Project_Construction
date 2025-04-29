import { Text, Dialog, Button, Flex, TextField, Strong, Select } from "@radix-ui/themes";
import { patchTask } from "@/services/task.service";
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
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({
    getTaskData,
    task_id,
    task_name,
    description = "",
    budget = 0,
    start_date = "",
    end_date = "",
    status
}) => {
    const [taskName, setTaskName] = useState(task_name);
    const [taskDescription, setTaskDescription] = useState(description);
    const [taskBudget, setTaskBudget] = useState(budget);
    const [formattedBudget, setFormattedBudget] = useState(
        budget ? budget.toLocaleString('en-US') : "0"
    );
    const [taskStartDate, setTaskStartDate] = useState(start_date);
    const [taskEndDate, setTaskEndDate] = useState(end_date);
    const [taskStatus, setTaskStatus] = useState(status);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/,/g, "");
        const numericValue = value === "" ? 0 : Number(value);
        setTaskBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue));
    };

    const handleEditTask = async () => {
        if (!taskName || !taskDescription || !taskStartDate || !taskEndDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const response = await patchTask({
                task_id: task_id,
                task_name: taskName,
                description: taskDescription,
                budget: taskBudget,
                start_date: taskStartDate,
                end_date: taskEndDate,
                status: taskStatus,
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
                        <Select.Root value={taskStatus} onValueChange={setTaskStatus}>
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="pending">Pending</Select.Item>
                                <Select.Item value="in progress">In Progress</Select.Item>
                                <Select.Item value="completed">Completed</Select.Item>
                                <Select.Item value="cancelled">Cancelled</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </label>
                </Flex>
                
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" onClick={handleEditTask} color="blue">
                            Update
                        </Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;