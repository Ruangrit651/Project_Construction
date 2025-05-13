// import { useState, useEffect } from "react";
// import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
// import { postTask, getTask } from "@/services/task.service";

// interface DialogAddTaskProps {
//     getTaskData: () => void;
// }

// const DialogAddTask: React.FC<DialogAddTaskProps> = ({ getTaskData }) => {
//     const [taskName, setTaskName] = useState("");
//     const [description, setDescription] = useState("");
//     const [budget, setBudget] = useState(0);
//     const [formattedBudget, setFormattedBudget] = useState("0"); // สำหรับแสดง budget แบบ formatted
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [status, setStatus] = useState("pending");
//     const [tasks, setTasks] = useState<{ task_id: string; task_name: string }[]>([]);

//     const formatNumber = (value: number) => {
//         return new Intl.NumberFormat("en-US").format(value);
//     };

//     const handleBudgetChange = (event: any) => {
//         const value = event.target.value.replace(/,/g, ""); // ลบ comma ออกจาก input
//         const numericValue = value === "" ? 0 : Number(value);
//         setBudget(numericValue); // อัปเดตค่า budget
//         setFormattedBudget(formatNumber(numericValue)); // อัปเดตค่า formattedBudget
//     };

//     useEffect(() => {
//         const fetchTasks = async () => {
//             const response = await getTask();
//             setTasks(response.responseObject);
//         };
//         fetchTasks();
//     }, []);

//     const handleAddTask = async () => {
//         if (!taskName || !description || !budget || !startDate || !endDate) {
//             alert("Please fill out all required fields.");
//             return;
//         }

//         try {
//             const response = await postTask({
//                 task_name: taskName,
//                 description,
//                 budget,
//                 start_date: startDate,
//                 end_date: endDate,
//                 status: status,
//             });

//             if (response.success) {
//                 // รีเซ็ตฟอร์ม
//                 setTaskName("");
//                 setDescription("");
//                 setBudget(0);
//                 setFormattedBudget("0");
//                 setStartDate("");
//                 setEndDate("");
//                 setStatus("pending");

//                 getTaskData();
//             } else {
//                 alert(`Error: ${response.message}`);
//             }
//         } catch (error) {
//             console.error("Failed to add task:", error);
//             alert("An error occurred while adding the task.");
//         }
//     };

//     return (
//         <Dialog.Root>
//             <Dialog.Trigger asChild>
//                 <Button size="1" variant="soft" className="cursor-pointer">+ Add Task</Button>
//             </Dialog.Trigger>
//             <Dialog.Content className="overflow-visible">
//                 <Dialog.Title>Add Task</Dialog.Title>
//                 <Flex direction="column">
//                     <label>
//                         <Text as="div" size="2" mb="3" weight="bold">Task Name</Text>
//                         <TextField.Root
//                             value={taskName}
//                             type="text"
//                             onChange={(e) => setTaskName(e.target.value)}
//                             placeholder="Enter Task Name"
//                         />
//                     </label>
//                     <label>
//                         <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
//                         <TextField.Root
//                             value={description}
//                             type="text"
//                             onChange={(e) => setDescription(e.target.value)}
//                             placeholder="Enter Task Description"
//                         />
//                     </label>
//                     <label>
//                         <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
//                         <TextField.Root
//                             value={formattedBudget} // ใช้ formattedBudget เพื่อแสดงค่า
//                             type="text"
//                             onChange={handleBudgetChange}
//                             placeholder="Enter Task Budget"
//                         />
//                     </label>
//                     <label>
//                         <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date</Text>
//                         <TextField.Root
//                             value={startDate}
//                             type="date"
//                             onChange={(e) => setStartDate(e.target.value)}
//                         />
//                     </label>
//                     <label>
//                         <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date</Text>
//                         <TextField.Root
//                             value={endDate}
//                             type="date"
//                             onChange={(e) => setEndDate(e.target.value)}
//                         />
//                     </label>
//                     <label>
//                         <Text as="div" size="2" mb="3" mt="3" weight="bold">Status</Text>
//                         <Select.Root value={status} onValueChange={setStatus}>
//                             <Select.Trigger>{status}</Select.Trigger>
//                             <Select.Content>
//                                 <Select.Item value="pending">Pending</Select.Item>
//                                 <Select.Item value="in progress">In Progress</Select.Item>
//                                 <Select.Item value="completed">Completed</Select.Item>
//                                 <Select.Item value="canceled">Canceled</Select.Item>
//                             </Select.Content>
//                         </Select.Root>
//                     </label>
//                 </Flex>
//                 <Flex gap="3" mt="4" justify="end">
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
//                     </Dialog.Close>
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleAddTask}>Save</Button>
//                     </Dialog.Close>
//                 </Flex>
//             </Dialog.Content>
//         </Dialog.Root>
//     );
// };

// export default DialogAddTask;


import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { postTask } from "@/services/task.service";
import { getProject } from "@/services/project.service";
import { getManagerProjects } from "@/services/project.service"; // เพิ่ม import

interface DialogAddTaskProps {
    getTaskData: () => void;
}

interface Project {
    project_id: string;
    project_name: string;
}

const DialogAddTask: React.FC<DialogAddTaskProps> = ({ getTaskData }) => {
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

    // เพิ่ม useEffect เพื่อดึงข้อมูล Projects เมื่อ Dialog เปิด
    useEffect(() => {
        if (open) {
            fetchProjects();
        }
    }, [open]);

    // เพิ่มฟังก์ชันดึงข้อมูล Project
    const fetchProjects = async () => {
        try {
            // Get manager ID from local storage or context
            const managerId = localStorage.getItem('user_id') || '';
            const response = await getManagerProjects(managerId);
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
                // ถ้ามี project ให้เลือกอัตโนมัติ
                if (projectData.length >
                    0) {
                    setSelectedProjectId(projectData[0].project_id);
                }
            } else {
                console.error("Failed to fetch projects:", response.message);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
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

    const handleAddTask = async () => {
        // เพิ่มการตรวจสอบ selectedProjectId
        if (!taskName || !description || !budget || !startDate || !endDate || !selectedProjectId) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วนและเลือก Project");
            return;
        }

        try {
            const response = await postTask({
                project_id: selectedProjectId, // เพิ่ม project_id
                task_name: taskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status: status,
            });

            if (response.success) {
                // รีเซ็ตฟอร์ม
                setTaskName("");
                setDescription("");
                setBudget(0);
                setFormattedBudget("0");
                setStartDate("");
                setEndDate("");
                setStatus("pending");
                setOpen(false); // ปิด Dialog หลังบันทึก
                getTaskData();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to add task:", error);
            alert("An error occurred while adding the task.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button size="1" variant="soft" className="cursor-pointer">+ Add Task</Button>
            </Dialog.Trigger>
            <Dialog.Content className="overflow-visible">
                <Dialog.Title>Add Task</Dialog.Title>
                <Flex direction="column">
                    <label>
                        <Text as="div" size="2" mb="3" weight="bold">Project <span className="text-red-500">*</span></Text>
                        <Select.Root value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <Select.Trigger placeholder="เลือก Project" />
                            <Select.Content>
                                {/* Default option for no project */}
                                <Select.Item value="none">No Project</Select.Item>
                                {projects.map((project) => (
                                    <Select.Item key={project.project_name} value={project.project_name}>
                                        {project.project_name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" weight="bold">Task Name</Text>
                        <TextField.Root
                            value={taskName}
                            type="text"
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="Enter Task Name"
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
                        <TextField.Root
                            value={description}
                            type="text"
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
                                <Select.Item value="in progress">In Progress</Select.Item>
                                <Select.Item value="completed">Completed</Select.Item>
                                <Select.Item value="canceled">Canceled</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </label>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleAddTask}>Save</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAddTask;