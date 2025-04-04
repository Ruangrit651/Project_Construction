import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { patchSubtask, getSubtask } from "@/services/subtask.service";
import AlertDialogDeleteSubtask from "./alertDialogDeleteSubtask";

interface DialogEditSubtaskProps {
    getSubtaskData: () => void;
    subtaskId: string;
    trigger: React.ReactNode;
}

const DialogEditSubtask: React.FC<DialogEditSubtaskProps> = ({ getSubtaskData, subtaskId, trigger }) => {
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0"); // For displaying formatted budget
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(false);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleBudgetChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
        const numericValue = value === "" ? 0 : Number(value);
        setBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue)); // Update the formatted budget
    };

    useEffect(() => {
        console.log("subtaskId:", subtaskId); // Debugging: Check the subtaskId
        const fetchSubtaskDetails = async () => {
            if (subtaskId) {
                setLoading(true);
                try {
                    const response = await getSubtask(subtaskId); // Fetch subtask by ID
                    console.log("API Response:", response); // Debugging: Check the API response
                    if (response.responseObject && response.responseObject.length > 0) {
                        // Use the correct property name for subtask ID
                        const subtaskData = response.responseObject.find(
                            (subtask: any) => subtask.subtask_id === subtaskId
                        );
    
                        if (subtaskData) {
                            setSubtaskName(subtaskData.subtask_name);
                            setDescription(subtaskData.description);
                            setBudget(Number(subtaskData.budget)); // Convert budget to a number
                            setFormattedBudget(formatNumber(Number(subtaskData.budget))); // Set formatted budget
                            setStartDate(subtaskData.start_date);
                            setEndDate(subtaskData.end_date);
                            setStatus(subtaskData.status);
                        } else {
                            console.error("Subtask not found.");
                            alert("Subtask not found.");
                        }
                    } else {
                        console.error("No subtask data found.");
                        alert("No subtask data found.");
                    }
                } catch (error) {
                    console.error("Failed to fetch subtask details:", error);
                    alert("An error occurred while fetching subtask details.");
                } finally {
                    setLoading(false);
                }
            }
        };
    
        fetchSubtaskDetails();
    }, [subtaskId]);

    const handleEditSubtask = async () => {
        if (!subtaskName || !description || !budget || !startDate || !endDate) {
            alert("Please fill out all required fields.");
            return;
        }

        try {
            const response = await patchSubtask({
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget: Number(budget),
                start_date: startDate,
                end_date: endDate,
                status,
            });

            if (response.success) {
                getSubtaskData();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to update subtask:", error);
            alert("An error occurred while updating the subtask.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Edit Subtask</Dialog.Title>
                {loading ? (
                    <Text>Loading subtask details...</Text>
                ) : (
                    <Flex direction="column">
                        <label>
                            <Text as="div" size="2" mb="3" weight="bold">Subtask Name</Text>
                            <TextField.Root
                                value={subtaskName}
                                type="text"
                                onChange={(e) => setSubtaskName(e.target.value)}
                                placeholder="Enter Name"
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
                                value={formattedBudget} // Display formatted budget
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
                            <AlertDialogDeleteSubtask
                                getSubtaskData={getSubtaskData}
                                subtask_id={subtaskId}
                                subtask_name={subtaskName}
                            />
                        </Dialog.Close>
                    </Flex>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleEditSubtask}>Update</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditSubtask;