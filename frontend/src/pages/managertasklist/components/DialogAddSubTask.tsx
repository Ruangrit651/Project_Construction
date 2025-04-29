import React, { useState } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, Slider } from "@radix-ui/themes";
import { postSubtask } from "@/services/subtask.service";
import { createProgress } from "@/services/progress.service";

interface DialogAddSubTaskProps {
    getSubtaskData: () => void;
    taskId: string;
    taskName: string;
    updateTaskStatus?: (taskId: string) => void; // เพิ่ม function สำหรับอัปเดต task status
}

const DialogAddSubTask: React.FC<DialogAddSubTaskProps> = ({ 
    getSubtaskData, 
    taskId, 
    taskName,
    updateTaskStatus
}) => {
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    // เพิ่ม state สำหรับความคืบหน้า
    const [progressPercent, setProgressPercent] = useState(0);

    const formatNumber = (value: number) => {
        return value.toLocaleString('en-US');
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
        const rawValue = event.target.value.replace(/[^0-9]/g, '');
        // แปลงเป็นตัวเลข
        const numericValue = rawValue === '' ? 0 : parseInt(rawValue);
        // เก็บค่าแบบตัวเลขไว้ใน state
        setBudget(numericValue);
        // แสดงค่าแบบมี format
        setFormattedBudget(formatNumber(numericValue));
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

            if (response.success && response.responseObject?.subtask_id) {
                // บันทึกความคืบหน้าเริ่มต้น
                try {
                    await createProgress({
                        subtask_id: response.responseObject.subtask_id,
                        percent: progressPercent,
                        description: `Initial progress: ${progressPercent}%`,
                    });
                } catch (progressError) {
                    console.error("Failed to create initial progress:", progressError);
                }

                // เรียก function อัปเดต task status หลังจากเพิ่ม subtask สำเร็จ
                if (updateTaskStatus) {
                    updateTaskStatus(taskId);
                }

                // Reset form
                setSubtaskName("");
                setDescription("");
                setBudget(0);
                setFormattedBudget("0");
                setStartDate("");
                setEndDate("");
                setStatus("pending");
                setProgressPercent(0);

                // Close dialog and fetch updated subtask data
                getSubtaskData();
                setOpen(false);
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
                <Button size="1" variant="soft" color="green">+ Add</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "500px" }}>
                <Dialog.Title>Add Subtask for {taskName}</Dialog.Title>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Flex direction="column" gap="3">
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Subtask Name
                            </Text>
                            <TextField.Root
                                placeholder="Enter subtask name"
                                value={subtaskName}
                                onChange={(e) => setSubtaskName(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Description
                            </Text>
                            <TextField.Root
                                placeholder="Enter description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Budget
                            </Text>
                            <TextField.Root
                                placeholder="Enter budget"
                                value={formattedBudget}
                                onChange={handleBudgetChange}
                            />
                        </label>
                        <Flex gap="3">
                            <label style={{ flexGrow: 1 }}>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Start Date
                                </Text>
                                <TextField.Root
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </label>
                            <label style={{ flexGrow: 1 }}>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    End Date
                                </Text>
                                <TextField.Root
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </label>
                        </Flex>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Status
                            </Text>
                            <Select.Root
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    // อัปเดต progress ตาม status ที่เลือก
                                    if (value === "completed") {
                                        setProgressPercent(100);
                                    } else if (value === "in progress") {
                                        setProgressPercent(50);
                                    } else {
                                        setProgressPercent(0);
                                    }
                                }}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="in progress">In Progress</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                    <Select.Item value="canceled">Canceled</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>

                        {/* เพิ่มส่วนสไลเดอร์สำหรับความคืบหน้า */}
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Initial Progress: {progressPercent}%
                            </Text>
                            <Slider 
                                value={[progressPercent]}
                                onValueChange={(values) => {
                                    setProgressPercent(values[0]);
                                    // อัปเดต status ตาม progress
                                    if (values[0] === 100) {
                                        setStatus("completed");
                                    } else if (values[0] > 0) {
                                        setStatus("in progress");
                                    } else {
                                        setStatus("pending");
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
                            <Button variant="soft" color="gray">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button type="submit" onClick={handleAddSubtask}>
                            Add Subtask
                        </Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddSubTask;