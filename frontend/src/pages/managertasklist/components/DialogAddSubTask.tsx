import React, { useState } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, Slider } from "@radix-ui/themes";
import { postSubtask } from "@/services/subtask.service";
import { createProgress } from "@/services/progress.service";
import { TypeSubTaskAll } from "@/types/response/response.subtask";

interface DialogAddSubTaskProps {
    getSubtaskData: () => void;
    taskId: string;
    taskName: string;
    updateTaskStatus?: (taskId: string) => void; // เพิ่ม function สำหรับอัปเดต task status
    // เพิ่ม prop สำหรับการเพิ่ม subtask ใหม่เข้าไปใน state โดยตรง
    addSubtaskToState?: (taskId: string, newSubtask: TypeSubTaskAll) => void;
}

const DialogAddSubTask: React.FC<DialogAddSubTaskProps> = ({
    getSubtaskData,
    taskId,
    taskName,
    updateTaskStatus,
    addSubtaskToState
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

                    // สร้าง subtask object ที่จะเพิ่มลงใน state
                    const newSubtask = {
                        subtask_id: response.responseObject.subtask_id,
                        subtask_name: subtaskName,
                        description,
                        budget,
                        start_date: startDate,
                        end_date: endDate,
                        status,
                        task_id: taskId,
                        progress: progressPercent  // เพิ่ม progress เข้าไปด้วย
                    };

                    // ถ้ามี prop addSubtaskToState ให้ใช้เพื่อเพิ่ม subtask โดยตรงลงใน state
                    if (addSubtaskToState) {
                        addSubtaskToState(taskId, newSubtask as TypeSubTaskAll);
                    } else {
                        // ถ้าไม่มี ให้ใช้วิธีดึงข้อมูลใหม่แบบเดิม
                        await getSubtaskData();
                    }

                    // อัพเดท task status หลังจากมีการเพิ่ม subtask
                    if (updateTaskStatus) {
                        await updateTaskStatus(taskId);
                    }

                    // Reset form และปิด dialog
                    setSubtaskName("");
                    setDescription("");
                    setBudget(0);
                    setFormattedBudget("0");
                    setStartDate("");
                    setEndDate("");
                    setStatus("pending");
                    setProgressPercent(0);

                    setOpen(false);
                } catch (progressError) {
                    console.error("Failed to create initial progress:", progressError);
                }
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
            <Dialog.Trigger >
                <Button className="cursor-pointer" size="1" variant="soft" color="green">+ Subtask Add</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "500px" }}>
                <Dialog.Title>Add Subtask for {taskName}</Dialog.Title>
       
                    <Flex direction="column" gap="3">
                        {/* Subtask Name */}
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Subtask Name
                            </Text>
                            <TextField.Root
                                placeholder="Enter subtask name"
                                value={subtaskName}
                                id="add-subtask-name"
                                onChange={(e) => setSubtaskName(e.target.value)}
                            />
                        </label>

                        {/* Description */}
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

                        {/* Budget */}
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

                        {/* Start & End Date */}
                        <Flex gap="3">
                            <label style={{ flexGrow: 1 }}>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Start Date
                                </Text>
                                <input
                                    type="date"
                                    className="w-full px-2 py-1 border rounded"
                                    id="add-subtask-start-date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </label>
                            <label style={{ flexGrow: 1 }}>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    End Date
                                </Text>
                                <input
                                    type="date"
                                    className="w-full px-2 py-1 border rounded"
                                    id="add-subtask-end-date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </label>
                        </Flex>

                        {/* Status Select */}
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Status
                            </Text>
                            <Select.Root
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    if (value === "completed") setProgressPercent(100);
                                    else if (value === "in progress") setProgressPercent(50);
                                    else setProgressPercent(0);
                                }}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="in progress">In Progress</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                    <Select.Item value="suspended">Suspended</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>

                        {/* Initial Progress */}
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Initial Progress (%)
                            </Text>
                            <Flex gap="2" align="center">
                                <input
                                    type="number"
                                    className="w-full px-2 py-1 border rounded"
                                    value={progressPercent}
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value);
                                        if (isNaN(value)) value = 0;
                                        if (value < 0) value = 0;
                                        if (value > 100) value = 100;
                                        setProgressPercent(value);
                                        if (value === 100) setStatus("completed");
                                        else if (value > 0) setStatus("in progress");
                                        else setStatus("pending");
                                    }}
                                    placeholder="0-100"
                                    min={0}
                                    max={100}
                                />
                                <Text>%</Text>
                            </Flex>
                        </label>

                        {/* Error Message */}
                        {errorMessage && (
                            <Text color="red" size="2">
                                {errorMessage}
                            </Text>
                        )}
                    </Flex>

                    {/* Action Buttons */}
                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button className="cursor-pointer" variant="soft" color="gray">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button className="cursor-pointer" onClick={handleAddSubtask}>
                            Add Subtask
                        </Button>
                    </Flex>

            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddSubTask;