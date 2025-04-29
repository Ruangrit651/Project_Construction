import React, { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, Slider } from "@radix-ui/themes";
import { getSubtask, patchSubtask } from "@/services/subtask.service";
import { getSubtaskProgress, createProgress } from "@/services/progress.service";

interface DialogEditSubtaskProps {
    getSubtaskData: () => void;
    subtaskId: string;
    taskId: string; // เพิ่ม taskId
    trigger: React.ReactNode;
    fetchSubTasks?: () => void;
    updateTaskStatus?: (taskId: string) => void; // เพิ่ม function สำหรับอัปเดต task status
}

const DialogEditSubtask: React.FC<DialogEditSubtaskProps> = ({
    getSubtaskData,
    subtaskId,
    taskId,
    trigger,
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
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [progressPercent, setProgressPercent] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(0);

    const formatNumber = (value: number) => {
        return value.toLocaleString('en-US');
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // ลบเครื่องหมาย comma และอักขระที่ไม่ใช่ตัวเลขออก
        const rawValue = event.target.value.replace(/[^0-9]/g, '');

        // แปลงเป็น number
        const numericValue = rawValue === '' ? 0 : parseInt(rawValue);

        // เก็บ value เป็น number ลงใน state
        setBudget(numericValue);

        // Format สำหรับการแสดงผล
        setFormattedBudget(formatNumber(numericValue));

        console.log("Budget set to:", numericValue, "(type:", typeof numericValue, ")");
    };

    // แก้ไขฟังก์ชันนี้เพื่อดึงข้อมูล subtask ที่ถูกต้อง
    const fetchSubtaskData = async () => {
        try {
            setIsLoading(true);
            console.log("Fetching subtask data for ID:", subtaskId);

            // ใช้ getSubtask แทน getSubtaskById
            const response = await getSubtask(taskId);
            console.log("Fetched subtask data:", response);

            if (response.success && response.responseObject && response.responseObject.length > 0) {
                // ค้นหา subtask ที่ตรงกับ subtaskId ที่ต้องการ
                const subtask = response.responseObject.find(
                    (s: any) => s.subtask_id === subtaskId
                );

                if (subtask) {
                    console.log("Setting form data from:", subtask);

                    setSubtaskName(subtask.subtask_name || "");
                    setDescription(subtask.description || "");

                    // แน่ใจว่า budget เป็น number
                    const budgetValue = typeof subtask.budget === 'string'
                        ? parseFloat(subtask.budget)
                        : Number(subtask.budget || 0);

                    setBudget(budgetValue);
                    setFormattedBudget(formatNumber(budgetValue));
                    console.log("Budget received:", budgetValue, "(type:", typeof budgetValue, ")");

                    // จัดการวันที่
                    if (subtask.start_date) {
                        const startDateOnly = subtask.start_date.split('T')[0];
                        setStartDate(startDateOnly);
                    }

                    if (subtask.end_date) {
                        const endDateOnly = subtask.end_date.split('T')[0];
                        setEndDate(endDateOnly);
                    }

                    setStatus(subtask.status || "pending");

                    // ดึงข้อมูลความคืบหน้า
                    try {
                        const progressResponse = await getSubtaskProgress(subtaskId);
                        if (progressResponse.success && progressResponse.responseObject.length > 0) {
                            const latestProgress = progressResponse.responseObject[0].percent;
                            setProgressPercent(latestProgress);
                            setCurrentProgress(latestProgress);
                        }
                    } catch (progressError) {
                        console.error("Failed to fetch progress:", progressError);
                    }
                } else {
                    console.error("Subtask not found in response");
                    setErrorMessage("Subtask not found");
                }
            } else {
                console.error("Failed to get subtask data:", response.message);
                setErrorMessage("Failed to load subtask details");
            }
        } catch (error) {
            console.error("Error fetching subtask data:", error);
            setErrorMessage("Failed to load subtask details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // เรียกใช้ fetchSubtaskData เมื่อ dialog เปิด
    useEffect(() => {
        if (open && subtaskId) {
            fetchSubtaskData();
        }
    }, [open, subtaskId]);

    const handleEditSubtask = async () => {
        try {
            if (!subtaskName || !description || budget <= 0 || !startDate || !endDate) {
                setErrorMessage("Please fill out all required fields properly.");
                return;
            }

            // แน่ใจว่า budget เป็น number จริง ๆ ก่อนส่งไปยัง API
            const budgetNumber = Number(budget);

            // ตรวจสอบ payload ก่อนส่ง
            console.log("Updating subtask with payload:", {
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget: budgetNumber,
                budget_type: typeof budgetNumber,
                start_date: startDate,
                end_date: endDate,
                status
            });

            const response = await patchSubtask({
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget: budgetNumber, // ส่งเป็น number แน่นอน
                start_date: startDate,
                end_date: endDate,
                status
            });

            console.log("API response:", response);

            if (response.success) {
                // บันทึกความคืบหน้าใหม่ถ้ามีการเปลี่ยนแปลง
                if (progressPercent !== currentProgress) {
                    try {
                        await createProgress({
                            subtask_id: subtaskId,
                            percent: progressPercent,
                            description: `Updated progress to ${progressPercent}%`,
                        });
                        console.log("Updated progress to:", progressPercent);
                    } catch (progressError) {
                        console.error("Failed to update progress:", progressError);
                    }
                }

                // เรียก function อัปเดต task status หลังจากอัปเดต subtask สำเร็จ
                if (updateTaskStatus && taskId) {
                    updateTaskStatus(taskId);
                }

                console.log("Subtask updated successfully");
                getSubtaskData();
                setOpen(false);
            } else {
                console.error("Failed to update subtask:", response.message);
                setErrorMessage(response.message || "Failed to update subtask");
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            setErrorMessage("An error occurred while updating the subtask.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "500px" }}>
                <Dialog.Title>Edit Subtask</Dialog.Title>
                {isLoading ? (
                    <Text>Loading subtask details...</Text>
                ) : (
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
                                        } else if (value === "in progress" && progressPercent === 0) {
                                            setProgressPercent(50);
                                        } else if (value === "pending") {
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
                                    Progress (%)
                                </Text>
                                <Flex gap="2" align="center">
                                    <TextField.Root
                                        type="number"
                                        value={progressPercent}
                                        onChange={(e) => {
                                            // ตรวจสอบค่าอยู่ในช่วง 0-100
                                            let value = parseInt(e.target.value);
                                            if (isNaN(value)) value = 0;
                                            if (value < 0) value = 0;
                                            if (value > 100) value = 100;

                                            setProgressPercent(value);

                                            // อัปเดต status ตาม progress
                                            if (value === 100) {
                                                setStatus("completed");
                                            } else if (value > 0) {
                                                setStatus("in progress");
                                            } else {
                                                setStatus("pending");
                                            }
                                        }}
                                        placeholder="0-100"
                                        min={0}
                                        max={100}
                                    />
                                    <Text>%</Text>
                                </Flex>
                            </label>

                            {errorMessage && (
                                <Text color="red" size="2">
                                    {errorMessage}
                                </Text>
                            )}
                        </Flex>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button className="cursor-pointer" variant="soft" color="gray">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button className="cursor-pointer" type="submit" onClick={handleEditSubtask}>
                                Update Subtask
                            </Button>
                        </Flex>
                    </form>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditSubtask;