import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, Strong } from "@radix-ui/themes";
import { patchSubtask, getSubtask } from "@/services/subtask.service";
import AlertDialogDeleteSubtask from "./alertDialogDeleteSubtask";
import { createProgress, getSubtaskProgress } from "@/services/progress.service";

interface DialogEditSubtaskProps {
    getSubtaskData: () => void;
    subtaskId: string;
    trigger: React.ReactNode;
    fetchSubTasks?: () => void;
}

const DialogEditSubtask: React.FC<DialogEditSubtaskProps> = ({
    getSubtaskData,
    subtaskId,
    trigger,
    fetchSubTasks
}) => {
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [progressPercent, setProgressPercent] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);

        // อัปเดต progress ตาม status ที่เลือก
        if (value === "completed") {
            setProgressPercent(100);
        } else if (value === "in progress" && progressPercent === 0) {
            setProgressPercent(50);
        } else if (value === "pending") {
            setProgressPercent(0);
        }
    };

    // ดึงข้อมูล Subtask เมื่อ Dialog เปิด
    useEffect(() => {
        if (open && subtaskId) {
            fetchSubtaskDetails();
        }
    }, [open, subtaskId]);

    // ดึงข้อมูล Subtask จาก API
    const fetchSubtaskDetails = async () => {
        if (!subtaskId) return;

        setLoading(true);
        try {
            const response = await getSubtask(subtaskId);

            if (response.success && response.responseObject) {
                let subtaskData;

                // ตรวจสอบว่า response เป็น array หรือ object เดี่ยว
                if (Array.isArray(response.responseObject)) {
                    subtaskData = response.responseObject.find(
                        (s: any) => s.subtask_id === subtaskId
                    );
                } else {
                    subtaskData = response.responseObject;
                }

                if (subtaskData) {
                    setSubtaskName(subtaskData.subtask_name || "");
                    setDescription(subtaskData.description || "");

                    // แปลง budget เป็นตัวเลข
                    const budgetValue = typeof subtaskData.budget === 'string'
                        ? parseFloat(subtaskData.budget)
                        : Number(subtaskData.budget || 0);

                    setBudget(budgetValue);
                    setFormattedBudget(formatNumber(budgetValue));

                    // จัดการวันที่
                    if (subtaskData.start_date) {
                        const startDateOnly = subtaskData.start_date.split('T')[0];
                        setStartDate(startDateOnly);
                    }

                    if (subtaskData.end_date) {
                        const endDateOnly = subtaskData.end_date.split('T')[0];
                        setEndDate(endDateOnly);
                    }

                    setStatus(subtaskData.status || "pending");

                    // ดึงข้อมูลความคืบหน้า
                    fetchSubtaskProgress();
                }
            } else {
                setErrorMessage("Failed to load subtask details");
            }
        } catch (error) {
            console.error("Error fetching subtask:", error);
            setErrorMessage("An error occurred while loading subtask details");
        } finally {
            setLoading(false);
        }
    };

    // ดึงข้อมูลความคืบหน้าของ Subtask
    const fetchSubtaskProgress = async () => {
        try {
            const response = await getSubtaskProgress(subtaskId);

            if (response.success && response.responseObject.length > 0) {
                const latestProgress = response.responseObject[0].percent;
                setProgressPercent(latestProgress);
                setCurrentProgress(latestProgress);
            }
        } catch (error) {
            console.error("Failed to fetch subtask progress:", error);
        }
    };

    const handleEditSubtask = async () => {
        if (!subtaskName || !description || !startDate || !endDate) {
            setErrorMessage("Please fill out all required fields.");
            return;
        }

        try {
            // แน่ใจว่า budget เป็น number จริง ๆ ก่อนส่งไปยัง API
            const budgetNumber = Number(budget);

            const response = await patchSubtask({
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget: budgetNumber,
                start_date: startDate,
                end_date: endDate,
                status,
            });

            if (response.success) {
                // บันทึกความคืบหน้าใหม่ถ้ามีการเปลี่ยนแปลง
                if (progressPercent !== currentProgress) {
                    try {
                        await createProgress({
                            subtask_id: subtaskId,
                            percent: progressPercent,
                            description: `Updated subtask progress to ${progressPercent}%`,
                        });
                    } catch (progressError) {
                        console.error("Failed to update progress:", progressError);
                    }
                }

                // สำคัญ: รอให้ข้อมูลถูกอัพเดตเสร็จสมบูรณ์ก่อนปิด dialog
                // เรียกทั้ง fetchSubTasks() (สำหรับ Timeline) และ getSubtaskData() (สำหรับ TaskList)
                if (fetchSubTasks) await fetchSubTasks();
                await getSubtaskData();
                setOpen(false);
            } else {
                setErrorMessage(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to update subtask:", error);
            setErrorMessage("An error occurred while updating the subtask.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Edit Subtask</Dialog.Title>
                {loading ? (
                    <Flex justify="center" py="4">
                        <Text>Loading subtask details...</Text>
                    </Flex>
                ) : (
                    <Flex direction="column" gap="3">
                        <label>
                            <Text size="2"><Strong>Subtask ID: </Strong>{subtaskId}</Text>
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Subtask Name
                            </Text>
                            <TextField.Root
                                value={subtaskName}
                                onChange={(e) => setSubtaskName(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Description
                            </Text>
                            <TextField.Root
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                End Date
                            </Text>
                            <TextField.Root
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Status
                            </Text>
                            <Select.Root
                                value={status}
                                onValueChange={handleStatusChange}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="in progress">In Progress</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                    <Select.Item value="cancelled">Cancelled</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>

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
                )}

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <AlertDialogDeleteSubtask
                            getSubtaskData={getSubtaskData}
                            subtask_id={subtaskId}
                            subtask_name={subtaskName}
                        />
                    </Dialog.Close>
                    <Button
                        className="cursor-pointer"
                        onClick={handleEditSubtask}
                        color="blue"
                        disabled={loading}
                    >
                        Update
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditSubtask;