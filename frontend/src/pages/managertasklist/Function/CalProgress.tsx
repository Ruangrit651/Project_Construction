import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";

/**
 * ฟังก์ชันสำหรับคำนวณความคืบหน้าแบบถ่วงน้ำหนักตามระยะเวลา
 * สามารถใช้คำนวณได้ทั้ง Project, Task และ Subtask
 * 
 * @param itemId - ID ของ Project, Task หรือ Subtask ที่ต้องการคำนวณ
 * @param type - ประเภทของรายการ ('project', 'task', 'subtask')
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns ค่าความคืบหน้าเป็นเปอร์เซ็นต์ (0-100)
 */
export const calculateProgress = (
    itemId: string,
    type: 'project' | 'task' | 'subtask' = 'task',
    options: {
        tasks?: TypeTaskAll[],
        subtasks?: Record<string, TypeSubTaskAll[]>,
        taskProgress?: Record<string, number>,
        subtaskProgress?: Record<string, number>,
        useWeightedAverage?: boolean,
        weightBy?: 'duration' | 'budget' | 'custom',
        customWeights?: Record<string, number>,
        updateState?: boolean,
        setTaskProgress?: React.Dispatch<React.SetStateAction<Record<string, number>>>
    } = {}
) => {
    // ค่าเริ่มต้นของตัวเลือก
    const {
        tasks = [],
        subtasks = {},
        taskProgress = {},
        subtaskProgress = {},
        useWeightedAverage = true,
        weightBy = 'duration',
        customWeights = {},
        updateState = true,
        setTaskProgress
    } = options;

    // กรณี Subtask
    if (type === 'subtask') {
        // สำหรับ subtask ให้ใช้ค่าที่บันทึกไว้ใน state
        return subtaskProgress[itemId] || 0;
    }

    // กรณี Task
    if (type === 'task') {
        const taskSubtasks = subtasks[itemId] || [];

        // ถ้าไม่มี subtask ใช้ความคืบหน้าของ task ที่บันทึกไว้โดยตรง
        if (taskSubtasks.length === 0) {
            return taskProgress[itemId] || 0;
        }

        if (useWeightedAverage) {
    // คำนวณความคืบหน้าแบบถ่วงน้ำหนัก
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const subtask of taskSubtasks) {
        // กำหนดน้ำหนักตามตัวเลือก
        let weight = 1; // ค่าเริ่มต้น
        
        if (weightBy === 'duration' && subtask.start_date && subtask.end_date) {
            const startDate = new Date(subtask.start_date);
            const endDate = new Date(subtask.end_date);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            weight = diffDays > 0 ? diffDays : 1;
        }
        else if (weightBy === 'budget' && subtask.budget) {
            weight = subtask.budget > 0 ? subtask.budget : 1;
        }
        else if (weightBy === 'custom' && customWeights[subtask.subtask_id]) {
            weight = customWeights[subtask.subtask_id];
        }
        
        // รับค่าความคืบหน้า (ซึ่งอาจเป็นค่า 0-100)
        let progress = subtaskProgress[subtask.subtask_id] || 0;
        
        // แปลงเป็นค่า 0-1 ถ้าค่าเกิน 1 (คาดว่าเป็นค่า 0-100)
        if (progress > 1) {
            progress = progress / 100;
        }

        console.log(`Subtask: ${subtask.subtask_name}, Progress: ${progress}, Weight: ${weight}, weighted: ${progress * weight}`);
        
        totalWeightedProgress += progress * weight;
        totalWeight += weight;
    }

    console.log(`Total Weighted Progress: ${totalWeightedProgress}, Total Weight: ${totalWeight}`);
    console.log(`Raw calculation: ${totalWeightedProgress / totalWeight}`);
    
    // คำนวณเป็นเปอร์เซ็นต์ (0-100)
    const weightedAverageProgress = totalWeight > 0 
        ? Number(((totalWeightedProgress / totalWeight) * 100).toFixed(2))
        : 0;
    
    console.log(`Final result: ${weightedAverageProgress}`);

    // อัปเดต state ถ้ากำหนด
    if (updateState && setTaskProgress && weightedAverageProgress !== taskProgress[itemId]) {
        setTaskProgress(prev => ({
            ...prev,
            [itemId]: weightedAverageProgress
        }));
    }

    return weightedAverageProgress;
}
        
        else {
            // คำนวณแบบเฉลี่ยธรรมดา
            let totalProgress = 0;
            for (const subtask of taskSubtasks) {
                totalProgress += subtaskProgress[subtask.subtask_id] || 0;
            }

            const averageProgress = parseFloat((totalProgress / taskSubtasks.length).toFixed(2));

            // อัปเดต state ถ้ากำหนด
            if (updateState && setTaskProgress && averageProgress !== taskProgress[itemId]) {
                setTaskProgress(prev => ({
                    ...prev,
                    [itemId]: averageProgress
                }));
            }

            return averageProgress;
        }
    }

    // กรณี Project
    if (type === 'project') {
        // หา tasks ที่อยู่ใน project
        const projectTasks = tasks.filter(task => task.project_id === itemId);

        if (projectTasks.length === 0) {
            return 0;
        }

        if (useWeightedAverage) {
            // คำนวณความคืบหน้าแบบถ่วงน้ำหนัก
            let totalWeightedProgress = 0;
            let totalWeight = 0;

            for (const task of projectTasks) {
                // กำหนดน้ำหนักตามตัวเลือก
                let weight = 1; // ค่าเริ่มต้น

                if (weightBy === 'duration' && task.start_date && task.end_date) {
                    const startDate = new Date(task.start_date);
                    const endDate = new Date(task.end_date);
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    weight = diffDays > 0 ? diffDays : 1;
                }
                else if (weightBy === 'budget' && task.budget) {
                    weight = task.budget > 0 ? task.budget : 1;
                }
                else if (weightBy === 'custom' && customWeights[task.task_id]) {
                    weight = customWeights[task.task_id];
                }

                // ใช้ progress ที่คำนวณได้จาก subtasks ของ task นี้
                const progress = calculateProgress(task.task_id, 'task', {
                    tasks,
                    subtasks,
                    taskProgress,
                    subtaskProgress,
                    useWeightedAverage,
                    weightBy,
                    customWeights,
                    updateState: false // ไม่ต้องอัปเดต state เพื่อหลีกเลี่ยงการเรียกซ้ำซ้อน
                });

                totalWeightedProgress += progress * weight;
                totalWeight += weight;
            }

            return totalWeight > 0
                ? parseFloat((totalWeightedProgress / totalWeight).toFixed(2))
                : 0;
        } else {
            // คำนวณแบบเฉลี่ยธรรมดา
            let totalProgress = 0;
            for (const task of projectTasks) {
                totalProgress += calculateProgress(task.task_id, 'task', {
                    tasks,
                    subtasks,
                    taskProgress,
                    subtaskProgress,
                    useWeightedAverage: false,
                    updateState: false
                });
            }

            return parseFloat((totalProgress / projectTasks.length).toFixed(2));
        }
    }

    return 0;
};