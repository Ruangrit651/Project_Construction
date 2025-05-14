import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { getTaskProgress, getSubtaskProgress } from "@/services/progress.service";
import { calculateProgress } from "./CalProgress";

/**
 * ดึงข้อมูล Task ทั้งหมด
 */
export const fetchAllTasks = async (
    setTasks: React.Dispatch<React.SetStateAction<TypeTaskAll[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    fetchTaskProgress: (taskId: string) => Promise<void>,
    expandedTasks: string[],
    fetchSubtasks: (taskId: string) => Promise<void>
): Promise<void> => {
    setIsLoading(true);
    try {
        const res = await getTask();
        console.log("Tasks fetched:", res);

        if (res.success) {
            // ตรวจสอบว่า responseObject เป็น array หรือไม่
            if (Array.isArray(res.responseObject)) {
                setTasks(res.responseObject);

                // ดึงความคืบหน้าของ tasks
                for (const task of res.responseObject) {
                    await fetchTaskProgress(task.task_id);
                }
            } else if (res.responseObject) {
                // แปลง single object เป็น array แล้วกำหนดให้ tasks
                const taskAsArray = [res.responseObject as TypeTaskAll];
                setTasks(taskAsArray);

                // ดึงความคืบหน้าของ task เดียว
                await fetchTaskProgress(res.responseObject.task_id);
            } else {
                setTasks([]);
            }
        } else {
            setTasks([]);
        }

        // ถ้ามี task ที่ expand อยู่ ให้ดึง subtasks มาด้วย
        for (const taskId of expandedTasks) {
            await fetchSubtasks(taskId);
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
    } finally {
        setIsLoading(false);
    }
};

/**
 * ดึงข้อมูล Task ตาม Project ID
 */
export const fetchTasksByProject = async (
    projectId: string,
    setTasks: React.Dispatch<React.SetStateAction<TypeTaskAll[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setProjectName: React.Dispatch<React.SetStateAction<string>>,
    fetchTaskProgress: (taskId: string) => Promise<void>,
    project_name?: string | null
): Promise<void> => {
    setIsLoading(true);
    try {
        const res = await getTaskProject(projectId);
        console.log(`Tasks for project ${projectId}:`, res);

        if (res.success) {
            // ตรวจสอบว่า responseObject เป็น array หรือไม่
            if (Array.isArray(res.responseObject)) {
                setTasks(res.responseObject);

                // ดึงความคืบหน้าของ tasks
                for (const task of res.responseObject) {
                    await fetchTaskProgress(task.task_id);
                }

                // ถ้ายังไม่มีชื่อโปรเจค ให้ดึงจากข้อมูล Task ถ้ามี project_name
                if (!project_name && res.responseObject.length > 0 && 'project_name' in res.responseObject[0]) {
                    setProjectName(res.responseObject[0].project_name || "");
                }
            } else if (res.responseObject) {
                // แปลง single object เป็น array แล้วกำหนดให้ tasks
                const taskAsArray = [res.responseObject as TypeTaskAll];
                setTasks(taskAsArray);

                // ดึงความคืบหน้าของ task เดียว
                await fetchTaskProgress(res.responseObject.task_id);

                // ถ้ายังไม่มีชื่อโปรเจค ให้ดึงจาก Task object ถ้ามี project_name
                if (!project_name && 'project_name' in res.responseObject) {
                    setProjectName(res.responseObject.project_name || "");
                }
            } else {
                // กรณีไม่มีข้อมูล
                setTasks([]);
            }
        } else {
            console.error("Failed to fetch tasks for this project");
            setTasks([]);
        }
    } catch (error) {
        console.error(`Error fetching tasks for project ${projectId}:`, error);
        setTasks([]);
    } finally {
        setIsLoading(false);
    }
};

/**
 * ดึงข้อมูล Subtasks และความคืบหน้า
 */
export const fetchSubtasksAndProgress = async (
    taskId: string,
    subtasks: Record<string, TypeSubTaskAll[]>,
    setSubtasks: React.Dispatch<React.SetStateAction<Record<string, TypeSubTaskAll[]>>>,
    fetchSubtaskProgress: (subtaskId: string) => Promise<void>,
    calculateTaskProgress: (taskId: string) => number
): Promise<void> => {
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

        const taskProgressValue = calculateTaskProgress(taskId);
        console.log(`Subtask fetch complete. Task ${taskId} progress calculated: ${taskProgressValue}%`);
        
    } catch (error) {
        console.error(`Error fetching subtasks for task ${taskId}:`, error);
        setSubtasks(prev => ({
            ...prev,
            [taskId]: []
        }));
    }
};

/**
 * ดึงข้อมูลความคืบหน้าของ Task
 */
export const fetchTaskProgressData = async (
    taskId: string,
    tasks: TypeTaskAll[],
    subtasks: Record<string, TypeSubTaskAll[]>,
    taskProgress: Record<string, number>,
    subtaskProgress: Record<string, number>,
    setTaskProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
): Promise<void> => {
    try {
        // ตรวจสอบว่ามี subtasks หรือไม่
        if (subtasks[taskId] && subtasks[taskId].length > 0) {
            // คำนวณใหม่จาก subtasks ที่มีอยู่
            const calculatedProgress = calculateProgress(taskId, 'task', {
                tasks,
                subtasks,
                taskProgress,
                subtaskProgress,
                updateState: false
            });

            // อัพเดต state ด้วยค่าที่คำนวณได้
            setTaskProgress(prev => ({
                ...prev,
                [taskId]: calculatedProgress
            }));

            console.log(`Updated task ${taskId} progress to calculated value: ${calculatedProgress}%`);
        } else {
            // ถ้าไม่มี subtasks ดึงจากฐานข้อมูล
            const response = await getTaskProgress(taskId);
            if (response.success && response.responseObject.length > 0) {
                const latestProgress = response.responseObject[0];
                setTaskProgress(prev => ({
                    ...prev,
                    [taskId]: latestProgress.percent
                }));
            }
        }
    } catch (error) {
        console.error(`Error fetching progress for task ${taskId}:`, error);
    }
};

/**
 * ดึงข้อมูลความคืบหน้าของ Subtask
 */
export const fetchSubtaskProgressData = async (
    subtaskId: string,
    setSubtaskProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
): Promise<void> => {
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