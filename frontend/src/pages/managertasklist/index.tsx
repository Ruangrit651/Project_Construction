import React, { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Button, Tooltip } from "@radix-ui/themes";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { getTask, patchTask } from "@/services/task.service";
import { TypeTaskAll } from "@/types/response/response.task";
import { getSubtask, patchSubtask } from "@/services/subtask.service";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { getTaskProgress, getSubtaskProgress, createProgress } from "@/services/progress.service";
import DialogAddTask from "./components/DialogAddTask";
import DialogEditTask from "./components/DialogEditTask";
import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import DialogEditSubtask from "./components/DialogEditSubtask";
import AlertDialogDeleteSubtask from "./components/alertDialogDeleteSubtask";

// สร้าง component ProgressBar อย่างง่าย
const ProgressBar = ({ percent }: { percent: number }) => {
    // กำหนดสีตามเปอร์เซ็นต์
    const getColor = () => {
        if (percent < 25) return "#ef4444"; // แดง
        if (percent < 50) return "#f97316"; // ส้ม 
        if (percent < 75) return "#facc15"; // เหลือง
        return "#22c55e"; // เขียว
    };

    return (
        <div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>{percent}%</div>
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    height: "8px",
                }}
            >
                <div
                    style={{
                        width: `${percent}%`,
                        backgroundColor: getColor(),
                        height: "100%",
                        borderRadius: "4px",
                        transition: "width 0.3s ease-in-out",
                    }}
                />
            </div>
        </div>
    );
};

export default function TasklistPage() {
    const [tasks, setTasks] = useState<TypeTaskAll[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [subtasks, setSubtasks] = useState<Record<string, TypeSubTaskAll[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // เพิ่ม state สำหรับเก็บความคืบหน้า
    const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
    const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>({});

    // คำนวณความคืบหน้า Task จาก Subtasks
    const calculateTaskProgress = (taskId: string) => {
        const taskSubtasks = subtasks[taskId] || [];

        // ถ้าไม่มี subtask ใช้ความคืบหน้าของ task ที่บันทึกไว้โดยตรง
        if (taskSubtasks.length === 0) {
            return taskProgress[taskId] || 0;
        }

        // คำนวณความคืบหน้าเฉลี่ยของ subtasks ทั้งหมด
        let totalProgress = 0;
        for (const subtask of taskSubtasks) {
            totalProgress += subtaskProgress[subtask.subtask_id] || 0;
        }

        const averageProgress = Math.round(totalProgress / taskSubtasks.length);

        // อัปเดตความคืบหน้าของ task ใน state
        if (averageProgress !== taskProgress[taskId]) {
            setTaskProgress(prev => ({
                ...prev,
                [taskId]: averageProgress
            }));
        }

        return averageProgress;
    };

    const updateTaskStatusFromSubtasks = async (taskId: string) => {
        const taskSubtasks = subtasks[taskId] || [];
        
    
        // ถ้าไม่มี subtask ให้ข้ามไป
        if (taskSubtasks.length === 0) return;
    
        // ค้นหา task ปัจจุบัน
        const currentTask = tasks.find(task => task.task_id === taskId);
        if (!currentTask) return;
    
        // คำนวณความคืบหน้าเฉลี่ยของ subtasks
        let totalProgress = 0;
        for (const subtask of taskSubtasks) {
            totalProgress += subtaskProgress[subtask.subtask_id] || 0;
        }
        const averageProgress = Math.round(totalProgress / taskSubtasks.length);
    
        // ตรวจสอบสถานะของ subtasks
        const allCompleted = taskSubtasks.every(subtask => subtask.status === "completed");
        const allCancelled = taskSubtasks.every(subtask => subtask.status === "cancelled");
        const anyInProgress = taskSubtasks.some(subtask => subtask.status === "in progress");
        const anyNotCompleted = taskSubtasks.some(subtask => subtask.status !== "completed");
        const anyLessThan100Percent = taskSubtasks.some(subtask => 
            (subtaskProgress[subtask.subtask_id] || 0) < 100
        );
    
        let newStatus = currentTask.status;
        let newProgress = averageProgress;
        let shouldUpdateProgress = false;
        let shouldUpdateStatus = false;
    
        // กรณี 1: ถ้าทุก subtask เป็น completed และ task ไม่ใช่ completed ให้อัพเดทเป็น completed
        if (allCompleted && currentTask.status !== "completed") {
            newStatus = "completed";
            newProgress = 100;
            shouldUpdateProgress = true;
            shouldUpdateStatus = true;
        }
        // กรณี 2: ถ้าทุก subtask เป็น cancelled และ task ไม่ใช่ cancelled ให้อัพเดทเป็น cancelled
        else if (allCancelled && currentTask.status !== "cancelled") {
            newStatus = "cancelled";
            shouldUpdateStatus = true;
        }
        // กรณี 3: ถ้ามีบาง subtask เป็น in progress และ task ไม่ใช่ in progress ให้อัพเดทเป็น in progress
        else if (anyInProgress && currentTask.status !== "in progress") {
            newStatus = "in progress"; 
            shouldUpdateStatus = true;
        }
        // กรณี 4: ถ้า task เป็น completed แล้ว แต่มีบาง subtask ไม่ใช่ completed หรือ progress น้อยกว่า 100%
        else if (currentTask.status === "completed" && (anyNotCompleted || anyLessThan100Percent)) {
            newStatus = "in progress";
            shouldUpdateStatus = true;
            shouldUpdateProgress = true;
        }
        
        // ตรวจสอบและอัพเดต Task status ถ้าจำเป็น
        if (shouldUpdateStatus) {
            try {
                console.log(`Updating task status from ${currentTask.status} to ${newStatus}`);
                const response = await patchTask({
                    task_id: taskId,
                    status: newStatus  // ส่งสถานะเป็น string
                });
    
                if (response.success) {
                    console.log(`Task status updated to ${newStatus}`);
                    
                    // อัพเดต tasks ในหน้าจอ
                    setTasks(prevTasks => prevTasks.map(task => 
                        task.task_id === taskId ? { ...task, status: newStatus } : task
                    ));
                }
            } catch (error) {
                console.error("Failed to update task status:", error);
            }
        }
    
        // อัพเดต progress ถ้าจำเป็น
        if (shouldUpdateProgress || averageProgress !== taskProgress[taskId]) {
            try {
                const progressToUpdate = shouldUpdateProgress ? newProgress : averageProgress;
                
                await createProgress({
                    task_id: taskId,
                    percent: progressToUpdate,
                    description: `Auto-updated from subtasks: ${progressToUpdate}%`,
                });
                
                // อัพเดต state
                setTaskProgress(prev => ({
                    ...prev,
                    [taskId]: progressToUpdate
                }));
                
                console.log(`Task progress updated to ${progressToUpdate}%`);
            } catch (progressError) {
                console.error("Failed to update task progress:", progressError);
            }
        }
    };

    const getTaskData = async () => {
        setIsLoading(true);
        try {
            const res = await getTask();
            console.log("Tasks fetched:", res);
            setTasks(res.responseObject);

            // ดึงความคืบหน้าของ tasks
            for (const task of res.responseObject) {
                await fetchTaskProgress(task.task_id);
            }

            // ถ้ามี task ที่ expand อยู่ ให้ดึง subtasks มาด้วย
            for (const taskId of expandedTasks) {
                await fetchSubtasks(taskId);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ดึงข้อมูล subtasks สำหรับ task ที่กำหนด
    const fetchSubtasks = async (taskId: string) => {
        try {
            console.log(`Fetching subtasks for task: ${taskId}`);
            const response = await getSubtask(taskId);

            if (response.success) {
                console.log(`Subtasks for task ${taskId}:`, response.responseObject);

                // ตรวจสอบให้แน่ใจว่า subtask ที่ได้รับเป็นของ task นี้จริง ๆ
                const filteredSubtasks = response.responseObject.filter(subtask =>
                    subtask.task_id === taskId
                );

                console.log(`Filtered subtasks for task ${taskId}:`, filteredSubtasks);

                // อัปเดต state โดยใช้ taskId เป็น key
                setSubtasks(prev => ({
                    ...prev,
                    [taskId]: filteredSubtasks
                }));

                // ดึงความคืบหน้าของ subtasks
                for (const subtask of filteredSubtasks) {
                    await fetchSubtaskProgress(subtask.subtask_id);
                }

                // หลังจากดึงข้อมูลความคืบหน้าของทุก subtask แล้ว คำนวณความคืบหน้าของ task
                calculateTaskProgress(taskId);
            } else {
                console.error(`Failed to fetch subtasks for task ${taskId}:`, response.message);
                setSubtasks(prev => ({
                    ...prev,
                    [taskId]: []
                }));
            }
        } catch (error) {
            console.error(`Error fetching subtasks for task ${taskId}:`, error);
            setSubtasks(prev => ({
                ...prev,
                [taskId]: []
            }));
        }
    };


    // ดึงความคืบหน้าของ Task
    const fetchTaskProgress = async (taskId: string) => {
        try {
            const response = await getTaskProgress(taskId);
            if (response.success && response.responseObject.length > 0) {
                // Progress จะถูกเรียงตาม date_recorded ล่าสุดมาก่อน
                const latestProgress = response.responseObject[0];
                setTaskProgress(prev => ({
                    ...prev,
                    [taskId]: latestProgress.percent
                }));
            }
        } catch (error) {
            console.error(`Error fetching progress for task ${taskId}:`, error);
        }
    };

    // ดึงความคืบหน้าของ Subtask
    const fetchSubtaskProgress = async (subtaskId: string) => {
        try {
            const response = await getSubtaskProgress(subtaskId);
            if (response.success && response.responseObject.length > 0) {
                // Progress จะถูกเรียงตาม date_recorded ล่าสุดมาก่อน
                const latestProgress = response.responseObject[0];
                setSubtaskProgress(prev => ({
                    ...prev,
                    [subtaskId]: latestProgress.percent
                }));
            }
        } catch (error) {
            console.error(`Error fetching progress for subtask ${subtaskId}:`, error);
        }
    };

    // toggle การแสดง/ซ่อน subtasks
    const toggleExpandTask = (taskId: string) => {
        setExpandedTasks(prev => {
            // ถ้า taskId มีอยู่แล้วในรายการ ให้ลบออก (ปิด) ไม่เช่นนั้นให้เพิ่มเข้าไป (เปิด)
            const isExpanded = prev.includes(taskId);

            if (isExpanded) {
                return prev.filter(id => id !== taskId); // ลบ taskId ออก (ปิด)
            } else {
                // ถ้ากำลังจะเปิดและยังไม่มีข้อมูล subtask ให้ดึงข้อมูล
                if (!subtasks[taskId] || subtasks[taskId]?.length === 0) {
                    fetchSubtasks(taskId);
                }
                return [...prev, taskId]; // เพิ่ม taskId (เปิด)
            }
        });
    };

    useEffect(() => {
        getTaskData();
    }, []);

    // Format date to display as dd/mm/yyyy
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Format budget to display with commas
    const formatBudget = (budget: number | undefined) => {
        if (!budget && budget !== 0) return "-";
        return Number(budget).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // รีเฟรชข้อมูลหลังจากอัปเดตความคืบหน้าของ Subtask และ Task
    const handleProgressUpdated = async (subtaskId: string, taskId: string) => {
        await fetchSubtaskProgress(subtaskId);
        await fetchTaskProgress(taskId);
        await updateTaskStatusFromSubtasks(taskId);
    };

    return (
        <Card variant="surface">
            <Flex className="w-full" direction="row" gap="2" justify="between">
                <Text as="div" size="4" weight="bold">
                    Tasks
                </Text>
                <DialogAddTask getTaskData={getTaskData} />
            </Flex>
            <div className="w-full mt-2">
                {isLoading ? (
                    <Flex align="center" justify="center" py="4">
                        <Text>Loading tasks...</Text>
                    </Flex>
                ) : (
                    <Table.Root variant="surface">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {tasks.map((task: TypeTaskAll) => (
                                <React.Fragment key={`fragment-${task.task_id}`}>
                                    <Table.Row key={`task-${task.task_id}`}>
                                        <Table.Cell>
                                            <Button
                                                variant="ghost"
                                                size="1"
                                                onClick={() => toggleExpandTask(task.task_id)}
                                            >
                                                {expandedTasks.includes(task.task_id) ?
                                                    <ChevronDownIcon /> :
                                                    <ChevronRightIcon />}
                                            </Button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text>{task.task_name}</Text>
                                        </Table.Cell>
                                        <Table.Cell>{formatBudget(task.budget)}</Table.Cell>
                                        <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
                                        <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
                                        <Table.Cell>{task.status}</Table.Cell>
                                        <Table.Cell>
                                            <Tooltip content={`${taskProgress[task.task_id] || 0}%`}>
                                                <div style={{ width: '100px' }}>
                                                    <ProgressBar
                                                        percent={expandedTasks.includes(task.task_id)
                                                            ? calculateTaskProgress(task.task_id)
                                                            : (taskProgress[task.task_id] || 0)
                                                        }
                                                    />
                                                </div>
                                            </Tooltip>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Flex gap="2">
                                                <DialogAddSubTask
                                                    getSubtaskData={() => fetchSubtasks(task.task_id)}
                                                    taskId={task.task_id}
                                                    taskName={task.task_name}
                                                    updateTaskStatus={updateTaskStatusFromSubtasks}
                                                />
                                                <DialogEditTask
                                                    getTaskData={getTaskData}
                                                    task_id={task.task_id}
                                                    task_name={task.task_name}
                                                    description={task.description}
                                                    budget={task.budget}
                                                    start_date={task.start_date}
                                                    end_date={task.end_date}
                                                    status={task.status}
                                                    updateSubtasksOnComplete={true}
                                                    updateTaskStatusFromSubtasks={updateTaskStatusFromSubtasks} // เพิ่มบรรทัดนี้
                                                />
                                                <AlertDialogDeleteTask
                                                    getTaskData={getTaskData}
                                                    task_id={task.task_id}
                                                    task_name={task.task_name}
                                                />
                                            </Flex>
                                        </Table.Cell>
                                    </Table.Row>

                                    {/* SubTasks Section */}
                                    {expandedTasks.includes(task.task_id) && subtasks[task.task_id]?.map((subtask) => (
                                        <Table.Row key={`subtask-${subtask.subtask_id}-${task.task_id}`} className="bg-gray-50">
                                            <Table.Cell>
                                                <div className="pl-6"></div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2" className="pl-4">{subtask.subtask_name}</Text>
                                            </Table.Cell>
                                            <Table.Cell>{formatBudget(subtask.budget)}</Table.Cell>
                                            <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
                                            <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{subtask.status}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Tooltip content={`${subtaskProgress[subtask.subtask_id] || 0}%`}>
                                                    <div style={{ width: '100px' }}>
                                                        <ProgressBar
                                                            percent={subtaskProgress[subtask.subtask_id] || 0}
                                                        />
                                                    </div>
                                                </Tooltip>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex gap="2">
                                                    <div style={{ width: "51px" }}></div>
                                                    <DialogEditSubtask
                                                        getSubtaskData={() => {
                                                            fetchSubtasks(task.task_id);
                                                            fetchTaskProgress(task.task_id);
                                                            updateTaskStatusFromSubtasks(task.task_id);
                                                        }}
                                                        subtaskId={subtask.subtask_id}
                                                        taskId={task.task_id}
                                                        trigger={<Button className="cursor-pointer" size="1" variant="soft" color="orange">Edit</Button>}
                                                        updateTaskStatus={updateTaskStatusFromSubtasks}
                                                    />
                                                    <AlertDialogDeleteSubtask
                                                        getSubtaskData={() => {
                                                            fetchSubtasks(task.task_id);
                                                            fetchTaskProgress(task.task_id);
                                                            updateTaskStatusFromSubtasks(task.task_id);
                                                        }}
                                                        subtask_id={subtask.subtask_id}
                                                        subtask_name={subtask.subtask_name}
                                                    />
                                                </Flex>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}

                                    {expandedTasks.includes(task.task_id) && (!subtasks[task.task_id] || subtasks[task.task_id]?.length === 0) && (
                                        <Table.Row key={`empty-${task.task_id}`}>
                                            <Table.Cell></Table.Cell>
                                            <Table.Cell colSpan={7}>
                                                <Text size="2" color="gray">No subtasks found</Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    )}
                                </React.Fragment>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </div>
        </Card>
    );
}