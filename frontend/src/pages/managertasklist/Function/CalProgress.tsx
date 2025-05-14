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
        weightBy = 'budget',
        updateState = true,
        setTaskProgress
    } = options;

    if (type === 'task') {
        // คำนวณความคืบหน้าของ task จาก subtasks
        const taskSubtasks = subtasks[id] || [];

        // ถ้าไม่มี subtasks, ใช้ค่า progress ที่มีอยู่
        if (taskSubtasks.length === 0) {
            return taskProgress[id] || 0;
        }

        let totalProgress = 0;
        let totalWeight = 0;

        // คำนวณความคืบหน้าแบบถ่วงน้ำหนัก
        if (useWeightedAverage) {
            for (const subtask of taskSubtasks) {
                const progress = subtaskProgress[subtask.subtask_id] || 0;

                // ถ่วงน้ำหนักตามงบประมาณหรือระยะเวลา
                let weight = 1; // ค่าเริ่มต้น

                if (weightBy === 'budget' && subtask.budget) {
                    weight = subtask.budget;
                } else if (weightBy === 'duration' && subtask.start_date && subtask.end_date) {
                    const startDate = new Date(subtask.start_date);
                    const endDate = new Date(subtask.end_date);
                    const duration = endDate.getTime() - startDate.getTime();
                    weight = Math.max(1, duration); // ต้องไม่เป็น 0
                }

                totalProgress += progress * weight;
                totalWeight += weight;
            }

            // ป้องกันการหารด้วย 0
            const weightedProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;

            // อัพเดตค่าใน state ถ้าต้องการ
            if (updateState && setTaskProgress && weightedProgress !== taskProgress[id]) {
                setTaskProgress(prev => ({
                    ...prev,
                    [id]: weightedProgress
                }));
            }

            return weightedProgress;
        } else {
            // คำนวณแบบเฉลี่ยธรรมดา
            for (const subtask of taskSubtasks) {
                totalProgress += subtaskProgress[subtask.subtask_id] || 0;
            }

            const averageProgress = totalProgress / taskSubtasks.length;

            // อัพเดตค่าใน state ถ้าต้องการ
            if (updateState && setTaskProgress) {
                setTaskProgress(prev => ({
                    ...prev,
                    [id]: averageProgress
                }));
            }

            return averageProgress;
        }
    } else if (type === 'project') {
        // คำนวณความคืบหน้าของ project จาก tasks
        // (โค้ดส่วนนี้ถูกละไว้เพื่อความกระชับ)
        return 0;
    }

    return 0;
};