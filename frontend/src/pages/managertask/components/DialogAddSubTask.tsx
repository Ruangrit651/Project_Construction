import { useState } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { postSubtask } from "@/services/subtask.service";

interface DialogAddSubTaskProps {
    getSubtaskData: () => void;
    taskId: string;
    taskName: string;
}

const DialogAddSubTask: React.FC<DialogAddSubTaskProps> = ({ getSubtaskData, taskId, taskName }) => {
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0"); // For displaying formatted budget
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [errorMessage, setErrorMessage] = useState("");
    const [open, setOpen] = useState(false);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleBudgetChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
        const numericValue = value === "" ? 0 : Number(value);
        setBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue)); // Update the formatted budget
    };

    const handleAddSubtask = async (e: React.MouseEvent) => {
        e.preventDefault();
        setErrorMessage("");

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
                setSubtaskName("");
                setDescription("");
                setBudget(0);
                setFormattedBudget("0");
                setStartDate("");
                setEndDate("");
                setStatus("pending");

                // Close dialog and fetch updated subtask data
                getSubtaskData();
                setOpen(false); // Close dialog after successful save
            } else {
                setErrorMessage(response.message || "Failed to add subtask");
            }
        } catch (error) {
            console.error("Failed to add subtask:", error);
            setErrorMessage("An error occurred while adding the subtask.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button size="1" variant="ghost" className="cursor-pointer">
                    <Text size="1">+ Add</Text>
                </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}  className="overflow-visible">
                <Dialog.Title>Add Subtask for: {taskName}</Dialog.Title>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Flex direction="column" gap="2">
                        {errorMessage && (
                            <Text color="red" size="2">{errorMessage}</Text>
                        )}

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
                                value={formattedBudget} // Display formatted budget
                                type="text"
                                onChange={handleBudgetChange}
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
                        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={handleAddSubtask}>
                            Save
                        </Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddSubTask;