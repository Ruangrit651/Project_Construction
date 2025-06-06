import React, { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Button, Tooltip, Heading } from "@radix-ui/themes";
import { ChevronDownIcon, ChevronRightIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { getTask, getTaskProject, patchTask } from "@/services/task.service";
import { TypeTaskAll } from "@/types/response/response.task";
import { getSubtask } from "@/services/subtask.service";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { getTaskProgress, getSubtaskProgress, createProgress, getDetailedProjectProgress } from "@/services/progress.service";
import DialogAddTask from "./components/DialogAddTask";
import DialogEditTask from "./components/DialogEditTask";
import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import DialogEditSubtask from "./components/DialogEditSubtask";
import AlertDialogDeleteSubtask from "./components/alertDialogDeleteSubtask";
import ProjectProgress from "./components/ProjectProgress";
import { useNavigate, useLocation } from 'react-router-dom';


// ProgressBar component
const ProgressBar = ({ percent }: { percent: number }) => {
    // กำหนดสีตามเปอร์เซ็นต์
    const getColor = () => {
        if (percent < 25) return "#ef4444"; // แดง
        if (percent < 50) return "#f97316"; // ส้ม 
        if (percent < 75) return "#facc15"; // เหลือง
        return "#22c55e"; // เขียว
    };

    // แสดงค่าเปอร์เซ็นต์เป็นทศนิยม 2 ตำแหน่ง
    const formattedPercent = percent.toFixed(2);

    return (
        <div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>{formattedPercent}%</div>
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
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const project_id = searchParams.get('project_id');
    const project_name = searchParams.get('project_name');

    const [tasks, setTasks] = useState<TypeTaskAll[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [subtasks, setSubtasks] = useState<Record<string, TypeSubTaskAll[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
    const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>({});
    const [projectName, setProjectName] = useState<string>("");
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [projectProgressValue, setProjectProgressValue] = useState<number>(0);

    // Function to navigate to different views for the same project
    const navigateToProjectView = (view: string) => {
        if (!project_id || !project_name) return;

        switch (view) {
            case 'tasks':
                navigate(`/ManagerTask?project_id=${project_id}&project_name=${encodeURIComponent(project_name)}`);
                break;
            case 'resources':
                navigate(`/ManagerResource?project_id=${project_id}&project_name=${encodeURIComponent(project_name)}`);
                break;
            default:
                break;
        }
    };

    // ย้าย fetchAllData ออกมานอก useEffect
    const fetchAllData = async () => {
        setIsLoading(true);

        try {
            // กำหนด project ID ถ้ามี
            if (project_id) {
                setCurrentProjectId(project_id);
                if (project_name) {
                    setProjectName(project_name);
                }

                // ดึงข้อมูลแบบละเอียดทั้งหมดจาก API เดียว
                try {
                    const detailedResponse = await getDetailedProjectProgress(project_id);
                    if (detailedResponse?.success) {
                        const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = detailedResponse.responseObject || {};

                        // Add null checks before using the response data
                        if (newTaskProgress && newSubtaskProgress) {
                            // อัพเดต state โดยตรงจากข้อมูล backend
                            setTaskProgress(newTaskProgress);
                            setSubtaskProgress(newSubtaskProgress);
                            setProjectProgressValue(projectProgress || 0);

                            console.log("Progress data loaded from backend:", {
                                projectProgress,
                                taskProgressCount: Object.keys(newTaskProgress).length,
                                subtaskProgressCount: Object.keys(newSubtaskProgress).length
                            });
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error("Failed to fetch detailed progress:", errorMessage);
                }
            }
            // 1. ดึงข้อมูล tasks
            let taskData: TypeTaskAll[] = [];
            if (project_id) {
                const res = await getTaskProject(project_id);
                if (res.success && Array.isArray(res.responseObject)) {
                    // กรองข้อมูลซ้ำด้วย task_id
                    const uniqueTaskMap: Record<string, TypeTaskAll> = {};
                    res.responseObject.forEach(task => {
                        uniqueTaskMap[task.task_id] = task;
                    });

                    // แปลงเป็น array โดยไม่ต้องเรียงลำดับใหม่ - เก็บลำดับตามที่ได้รับมาจาก API
                    taskData = Object.values(uniqueTaskMap);

                    console.log(`Filtered from ${res.responseObject.length} to ${taskData.length} unique tasks`);

                    if (!project_name && taskData.length > 0 && 'project_name' in taskData[0]) {
                        setProjectName(taskData[0].project_name || "");
                    }
                }
            } else {
                const res = await getTask();
                if (res.success && Array.isArray(res.responseObject)) {
                    // กรองข้อมูลซ้ำด้วย task_id
                    const uniqueTaskMap: Record<string, TypeTaskAll> = {};
                    res.responseObject.forEach(task => {
                        uniqueTaskMap[task.task_id] = task;
                    });

                    // แปลงเป็น array โดยไม่ต้องเรียงลำดับใหม่ - เก็บลำดับตามที่ได้รับมาจาก API
                    taskData = Object.values(uniqueTaskMap);

                    console.log(`Filtered from ${res.responseObject.length} to ${taskData.length} unique tasks`);
                }
            }

            // อัพเดต tasks
            setTasks(taskData);

            // 2. ดึงข้อมูล subtasks ทั้งหมดพร้อมกันเลย
            const subtasksData: Record<string, TypeSubTaskAll[]> = {};
            const subtaskPromises = taskData.map(async (task) => {
                try {
                    const res = await getSubtask(task.task_id);
                    if (res.success && Array.isArray(res.responseObject)) {
                        // กรองเฉพาะ subtask ที่เป็นของ task นี้จริงๆ
                        const filteredSubtasks = res.responseObject.filter(subtask =>
                            subtask.task_id === task.task_id
                        );

                        // เรียงลำดับตาม created_at
                        const sortedSubtasks = [...filteredSubtasks].sort((a, b) => {
                            if (a.created_at && b.created_at) {
                                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                            }
                            return a.subtask_id.localeCompare(b.subtask_id);
                        });

                        // เก็บข้อมูล subtasks ที่เรียงลำดับแล้ว
                        subtasksData[task.task_id] = sortedSubtasks;
                    } else {
                        subtasksData[task.task_id] = [];
                    }
                } catch (err) {
                    console.error(`Error fetching subtasks for task ${task.task_id}:`, err);
                    subtasksData[task.task_id] = [];
                }
            });

            // รอให้ทุก promise เสร็จสิ้น
            await Promise.all(subtaskPromises);
            setSubtasks(subtasksData);

            // หมายเหตุ: ข้ามการคำนวณ progress ที่ฝั่ง frontend เพราะเราดึงผลลัพธ์มาจาก backend แล้ว

        } catch (error) {
            console.error("Error in data fetch:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [project_id, project_name]);

    // ฟังก์ชันอัพเดต progress หลังจากการเปลี่ยนแปลง
    const refreshProgressAfterUpdate = async (taskId: string) => {
        try {
            // หา projectId จาก task
            const task = tasks.find(t => t.task_id === taskId);
            if (!task || !task.project_id) return;

            // ดึงข้อมูลความคืบหน้าจาก API
            const response = await getDetailedProjectProgress(task.project_id);
            if (response.success) {
                const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = response.responseObject;

                // อัพเดต state
                setTaskProgress(prev => ({ ...prev, ...newTaskProgress }));
                setSubtaskProgress(prev => ({ ...prev, ...newSubtaskProgress }));
                setProjectProgressValue(projectProgress);

                console.log("Progress data refreshed from backend after update");
            }
        } catch (error) {
            console.error("Failed to refresh progress data:", error);
        }
    };

    // ฟังก์ชั่นอัพเดตสถานะ task จาก subtasks
    const updateTaskStatusFromSubtasks = async (taskId: string) => {
        const taskSubtasks = subtasks[taskId] || [];

        // ถ้าไม่มี subtask ให้ข้ามไป
        if (taskSubtasks.length === 0) return;

        // ค้นหา task ปัจจุบัน
        const currentTask = tasks.find(task => task.task_id === taskId);
        if (!currentTask) return;

        // ตรวจสอบสถานะของ subtasks
        const allCompleted = taskSubtasks.every(subtask => subtask.status === "completed");
        const allCancelled = taskSubtasks.every(subtask => subtask.status === "cancelled");
        const anyInProgress = taskSubtasks.some(subtask => subtask.status === "in progress");
        const anyNotCompleted = taskSubtasks.some(subtask => subtask.status !== "completed");
        const anyLessThan100Percent = taskSubtasks.some(subtask =>
            (subtaskProgress[subtask.subtask_id] || 0) < 100
        );

        let newStatus = currentTask.status;
        let shouldUpdateStatus = false;

        // กรณี 1: ถ้าทุก subtask เป็น completed และ task ไม่ใช่ completed ให้อัพเดทเป็น completed
        if (allCompleted && currentTask.status !== "completed") {
            newStatus = "completed";
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
        }

        // ตรวจสอบและอัพเดต Task status ถ้าจำเป็น
        if (shouldUpdateStatus) {
            try {
                console.log(`Updating task status from ${currentTask.status} to ${newStatus}`);
                const response = await patchTask({
                    task_id: taskId,
                    status: newStatus
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

        // หลังจากอัพเดต status แล้ว ดึงข้อมูลใหม่จาก backend
        await refreshProgressAfterUpdate(taskId);
    };

    // ดึงข้อมูล subtasks สำหรับ task ที่กำหนด
    const fetchSubtasks = async (taskId: string, maxRetries = 2) => {
        let attempts = 0;

        const attemptFetch = async () => {
            attempts++;
            try {
                console.log(`Fetching subtasks for task: ${taskId} (Attempt ${attempts})`);

                const response = await getSubtask(taskId);

                if (response?.success) {
                    console.log(`Subtasks for task ${taskId}:`, response.responseObject);

                    // ตรวจสอบให้แน่ใจว่า subtask ที่ได้รับเป็นของ task นี้จริง ๆ
                    const filteredSubtasks = response.responseObject.filter(subtask =>
                        subtask.task_id === taskId
                    );

                    // เรียงลำดับตาม created_at ก่อนเก็บข้อมูล
                    const sortedSubtasks = [...filteredSubtasks].sort((a, b) => {
                        if (a.created_at && b.created_at) {
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        }
                        return a.subtask_id.localeCompare(b.subtask_id);
                    });

                    // เก็บข้อมูลที่เรียงแล้ว
                    setSubtasks(prev => ({
                        ...prev,
                        [taskId]: sortedSubtasks
                    }));

                    // ดึงข้อมูล progress ใหม่จาก backend หลังจากโหลด subtasks
                    await refreshProgressAfterUpdate(taskId);
                    return true;
                } else {
                    console.warn(`Attempt ${attempts}: Failed to fetch subtasks for task ${taskId}:`, response?.message || 'Unknown error');
                    // If we have retries left, don't set empty array yet
                    if (attempts >= maxRetries) {
                        setSubtasks(prev => ({
                            ...prev,
                            [taskId]: []
                        }));
                    }
                    return false;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Attempt ${attempts}: Error fetching subtasks for task ${taskId}:`, errorMessage);

                // Only set empty array on last attempt
                if (attempts >= maxRetries) {
                    setSubtasks(prev => ({
                        ...prev,
                        [taskId]: []
                    }));
                }
                return false;
            }
        };

        // Initial attempt
        let success = await attemptFetch();

        // Retry logic
        while (!success && attempts < maxRetries) {
            // Wait a bit before retrying (increasing delay with each attempt)
            await new Promise(resolve => setTimeout(resolve, attempts * 500));
            success = await attemptFetch();
        }

        if (!success) {
            console.error(`Failed to fetch subtasks for task ${taskId} after ${attempts} attempts`);
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
                return latestProgress.percent;
            }
            return 0;
        } catch (error) {
            console.error(`Error fetching progress for subtask ${subtaskId}:`, error);
            return 0;
        }
    };

    const updateProgressInState = async (id: string, percent: number, type: 'task' | 'subtask') => {
        if (type === 'task') {
            // อัพเดต task progress ใน state
            setTaskProgress(prev => ({
                ...prev,
                [id]: percent
            }));

            // ค้นหา task เพื่อหา project_id
            const task = tasks.find(t => t.task_id === id);
            if (task && task.project_id) {
                // ดึงข้อมูลความคืบหน้าจาก API
                await refreshProgressAfterUpdate(id);
            }
        }
        else if (type === 'subtask') {
            // อัพเดต subtask progress ใน state
            setSubtaskProgress(prev => ({
                ...prev,
                [id]: percent
            }));

            // หา taskId ของ subtask นี้
            let taskId = '';
            for (const tid in subtasks) {
                if (subtasks[tid].some(s => s.subtask_id === id)) {
                    taskId = tid;
                    break;
                }
            }

            if (taskId) {
                // ดึงข้อมูลความคืบหน้าจาก API
                await refreshProgressAfterUpdate(taskId);
            }
        }
    };

    const toggleExpandTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const isExpanded = prev.includes(taskId);

            if (isExpanded) {
                return prev.filter(id => id !== taskId);
            } else {
                // ถ้ากำลังจะเปิด ให้ดึงข้อมูลและคำนวณความคืบหน้าใหม่
                if (!subtasks[taskId] || subtasks[taskId]?.length === 0) {
                    fetchSubtasks(taskId);
                }
                return [...prev, taskId];
            }
        });
    };

    const updateSubtaskAndMaintainOrder = (taskId: string, updatedSubtask: TypeSubTaskAll) => {
        setSubtasks(prev => {
            // ถ้าไม่มี subtasks สำหรับ task นี้ ให้สร้างใหม่
            if (!prev[taskId]) {
                return {
                    ...prev,
                    [taskId]: [updatedSubtask]
                };
            }

            // ตรวจสอบว่า subtask มีอยู่แล้วหรือไม่
            const subtaskIndex = prev[taskId].findIndex(s => s.subtask_id === updatedSubtask.subtask_id);

            // สร้าง array ใหม่
            const newSubtasks = [...prev[taskId]];

            if (subtaskIndex === -1) {
                // ถ้ายังไม่มี subtask นี้ ให้เพิ่มต่อท้าย
                newSubtasks.push(updatedSubtask);
            } else {
                // ถ้ามี subtask นี้แล้ว ให้อัพเดทในตำแหน่งเดิม
                newSubtasks[subtaskIndex] = {
                    ...updatedSubtask,
                    // เก็บ created_at เดิมไว้ (ถ้ามี) เพื่อไม่ให้มีผลต่อการเรียงลำดับในอนาคต
                    created_at: prev[taskId][subtaskIndex].created_at
                };
            }

            // ไม่ต้องเรียงลำดับใหม่ เพื่อรักษาตำแหน่งเดิม
            return {
                ...prev,
                [taskId]: newSubtasks
            };
        });
    };

    const addSubtaskToState = (taskId: string, newSubtask: TypeSubTaskAll) => {
        setSubtasks(prev => {
            // ถ้าไม่มี subtasks สำหรับ task นี้ ให้สร้างอาร์เรย์ใหม่
            if (!prev[taskId]) {
                return {
                    ...prev,
                    [taskId]: [newSubtask]
                };
            }

            // เพิ่ม created_at property ให้กับ newSubtask (ใช้เวลาปัจจุบัน)
            const subtaskWithCreatedAt = {
                ...newSubtask,
                created_at: new Date().toISOString() // เพิ่มเวลาปัจจุบันให้กับ subtask ใหม่
            };

            // เพิ่ม subtask แล้วเรียงลำดับตาม created_at
            const updatedSubtasks = [...prev[taskId], subtaskWithCreatedAt].sort((a, b) => {
                if (a.created_at && b.created_at) {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return a.subtask_id.localeCompare(b.subtask_id);
            });

            return {
                ...prev,
                [taskId]: updatedSubtasks
            };
        });

        // อัพเดท subtaskProgress ด้วยถ้ามีการกำหนดค่า progress
        if (newSubtask.progress !== undefined) {
            setSubtaskProgress(prev => ({
                ...prev,
                [newSubtask.subtask_id]: newSubtask.progress
            }));
        }
    };

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

    // เพิ่มการ debug ใน index.tsx ก่อนส่งข้อมูลไป ProjectProgress component
    console.log("Before sending to ProjectProgress:", {
        taskCount: tasks.length,
        taskProgressEntries: Object.keys(taskProgress).length,
        taskProgressValues: Object.values(taskProgress),
        projectProgressValue: projectProgressValue,
        taskProgressAvg: Object.values(taskProgress).length > 0 ?
            Object.values(taskProgress).reduce((acc, val) => acc + val, 0) / Object.values(taskProgress).length : 0
    });

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Project Header */}
            <div className="mb-6">
                <div className="flex flex-col gap-1">

                    <h1 className="text-2xl font-bold mt-1">
                        {project_name ? `Tasks: ${project_name}` : "All Tasks"}
                    </h1>
                </div>
            </div>


            {/* Project Progress Component */}
            <ProjectProgress
                tasks={tasks}
                subtasks={subtasks}
                taskProgress={taskProgress}
                subtaskProgress={subtaskProgress}
                projectProgress={projectProgressValue} // ส่งค่าที่คำนวณไว้แล้ว
            />

            {/* Tasks List */}
            <Card variant="surface">
                <Flex className="w-full" direction="row" gap="2" justify="between">
                    <Text as="div" size="4" weight="bold">
                        Tasks
                    </Text>
                    <DialogAddTask
                        getTaskData={() => fetchAllData()}
                        projectId={currentProjectId}
                    />
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
                                {tasks.length > 0 ? (
                                    tasks.map((task: TypeTaskAll) => (
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
                                                    <Tooltip content={`${(taskProgress[task.task_id] || 0).toFixed(2)}%`}>
                                                        <div style={{ width: '100px' }}>
                                                            <ProgressBar
                                                                percent={taskProgress[task.task_id] || 0}
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
                                                            updateTaskStatus={() => updateTaskStatusFromSubtasks(task.task_id)}
                                                            addSubtaskToState={addSubtaskToState}
                                                        />
                                                        <DialogEditTask
                                                            getTaskData={() => fetchAllData()}
                                                            task_id={task.task_id}
                                                            task_name={task.task_name}
                                                            description={task.description}
                                                            budget={task.budget}
                                                            start_date={task.start_date}
                                                            end_date={task.end_date}
                                                            status={task.status}
                                                            updateSubtasksOnComplete={true}
                                                            updateTaskStatusFromSubtasks={updateTaskStatusFromSubtasks}
                                                            onProgressUpdate={(percent) => updateProgressInState(task.task_id, percent, 'task')}
                                                        />
                                                        <AlertDialogDeleteTask
                                                            getTaskData={() => fetchAllData()}
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
                                                                    updateTaskStatusFromSubtasks(task.task_id);
                                                                }}
                                                                subtaskId={subtask.subtask_id}
                                                                taskId={task.task_id}
                                                                trigger={<Button className="cursor-pointer" size="1" variant="soft" color="orange" id="subtaskEdit">Edit</Button>}
                                                                updateTaskStatus={updateTaskStatusFromSubtasks}
                                                                onProgressUpdate={(percent) => updateProgressInState(subtask.subtask_id, percent, 'subtask')}
                                                                updateSubtaskInPlace={(updatedSubtask) => updateSubtaskAndMaintainOrder(task.task_id, updatedSubtask)}
                                                            />
                                                            <AlertDialogDeleteSubtask
                                                                getSubtaskData={() => {
                                                                    fetchSubtasks(task.task_id);
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
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={8} className="text-center py-8">
                                            <Text size="2" color="gray">No tasks found for this project</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    )}
                </div>
            </Card>
        </div>
    );
}