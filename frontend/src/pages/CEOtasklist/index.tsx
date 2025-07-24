import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { getTaskProgress, getSubtaskProgress, getDetailedProjectProgress } from "@/services/progress.service";
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Card, Flex, Text, Button, Table, Tooltip } from "@radix-ui/themes";
import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import ProjectProgress from "./components/ProjectProgress";

// ProgressBar component (copied from manager tasklist)
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

export default function CEOTasklist() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    // อ่าน URL parameters
    const project_id = searchParams.get('project_id');
    const project_name = searchParams.get('project_name');

    // State variables
    const [tasks, setTasks] = useState<TypeTaskAll[]>([]);
    const [subtasks, setSubtasks] = useState<Record<string, TypeSubTaskAll[]>>({});
    const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
    const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>({});
    const [projectProgressValue, setProjectProgressValue] = useState<number>(0);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [projectName, setProjectName] = useState<string>(project_name || "");
    const [currentProjectId, setCurrentProjectId] = useState<string>(project_id || "");

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
                    if (detailedResponse.success) {
                        const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = detailedResponse.responseObject;

                        // อัพเดต state โดยตรงจากข้อมูล backend
                        setTaskProgress(newTaskProgress);
                        setSubtaskProgress(newSubtaskProgress);
                        setProjectProgressValue(projectProgress);

                        console.log("Progress data loaded from backend:", {
                            projectProgress,
                            taskProgressCount: Object.keys(newTaskProgress).length,
                            subtaskProgressCount: Object.keys(newSubtaskProgress).length
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch detailed progress:", error);
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

                    // ดึงชื่อโปรเจกต์จาก task ถ้ายังไม่มี
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

                    // แปลงเป็น array โดยไม่ต้องเรียงลำดับใหม่
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

        } catch (error) {
            console.error("Error in data fetch:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [project_id, project_name]);

    // ฟังก์ชันดึงข้อมูล subtasks สำหรับ task ที่กำหนด
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

                // เรียงลำดับตาม created_at
                const sortedSubtasks = [...filteredSubtasks].sort((a, b) => {
                    if (a.created_at && b.created_at) {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    }
                    return a.subtask_id.localeCompare(b.subtask_id);
                });

                // เก็บข้อมูลที่เรียงลำดับแล้ว
                setSubtasks(prev => ({
                    ...prev,
                    [taskId]: sortedSubtasks
                }));
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

    const calculateDuration = (startDate: string | undefined, endDate: string | undefined): string => {
    if (!startDate || !endDate) return "-";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); // คำนวณจำนวนวัน
    return `${duration} days`;
};
    

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
                </Flex>
                <div className="w-full mt-2">
                    {isLoading ? (
                        <Flex align="center" justify="center" py="4">
                            <Text>Loading data...</Text>
                        </Flex>
                    ) : tasks.length === 0 ? (
                        <Flex align="center" justify="center" py="4">
                            <Text>No tasks found</Text>
                        </Flex>
                    ) : (
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Task</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell> {/* Added Duration column */}
                                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tasks.map(task => (
                                    <React.Fragment key={`fragment-${task.task_id}`}>
                                        <Table.Row key={`task-${task.task_id}`}>
                                            <Table.Cell>
                                                
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div>
                                                    <Text>{task.task_name}</Text>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>{formatBudget(task.budget)}</Table.Cell>
                                            <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
                                            <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
                                            <Table.Cell>{calculateDuration(task.start_date, task.end_date)}</Table.Cell> {/* Added Duration value */}
                                            <Table.Cell>
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    task.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </Table.Cell>
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
                                                <Button
                                                    variant="soft"
                                                    size="1"
                                                    onClick={() => toggleExpandTask(task.task_id)}
                                                    className=" cursor-pointer"
                                                >
                                                    {expandedTasks.includes(task.task_id) ? 'Hide details' : 'View details'}
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>

                                        {/* Subtasks (แสดงเมื่อคลิกดูรายละเอียด) */}
                                        {expandedTasks.includes(task.task_id) && subtasks[task.task_id]?.map(subtask => (
                                            <Table.Row key={`subtask-${subtask.subtask_id}-${task.task_id}`} className="bg-gray-50">
                                                <Table.Cell>
                                                    <div className="pl-6"></div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text size="2" className="pl-4">{subtask.subtask_name}</Text>
                                                    <Text size="2" color="gray" className="pl-4">{subtask.description}</Text>
                                                </Table.Cell>
                                                <Table.Cell>{formatBudget(subtask.budget)}</Table.Cell>
                                                <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
                                                <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
                                                <Table.Cell>{calculateDuration(subtask.start_date, subtask.end_date)}</Table.Cell> {/* Added Duration value */}
                                                <Table.Cell>
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${subtask.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            subtask.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                subtask.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {subtask.status}
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Tooltip content={`${(subtaskProgress[subtask.subtask_id] || 0).toFixed(2)}%`}>
                                                        <div style={{ width: '100px' }}>
                                                            <ProgressBar
                                                                percent={subtaskProgress[subtask.subtask_id] || 0}
                                                            />
                                                        </div>
                                                    </Tooltip>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {/* No action buttons for subtasks in CEO view */}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}

                                        {expandedTasks.includes(task.task_id) && (!subtasks[task.task_id] || subtasks[task.task_id]?.length === 0) && (
                                            <Table.Row key={`empty-${task.task_id}`}>
                                                <Table.Cell></Table.Cell>
                                                <Table.Cell colSpan={8} className="text-center py-4">
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
        </div>
    );
}