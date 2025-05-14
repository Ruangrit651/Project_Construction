// import { TypeTaskAll } from "@/types/response/response.task";
// import { TypeSubTaskAll } from "@/types/response/response.subtask";

// type CalculateProgressOptions = {
//     tasks: TypeTaskAll[];
//     subtasks: Record<string, TypeSubTaskAll[]>;
//     taskProgress: Record<string, number>;
//     subtaskProgress: Record<string, number>;
//     useWeightedAverage?: boolean;
//     weightBy?: 'budget' | 'duration';
//     updateState?: boolean;
//     setTaskProgress?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
// };

// /**
//  * คำนวณความคืบหน้าของ Task หรือ Project จาก subtasks หรือ tasks
//  * @param id - รหัส task หรือ project
//  * @param type - ประเภทที่ต้องการคำนวณความคืบหน้า ('task' หรือ 'project')
//  * @param options - ตัวเลือกเพิ่มเติม
//  * @returns ค่าความคืบหน้าเป็น percentage (0-100)
//  */
// export const calculateProgress = (
//     id: string,
//     type: 'task' | 'project',
//     options: CalculateProgressOptions,
// ): number => {
//     const {
//         tasks,
//         subtasks,
//         taskProgress,
//         subtaskProgress,
//         useWeightedAverage = false,
//         weightBy = 'budget',
//         updateState = true,
//         setTaskProgress
//     } = options;

//     if (type === 'task') {
//         // คำนวณความคืบหน้าของ task จาก subtasks
//         const taskSubtasks = subtasks[id] || [];

//         // ถ้าไม่มี subtasks, ใช้ค่า progress ที่มีอยู่
//         if (taskSubtasks.length === 0) {
//             return taskProgress[id] || 0;
//         }

//         let totalProgress = 0;
//         let totalWeight = 0;

//         // คำนวณความคืบหน้าแบบถ่วงน้ำหนัก
//         if (useWeightedAverage) {
//             for (const subtask of taskSubtasks) {
//                 const progress = subtaskProgress[subtask.subtask_id] || 0;

//                 // ถ่วงน้ำหนักตามงบประมาณหรือระยะเวลา
//                 let weight = 1; // ค่าเริ่มต้น

//                 if (weightBy === 'budget' && subtask.budget) {
//                     weight = subtask.budget;
//                 } else if (weightBy === 'duration' && subtask.start_date && subtask.end_date) {
//                     const startDate = new Date(subtask.start_date);
//                     const endDate = new Date(subtask.end_date);
//                     const duration = endDate.getTime() - startDate.getTime();
//                     weight = Math.max(1, duration); // ต้องไม่เป็น 0
//                 }

//                 totalProgress += progress * weight;
//                 totalWeight += weight;
//             }

//             // ป้องกันการหารด้วย 0
//             const weightedProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;

//             // อัพเดตค่าใน state ถ้าต้องการ
//             if (updateState && setTaskProgress && weightedProgress !== taskProgress[id]) {
//             setTaskProgress(prev => ({
//                 ...prev,
//                 [id]: weightedProgress
//             }));
//         }

//             return weightedProgress;
//         } else {
//             // คำนวณแบบเฉลี่ยธรรมดา
//             for (const subtask of taskSubtasks) {
//                 totalProgress += subtaskProgress[subtask.subtask_id] || 0;
//             }

//             const averageProgress = totalProgress / taskSubtasks.length;

//             // อัพเดตค่าใน state ถ้าต้องการ
//             if (updateState && setTaskProgress) {
//                 setTaskProgress(prev => ({
//                     ...prev,
//                     [id]: averageProgress
//                 }));
//             }

//             return averageProgress;
//         }
//     } else if (type === 'project') {
//         // คำนวณความคืบหน้าของ project จาก tasks
//         // (โค้ดส่วนนี้ถูกละไว้เพื่อความกระชับ)
//         return 0;
//     }

//     return 0;
// };

import React from "react";
import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";

type CalculateProgressOptions = {
    tasks: TypeTaskAll[];
    subtasks: Record<string, TypeSubTaskAll[]>;
    taskProgress: Record<string, number>;
    subtaskProgress: Record<string, number>;
    useWeightedAverage?: boolean;
    weightBy?: 'budget' | 'duration';
    updateState?: boolean;
    setTaskProgress?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

/**
 * คำนวณความคืบหน้าของ Task หรือ Project จาก subtasks หรือ tasks
 * @param id - รหัส task หรือ project
 * @param type - ประเภทที่ต้องการคำนวณความคืบหน้า ('task' หรือ 'project')
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns ค่าความคืบหน้าเป็น percentage (0-100)
 */
export const calculateProgress = (
    id: string,
    type: 'task' | 'project',
    options: CalculateProgressOptions,
): number => {
    const {
        tasks,
        subtasks,
        taskProgress,
        subtaskProgress,
        useWeightedAverage = false,
        weightBy = 'duration',
        updateState = true,
        setTaskProgress
    } = options;

    // สำหรับคำนวณความคืบหน้าของ Task
    if (type === 'task') {
        const task = tasks.find(t => t.task_id === id);
        if (!task) return 0;

        // ดึง subtasks ของ task นี้
        const taskSubtasks = subtasks[id];

        // ถ้าไม่มี subtasks ให้ใช้ค่าจาก taskProgress เดิม
        if (!taskSubtasks || taskSubtasks.length === 0) {
            return taskProgress[id] || 0;
        }

        // คำนวณความคืบหน้าจาก subtasks
        let totalProgress = 0;
        let totalWeight = 0;

        for (const subtask of taskSubtasks) {
            const subtaskPercent = subtaskProgress[subtask.subtask_id] || 0;
            
            if (useWeightedAverage) {
                let weight = 1; // น้ำหนักเริ่มต้น
                
                if (weightBy === 'budget') {
                    // ถ่วงน้ำหนักตาม budget
                    weight = subtask.budget || 1;
                } else if (weightBy === 'duration') {
                    // ถ่วงน้ำหนักตามระยะเวลา
                    if (!subtask.start_date || !subtask.end_date) continue;
                    
                    const start = new Date(subtask.start_date);
                    const end = new Date(subtask.end_date);
                    const durationMs = end.getTime() - start.getTime();
                    weight = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1; // จำนวนวัน (อย่างน้อย 1 วัน)
                }
                
                totalProgress += subtaskPercent * weight;
                totalWeight += weight;
            } else {
                // ใช้ค่าเฉลี่ยแบบปกติ
                totalProgress += subtaskPercent;
                totalWeight += 1;
            }
        }
        
        // คำนวณค่าเฉลี่ย
        const result = totalWeight > 0 ? totalProgress / totalWeight : 0;
        
        // อัพเดต state ถ้ามีการกำหนด
        if (updateState && setTaskProgress) {
            setTaskProgress(prev => ({
                ...prev,
                [id]: result
            }));
        }
        
        return result;
    }
    // สำหรับคำนวณความคืบหน้าของ Project
    else if (type === 'project') {
        // ใช้ calculateProjectProgress แทน
        return calculateProjectProgress(tasks, taskProgress, subtasks, subtaskProgress);
    }
    
    return 0;
};

/**
 * คำนวณความคืบหน้าของโปรเจคจาก tasks โดยใช้วิธีถ่วงน้ำหนักตามระยะเวลาของ task
 * @param tasks - รายการ tasks ของโปรเจค
 * @param taskProgress - ข้อมูลความคืบหน้าของแต่ละ task
 * @param subtasks - ข้อมูล subtasks
 * @param subtaskProgress - ข้อมูลความคืบหน้าของ subtasks
 * @returns ค่าความคืบหน้าของโปรเจคเป็น percentage (0-100)
 */
export function calculateProjectProgress(
    tasks: TypeTaskAll[],
    taskProgress: Record<string, number>,
    subtasks?: Record<string, TypeSubTaskAll[]>,
    subtaskProgress?: Record<string, number>
) {
    // Skip calculation if no tasks
    if (!tasks.length) return 0;

    let totalProgress = 0;
    let totalDuration = 0;

    for (const task of tasks) {
        // Skip tasks with no dates
        if (!task.start_date || !task.end_date) continue;

        // Calculate task duration in days
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1; // Ensure minimum 1 day

        // คำนวณความคืบหน้าของ task
        let progress;

        // ถ้ามี subtasks ให้คำนวณจาก subtasks
        if (subtasks && subtaskProgress && subtasks[task.task_id] && subtasks[task.task_id].length > 0) {
            let subtaskTotalProgress = 0;
            let subtaskTotalDuration = 0;

            for (const subtask of subtasks[task.task_id]) {
                if (!subtask.start_date || !subtask.end_date) continue;

                const subtaskStartDate = new Date(subtask.start_date);
                const subtaskEndDate = new Date(subtask.end_date);
                const subtaskDurationMs = subtaskEndDate.getTime() - subtaskStartDate.getTime();
                const subtaskDurationDays = Math.ceil(subtaskDurationMs / (1000 * 60 * 60 * 24)) || 1;

                const subtaskPercent = subtaskProgress[subtask.subtask_id] || 0;
                subtaskTotalProgress += subtaskDurationDays * subtaskPercent;
                subtaskTotalDuration += subtaskDurationDays;
            }

            progress = subtaskTotalDuration > 0 ? subtaskTotalProgress / subtaskTotalDuration : 0;
            console.log(`Task ${task.task_id} (${task.task_name}): Calculated from ${subtasks[task.task_id].length} subtasks, Progress=${progress.toFixed(2)}%`);
        } else {
            // ใช้ค่า progress จาก taskProgress ถ้าไม่มี subtasks
            progress = taskProgress[task.task_id] || 0;
            console.log(`Task ${task.task_id} (${task.task_name}): Using stored progress, Progress=${progress.toFixed(2)}%`);
        }

        // Add weighted progress (duration × progress)
        totalProgress += durationDays * progress;
        totalDuration += durationDays;

        console.log(`Task ${task.task_id} (${task.task_name}): Progress=${progress.toFixed(2)}%, Duration=${durationDays} days, Weight=${((durationDays / totalDuration) * 100).toFixed(2)}%`);
    }

    // Calculate weighted average
    const result = totalDuration > 0 ? totalProgress / totalDuration : 0;

    console.log(`Project Progress Calculation: Total Weighted Progress=${totalProgress.toFixed(2)}, Total Duration=${totalDuration}, Result=${result.toFixed(2)}%`);

    return result;
}