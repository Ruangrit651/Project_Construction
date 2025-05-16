import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { patchTask } from "@/services/task.service";
import { createProgress } from "@/services/progress.service";
import { calculateProgress } from "./CalProgress";

/**
 * ฟังก์ชันอัพเดตสถานะ task จากสถานะของ subtasks
 */
export const updateTaskStatusFromSubtasks = async (
    taskId: string,
    tasks: TypeTaskAll[],
    subtasks: Record<string, TypeSubTaskAll[]>,
    taskProgress: Record<string, number>,
    subtaskProgress: Record<string, number>,
    setTasks: React.Dispatch<React.SetStateAction<TypeTaskAll[]>>,
    setTaskProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
): Promise<void> => {
    const taskSubtasks = subtasks[taskId] || [];

    // ถ้าไม่มี subtask ให้ข้ามไป
    if (taskSubtasks.length === 0) return;

    // ค้นหา task ปัจจุบัน
    const currentTask = tasks.find(task => task.task_id === taskId);
    if (!currentTask) return;

    // คำนวณความคืบหน้าโดยใช้ฟังก์ชันที่ปรับปรุงใหม่
    const averageProgress = calculateProgress(taskId, 'task', {
        tasks,
        subtasks,
        taskProgress,
        subtaskProgress,
        useWeightedAverage: true,
        weightBy: 'duration',
        updateState: false
    });

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