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

import { useRef } from 'react';

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

    // ย้าย fetchAllData ออกมานอก useEffect และปรับปรุงประสิทธิภาพ
    const fetchAllData = async () => {
        setIsLoading(true);

        try {
            // สร้างอาร์เรย์ของ Promises เพื่อทำงานพร้อมกัน
            const promises = [];
            let detailedPromise;
            
            // กำหนด project ID ถ้ามี
            if (project_id) {
                setCurrentProjectId(project_id);
                if (project_name) {
                    setProjectName(project_name);
                }

                // ดึงข้อมูลแบบละเอียดทั้งหมดจาก API เดียว (แยกเป็น Promise ต่างหาก)
                detailedPromise = getDetailedProjectProgress(project_id).then(detailedResponse => {
                    if (detailedResponse?.success) {
                        const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = detailedResponse.responseObject || {};

                        // Add null checks before using the response data
                        if (newTaskProgress && newSubtaskProgress) {
                            // อัพเดต state โดยตรงจากข้อมูล backend
                            setTaskProgress(newTaskProgress);
                            setSubtaskProgress(newSubtaskProgress);
                            setProjectProgressValue(projectProgress || 0);
                        }
                    }
                }).catch(error => {
                    console.error("Failed to fetch detailed progress:", error);
                });
                
                // เพิ่มเข้าในอาร์เรย์ของ Promises
                promises.push(detailedPromise);
            }
            
            // 1. ดึงข้อมูล tasks (ทำงานพร้อมกับการดึงข้อมูล progress)
            let taskPromise;
            if (project_id) {
                taskPromise = getTaskProject(project_id).then(res => {
                    if (res.success && Array.isArray(res.responseObject)) {
                        // กรองข้อมูลซ้ำด้วย task_id
                        const uniqueTaskMap: Record<string, TypeTaskAll> = {};
                        res.responseObject.forEach(task => {
                            uniqueTaskMap[task.task_id] = task;
                        });

                        // แปลงเป็น array โดยไม่ต้องเรียงลำดับใหม่ - เก็บลำดับตามที่ได้รับมาจาก API
                        const taskData = Object.values(uniqueTaskMap);

                        // อัพเดต tasks
                        setTasks(taskData);
                        
                        // ใช้ข้อมูล project_name จาก task ถ้าไม่มีการระบุมา
                        if (!project_name && taskData.length > 0 && 'project_name' in taskData[0]) {
                            setProjectName(taskData[0].project_name || "");
                        }
                        
                        return taskData;
                    }
                    return [];
                });
            } else {
                taskPromise = getTask().then(res => {
                    if (res.success && Array.isArray(res.responseObject)) {
                        // กรองข้อมูลซ้ำด้วย task_id
                        const uniqueTaskMap: Record<string, TypeTaskAll> = {};
                        res.responseObject.forEach(task => {
                            uniqueTaskMap[task.task_id] = task;
                        });

                        // แปลงเป็น array โดยไม่ต้องเรียงลำดับใหม่
                        const taskData = Object.values(uniqueTaskMap);
                        
                        // อัพเดต tasks
                        setTasks(taskData);
                        return taskData;
                    }
                    return [];
                });
            }
            
            // เพิ่มเข้าในอาร์เรย์ของ Promises
            promises.push(taskPromise);

            // รอให้ API call สำหรับดึงข้อมูล tasks เสร็จสิ้น
            // เพื่อจะได้นำข้อมูล task ไปดึง subtasks ต่อไป
            const taskData = await taskPromise;
            
            // 2. ดึงข้อมูล subtasks เฉพาะสำหรับ tasks ที่เปิดอยู่หรือที่ต้องการแสดงเท่านั้น
            // แทนที่จะดึงทั้งหมดพร้อมกัน
            const subtasksData: Record<string, TypeSubTaskAll[]> = {};
            
            // ดึงข้อมูล subtasks เฉพาะสำหรับ tasks ที่ถูกขยาย (expanded) อยู่
            for (const taskId of expandedTasks) {
                if (taskData.some(task => task.task_id === taskId)) {
                    try {
                        const res = await getSubtask(taskId);
                        if (res.success && Array.isArray(res.responseObject)) {
                            // กรองเฉพาะ subtask ที่เป็นของ task นี้จริงๆ
                            const filteredSubtasks = res.responseObject.filter(subtask =>
                                subtask.task_id === taskId
                            );

                            // เรียงลำดับตาม created_at
                            const sortedSubtasks = [...filteredSubtasks].sort((a, b) => {
                                if (a.created_at && b.created_at) {
                                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                                }
                                return a.subtask_id.localeCompare(b.subtask_id);
                            });

                            // เก็บข้อมูล subtasks ที่เรียงลำดับแล้ว
                            subtasksData[taskId] = sortedSubtasks;
                        }
                    } catch (err) {
                        console.error(`Error fetching subtasks for task ${taskId}:`, err);
                        subtasksData[taskId] = [];
                    }
                }
            }
            
            // อัพเดต subtasks state ถ้ามีข้อมูลใหม่
            if (Object.keys(subtasksData).length > 0) {
                setSubtasks(prev => ({
                    ...prev,
                    ...subtasksData
                }));
            }

            // รอให้ทุก Promise เสร็จสิ้น
            await Promise.all(promises);

        } catch (error) {
            console.error("Error in data fetch:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // สร้างตัวแปรเพื่อเก็บค่า fetch ล่าสุด
    const lastFetchTimestamp = useRef<number>(0);
    const FETCH_THROTTLE_MS = 1000; // ระยะเวลาขั้นต่ำระหว่างการเรียก API

    useEffect(() => {
        const now = Date.now();
        
        // ตรวจสอบว่าเคยเรียก API นี้ในช่วงเวลาที่กำหนดหรือไม่
        if (now - lastFetchTimestamp.current > FETCH_THROTTLE_MS) {
            lastFetchTimestamp.current = now;
            fetchAllData();
        }
    }, [project_id, project_name]);

    // ตัวแปรสำหรับเก็บข้อมูล tasks ที่ต้องการอัพเดต
    const tasksToUpdate = useRef<Set<string>>(new Set());
    const updateTasksTimeoutId = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        // ทุกครั้งที่ subtaskProgress หรือ subtasks เปลี่ยน 
        // ให้รวบรวม tasks ที่ต้องการอัพเดตแทนที่จะอัพเดตทันที
        
        // ยกเลิก timeout ที่กำลังจะทำงานถ้ามี
        if (updateTasksTimeoutId.current) {
            clearTimeout(updateTasksTimeoutId.current);
        }
        
        // เพิ่ม tasks ที่ต้องการอัพเดตเข้าไปใน Set
        Object.keys(subtasks).forEach(taskId => {
            tasksToUpdate.current.add(taskId);
        });
        
        // ตั้ง timeout เพื่อรอให้การเปลี่ยนแปลงหยุดก่อนที่จะอัพเดต
        // (debounce pattern)
        updateTasksTimeoutId.current = setTimeout(() => {
            // อัพเดตเฉพาะ tasks ที่อยู่ใน Set
            const taskIds = Array.from(tasksToUpdate.current);
            
            // ทยอยอัพเดตทีละ task เพื่อไม่ให้ UI กระตุก
            const processNextTask = async (index: number) => {
                if (index >= taskIds.length) {
                    // เคลียร์ Set เมื่ออัพเดตครบทุก task แล้ว
                    tasksToUpdate.current.clear();
                    return;
                }
                
                const taskId = taskIds[index];
                await updateTaskStatusFromSubtasks(taskId);
                
                // รอเล็กน้อยก่อนอัพเดต task ถัดไป
                setTimeout(() => processNextTask(index + 1), 10);
            };
            
            // เริ่มอัพเดต task แรก
            if (taskIds.length > 0) {
                processNextTask(0);
            }
        }, 300);
        
        // cleanup function
        return () => {
            if (updateTasksTimeoutId.current) {
                clearTimeout(updateTasksTimeoutId.current);
            }
        };
        // eslint-disable-next-line
    }, [subtaskProgress, subtasks]);

    // ฟังก์ชันอัพเดต progress หลังจากการเปลี่ยนแปลง - ปรับปรุงประสิทธิภาพ
    // สร้างตัวแปรเพื่อติดตามการเรียกใช้งาน API ล่าสุดสำหรับแต่ละ project
    const lastApiCallTimestamps = useRef<Record<string, number>>({});
    const API_THROTTLE_MS = 1000; // จำกัดการเรียก API ให้น้อยกว่า 1 ครั้งต่อวินาที

    const refreshProgressAfterUpdate = async (taskId: string) => {
        try {
            // หา projectId จาก task
            const task = tasks.find(t => t.task_id === taskId);
            if (!task || !task.project_id) return;
            
            const projectId = task.project_id;
            const now = Date.now();
            
            // ตรวจสอบว่าเคยเรียก API นี้ในช่วงเวลาที่กำหนดหรือไม่
            if (lastApiCallTimestamps.current[projectId] && 
                now - lastApiCallTimestamps.current[projectId] < API_THROTTLE_MS) {
                // ถ้าเพิ่งเรียกไป ให้ข้ามการเรียก API ใหม่
                return;
            }
            
            // บันทึกเวลาล่าสุดที่เรียก API
            lastApiCallTimestamps.current[projectId] = now;

            // ดึงข้อมูลความคืบหน้าจาก API
            const response = await getDetailedProjectProgress(projectId);
            if (response.success) {
                const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = response.responseObject;

                // อัพเดต state แบบ batch เพื่อลดการ re-render
                setTaskProgress(prev => ({ ...prev, ...newTaskProgress }));
                setSubtaskProgress(prev => ({ ...prev, ...newSubtaskProgress }));
                setProjectProgressValue(projectProgress);
            }
        } catch (error) {
            console.error("Failed to refresh progress data:", error);
        }
    };

    // ฟังก์ชั่นอัพเดตสถานะ task จาก subtasks
    const updateTaskStatusFromSubtasks = async (taskId: string) => {
        const taskSubtasks = subtasks[taskId] || [];

        // Ensure taskSubtasks is treated as an array of TypeSubTaskAll
        if (!Array.isArray(taskSubtasks)) {
            console.error(`Expected taskSubtasks to be an array, but got:`, taskSubtasks);
            return;
        }

        // If no subtasks, skip
        if (taskSubtasks.length === 0) return;

        // Find the current task
        const currentTask = tasks.find(task => task.task_id === taskId);
        if (!currentTask) return;

        // ลดการใช้ console.log เพื่อเพิ่มประสิทธิภาพ
        // console.log(`Updating task status for task ${taskId} with ${taskSubtasks.length} subtasks`);

        // Check subtask statuses - optimize by using cached values
        const allCompleted = taskSubtasks.every((subtask: TypeSubTaskAll) => subtask.status === "completed");
        const allCancelled = taskSubtasks.every((subtask: TypeSubTaskAll) => subtask.status === "suspended");
        const anyInProgress = taskSubtasks.some((subtask: TypeSubTaskAll) => subtask.status === "in progress");
        const anyNotCompleted = taskSubtasks.some((subtask: TypeSubTaskAll) => subtask.status !== "completed");
        const anyLessThan100Percent = taskSubtasks.some((subtask: TypeSubTaskAll) =>
            (subtaskProgress[subtask.subtask_id] || 0) < 100
        );

        let newStatus = currentTask.status;
        let shouldUpdateStatus = false;

        // Case 1: All subtasks completed
        if (allCompleted && currentTask.status !== "completed") {
            newStatus = "completed";
            shouldUpdateStatus = true;
        }
        // Case 2: All subtasks suspended
        else if (allCancelled && currentTask.status !== "suspended") {
            newStatus = "suspended";
            shouldUpdateStatus = true;
        }
        // Case 3: Any subtask in progress
        else if (anyInProgress && currentTask.status !== "in progress") {
            newStatus = "in progress";
            shouldUpdateStatus = true;
        }
        // Case 4: Task marked completed but subtasks not completed
        else if (currentTask.status === "completed" && (anyNotCompleted || anyLessThan100Percent)) {
            newStatus = "in progress";
            shouldUpdateStatus = true;
        }
        // Case 5: Any subtask with progress > 0 but task not in progress
        else if (currentTask.status !== "in progress" && currentTask.status !== "completed") {
            const anySubtaskWithProgress = taskSubtasks.some((subtask: TypeSubTaskAll) =>
                (subtaskProgress[subtask.subtask_id] || 0) > 0
            );

            if (anySubtaskWithProgress) {
                newStatus = "in progress";
                shouldUpdateStatus = true;
                // ลดการใช้ console.log เพื่อเพิ่มประสิทธิภาพ
            }
        }
        // Case 6: All subtasks have progress 0 and task is "in progress", change back to "pending"
        else if (currentTask.status === "in progress") {
            // Check if all subtasks have zero progress AND no subtask has "in progress" status
            const allSubtasksZeroProgress = taskSubtasks.every((subtask: TypeSubTaskAll) =>
                (subtaskProgress[subtask.subtask_id] || 0) === 0
            );

            const noSubtaskInProgress = taskSubtasks.every((subtask: TypeSubTaskAll) =>
                subtask.status !== "in progress"
            );

            if (allSubtasksZeroProgress && noSubtaskInProgress) {
                newStatus = "pending";
                shouldUpdateStatus = true;
                // ลดการใช้ console.log เพื่อเพิ่มประสิทธิภาพ
            }
        }

        // Update task status if needed
        if (shouldUpdateStatus) {
            try {
                // ลดการใช้ console.log เพื่อเพิ่มประสิทธิภาพ
                // console.log(`Updating task status from ${currentTask.status} to ${newStatus}`);

                // Update local state immediately for responsiveness
                setTasks(prev => prev.map(t =>
                    t.task_id === taskId ? { ...t, status: newStatus } : t
                ));

                // Send update to backend - ใช้ debounce หรือ throttle ถ้าเป็นไปได้
                const response = await patchTask({
                    task_id: taskId,
                    status: newStatus
                });

                if (!response.success) {
                    console.error(`Failed to update task status: ${response.message}`);
                }
            } catch (error) {
                console.error("Failed to update task status:", error);
            }
        }

        // Refresh progress หลังจาก status update เฉพาะเมื่อมีการอัพเดต status จริงๆ
        if (shouldUpdateStatus) {
            await refreshProgressAfterUpdate(taskId);
        }
    };

    // ดึงข้อมูล subtasks สำหรับ task ที่กำหนด - ปรับปรุงประสิทธิภาพ
    const fetchSubtasks = async (taskId: string, maxRetries = 2) => {
        let attempts = 0;

        const attemptFetch = async () => {
            attempts++;
            try {
                // ลดการ log ที่ไม่จำเป็น
                // console.log(`Fetching subtasks for task: ${taskId} (Attempt ${attempts})`);

                const response = await getSubtask(taskId);

                if (response?.success) {
                    // ลดการ log ที่ไม่จำเป็น
                    // console.log(`Subtasks for task ${taskId}:`, response.responseObject);

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
                        [taskId]: Array.isArray(sortedSubtasks) ? sortedSubtasks : []
                    }));

                    // ดึงข้อมูล progress ใหม่จาก backend หลังจากโหลด subtasks
                    // แต่ใช้ throttle เพื่อป้องกันการเรียก API บ่อยเกินไป
                    await refreshProgressAfterUpdate(taskId);
                    return true;
                } else {
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
            // Update task progress in state
            setTaskProgress(prev => ({
                ...prev,
                [id]: percent
            }));

            // Find task to get project_id
            const task = tasks.find(t => t.task_id === id);
            if (task && task.project_id) {
                // Fetch updated progress from API
                await refreshProgressAfterUpdate(id);
            }
        } else if (type === 'subtask') {
            // Update subtask progress in state
            setSubtaskProgress(prev => ({
                ...prev,
                [id]: percent
            }));

            // Find the taskId of this subtask
            let taskId = '';

            // Loop through all tasks and their subtasks
            for (const tid in subtasks) {
                const taskSubtasks = subtasks[tid];
                if (Array.isArray(taskSubtasks) && taskSubtasks.some(s => s.subtask_id === id)) {
                    taskId = tid;
                    break;
                }
            }

            if (taskId) {
                console.log(`Found taskId ${taskId} for subtask ${id}, updating task status...`);

                // Immediately update the subtask status based on progress
                setSubtasks(prev => {
                    const taskSubtasks = prev[taskId];
                    if (!Array.isArray(taskSubtasks)) return prev;

                    const updatedSubtasks = taskSubtasks.map(s => {
                        if (s.subtask_id === id) {
                            // If progress is > 0 but < 100, set status to "in progress"
                            if (percent > 0 && percent < 100) {
                                return { ...s, status: "in progress" };
                            }
                            // If progress is 100%, set status to "completed"
                            else if (percent === 100) {
                                return { ...s, status: "completed" };
                            }
                            // If progress is 0, revert status back to "pending"
                            else if (percent === 0) {
                                return { ...s, status: "pending" };
                            }
                        }
                        return s;
                    });

                    return {
                        ...prev,
                        [taskId]: updatedSubtasks
                    };
                });

                // Force task status to "in progress" if the subtask progress is > 0
                const task = tasks.find(t => t.task_id === taskId);
                if (task && percent > 0 && task.status !== "in progress" && task.status !== "completed") {
                    console.log(`Forcing task ${taskId} status to "in progress" due to subtask progress > 0`);

                    // Update local task state immediately
                    setTasks(prev => prev.map(t =>
                        t.task_id === taskId ? { ...t, status: "in progress" } : t
                    ));

                    // Send update to backend
                    try {
                        const response = await patchTask({
                            task_id: taskId,
                            status: "in progress"
                        });

                        if (response.success) {
                            console.log(`Successfully updated task status to "in progress"`);
                        } else {
                            console.error(`Failed to update task status: ${response.message}`);
                        }
                    } catch (error) {
                        console.error("Error updating task status:", error);
                    }
                }
                // If progress is set to 0, check if we need to update task status to pending
                else if (task && percent === 0 && task.status === "in progress") {
                    // Need to check all subtasks of this task
                    const allTaskSubtasks = subtasks[taskId] || [];

                    // Update with the change we're currently making
                    const updatedSubtasks = allTaskSubtasks.map(s =>
                        s.subtask_id === id ? { ...s, status: "pending" } : s
                    );

                    // Check if all subtasks now have 0 progress
                    const allZeroProgress = updatedSubtasks.every(s =>
                        (subtaskProgress[s.subtask_id] || 0) === 0 || s.subtask_id === id
                    );

                    // Check if none are in progress status anymore
                    const noInProgressStatus = updatedSubtasks.every(s =>
                        s.status !== "in progress" || s.subtask_id === id
                    );

                    if (allZeroProgress && noInProgressStatus) {
                        console.log(`All subtasks now have 0 progress, reverting task ${taskId} to "pending"`);

                        // Update local task state immediately
                        setTasks(prev => prev.map(t =>
                            t.task_id === taskId ? { ...t, status: "pending" } : t
                        ));

                        // Send update to backend
                        try {
                            const response = await patchTask({
                                task_id: taskId,
                                status: "pending"
                            });

                            if (response.success) {
                                console.log(`Successfully updated task status to "pending"`);
                            } else {
                                console.error(`Failed to update task status: ${response.message}`);
                            }
                        } catch (error) {
                            console.error("Error updating task status:", error);
                        }
                    }
                }

                // Update task status based on subtasks
                await updateTaskStatusFromSubtasks(taskId);

                // Fetch updated progress from API
                await refreshProgressAfterUpdate(taskId);
            } else {
                console.error(`Could not find taskId for subtask ${id}`);
            }
        }
    };

    // อัพเดต toggleExpandTask ให้มีประสิทธิภาพมากขึ้น
    // สร้างตัวแปรเพื่อจำกัดการทำงานซ้ำ
    const expandInProgress = useRef<Set<string>>(new Set());
    
    const toggleExpandTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const isExpanded = prev.includes(taskId);

            if (isExpanded) {
                // หากกำลังยุบ ทำได้ทันที
                return prev.filter(id => id !== taskId);
            } else {
                // ถ้ากำลังจะเปิด ให้ดึงข้อมูล subtasks และคำนวณความคืบหน้าใหม่
                
                // ป้องกันการเรียกหลายครั้งติดกัน
                if (!expandInProgress.current.has(taskId)) {
                    expandInProgress.current.add(taskId);
                    
                    // ตรวจสอบว่ามีข้อมูล subtasks แล้วหรือยัง
                    if (!subtasks[taskId] || subtasks[taskId]?.length === 0) {
                        // ดึงข้อมูล subtasks ในรูปแบบ non-blocking 
                        // เพื่อให้ UI ตอบสนองได้เร็วขึ้น
                        setTimeout(() => {
                            fetchSubtasks(taskId).finally(() => {
                                expandInProgress.current.delete(taskId);
                            });
                        }, 10);
                    } else {
                        expandInProgress.current.delete(taskId);
                    }
                }
                
                // ส่งค่าการขยายทันทีเพื่อให้ UI ตอบสนองเร็ว
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
                                    <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell> {/* เพิ่มคอลัมน์ Duration */}
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
                                                <Table.Cell>{calculateDuration(task.start_date, task.end_date)}</Table.Cell> {/* แสดง Duration */}
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
                                                    <Table.Cell>{calculateDuration(subtask.start_date, subtask.end_date)}</Table.Cell> {/* แสดง Duration */}
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