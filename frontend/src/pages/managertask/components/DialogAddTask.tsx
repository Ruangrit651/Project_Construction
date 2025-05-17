import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, TextArea } from "@radix-ui/themes";
import { postTask } from "@/services/task.service";
import { getProject } from "@/services/project.service";
import { getManagerProjects } from "@/services/project.service"; // เพิ่ม import

interface DialogAddTaskProps {
    getTaskData: () => void;
    projectId?: string | null; // เพิ่ม prop สำหรับรับ projectId
}

interface Project {
    project_id: string;
    project_name: string;
}

const DialogAddTask: React.FC<DialogAddTaskProps> = ({ getTaskData, projectId }) => {
    // เพิ่ม state สำหรับ Project
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [open, setOpen] = useState(false); // เพิ่ม state เพื่อตรวจสอบการเปิด dialog

    // State เดิม
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [isLoading, setIsLoading] = useState(false);

    // เพิ่ม useEffect เพื่อดึงข้อมูล Projects เมื่อ Dialog เปิด หรือเมื่อ projectId เปลี่ยน
    useEffect(() => {
        if (open) {
            if (projectId) {
                // ถ้ามี projectId จาก props ให้ใช้เลย
                setSelectedProjectId(projectId);
            } else {
                // ถ้าไม่มีให้ดึงข้อมูล project จาก API
                fetchProjects();
            }
        }
    }, [open, projectId]);

    // เพิ่มฟังก์ชันดึงข้อมูล Project
    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            // Get manager ID from local storage or context
            const managerId = localStorage.getItem('user_id') || '';
            const response = await getManagerProjects(managerId);

            console.log("Projects response:", response);
            console.log("Current manager ID:", managerId);
            if (response.success) {
                // Map the response to match the Project interface
                // Ensure responseObject is an array before mapping
                const projectArray = Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject];

                const projectData = projectArray.map((project: any) => ({
                    project_id: project.project_id,
                    project_name: project.project_name
                }));
                setProjects(projectData);

                // ถ้ามี projectId จาก props ให้ใช้ค่านั้น
                if (projectId) {
                    setSelectedProjectId(projectId);
                }
                // ถ้าไม่มี และมี project ให้เลือกอัตโนมัติ
                else if (projectData.length > 0) {
                    setSelectedProjectId(projectData[0].project_id);
                }
            } else {
                console.error("Failed to fetch projects:", response.message);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleBudgetChange = (event: any) => {
        const value = event.target.value.replace(/,/g, "");
        const numericValue = value === "" ? 0 : Number(value);
        setBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue));
    };

    // รีเซ็ตฟอร์ม
    const resetForm = () => {
        setTaskName("");
        setDescription("");
        setBudget(0);
        setFormattedBudget("0");
        setStartDate("");
        setEndDate("");
        setStatus("pending");

        // ถ้าไม่มี projectId จาก props และมี projects ให้เลือกอันแรก
        if (!projectId && projects.length > 0) {
            setSelectedProjectId(projects[0].project_id);
        }
    };

    // จัดการการเปิด/ปิด Dialog
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        setOpen(newOpen);
    };

    const handleAddTask = async () => {
        // ใช้ selectedProjectId หรือ projectId จาก props
        const projectIdToUse = projectId || selectedProjectId;

        console.log("Attempting to add task to project:", projectIdToUse);

        // เพิ่มการตรวจสอบ projectIdToUse
        if (!taskName || !description || !startDate || !endDate || !projectIdToUse) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วนและเลือก Project");
            return;
        }

        try {
            const response = await postTask({
                project_id: projectIdToUse, // เพิ่ม project_id
                task_name: taskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status: status,
            });

            if (response.success) {
                // รีเซ็ตฟอร์ม
                resetForm();
                // สำคัญ: รอให้การดึงข้อมูลเสร็จสมบูรณ์ก่อนปิด dialog
                await getTaskData();
                setOpen(false); // ปิด Dialog หลังบันทึก
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to add task:", error);
            alert("An error occurred while adding the task.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
                <Button size="1" variant="soft" className="cursor-pointer">+ Add Task</Button>
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Add Task</Dialog.Title>
                <Flex direction="column" gap="3" style={{ marginTop: '15px' }}>
                    {/* Project Selection - แสดงเฉพาะเมื่อไม่มี projectId จาก props */}
                    {!projectId && (
                        <label>
                            <Text as="div" size="2" mb="3" weight="bold">Project <span className="text-red-500">*</span></Text>
                            <Select.Root value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoading}>
                                <Select.Trigger placeholder="เลือก Project" />
                                <Select.Content>
                                    {projects.map((project) => (
                                        <Select.Item key={project.project_id} value={project.project_id}>
                                            {project.project_name}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </label>
                    )}

                    <label>
                        <Text as="div" size="2" mb="3" weight="bold">Task Name <span className="text-red-500">*</span></Text>
                        <TextField.Root
                            value={taskName}
                            type="text"
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="Enter Task Name"
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Description <span className="text-red-500">*</span></Text>
                        <TextArea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter Task Description"
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
                        <TextField.Root
                            value={formattedBudget} // ใช้ formattedBudget เพื่อแสดงค่า
                            type="text"
                            onChange={handleBudgetChange}
                            placeholder="Enter Task Budget"
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date <span className="text-red-500">*</span></Text>
                        <TextField.Root
                            value={startDate}
                            type="date"
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date <span className="text-red-500">*</span></Text>
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
                                <Select.Item value="in progress">In Progress</Select.Item>
                                <Select.Item value="completed">Completed</Select.Item>
                                <Select.Item value="cancelled">Cancelled</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </label>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
                    </Dialog.Close>
                    <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleAddTask}>Save</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddTask;