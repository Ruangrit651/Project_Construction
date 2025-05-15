import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { ProgressRepository } from "@modules/progress/progressRepository";
import { TypePayloadProgress } from "@modules/progress/progressModel";
import { TaskRepository } from "@modules/task/taskRepository";
import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
import { Progress, subtask, task } from "@prisma/client";

// เพิ่มฟังก์ชันสำหรับคำนวณความคืบหน้าของ Task จาก Subtasks
async function calculateTaskProgressFromSubtasks(taskId: string, subtasks: subtask[]): Promise<number> {
  if (!subtasks || subtasks.length === 0) {
    // ถ้าไม่มี subtasks ให้ดึงความคืบหน้าล่าสุดของ task จากตาราง Progress
    const taskProgress = await ProgressRepository.findLatestByTaskId(taskId);
    return taskProgress?.percent || 0;
  }

  let totalProgress = 0;
  let totalWeight = 0;

  for (const subtask of subtasks) {
    // ดึงความคืบหน้าล่าสุดของ subtask
    const progress = await ProgressRepository.findLatestBySubtaskId(subtask.subtask_id);
    const percent = progress?.percent || 0;

    // คำนวณน้ำหนักตามระยะเวลา
    if (!subtask.start_date || !subtask.end_date) continue;
    
    const startDate = new Date(subtask.start_date);
    const endDate = new Date(subtask.end_date);
    const durationMs = endDate.getTime() - startDate.getTime();
    const weight = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    totalProgress += percent * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalProgress / totalWeight : 0;
}

// เพิ่มฟังก์ชันสำหรับคำนวณความคืบหน้าของโปรเจคแบบถ่วงน้ำหนัก
async function calculateWeightedProjectProgress(tasks: task[], taskProgressMap: Record<string, number>): Promise<number> {
  let totalProgress = 0;
  let totalWeight = 0;

  for (const task of tasks) {
    if (!task.start_date || !task.end_date) continue;

    // คำนวณน้ำหนักตามระยะเวลา
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    const durationMs = endDate.getTime() - startDate.getTime();
    const weight = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    // ใช้ความคืบหน้าจาก map
    const progress = taskProgressMap[task.task_id] || 0;
    
    totalProgress += progress * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalProgress / totalWeight : 0;
}

export const progressService = {
  // ดึงประวัติความคืบหน้าทั้งหมด
  findAll: async () => {
    const progress = await ProgressRepository.findAllAsync();
    return new ServiceResponse(
      ResponseStatus.Success,
      "Get all progress history success",
      progress,
      StatusCodes.OK
    );
  },

  // บันทึกความคืบหน้าใหม่
  create: async (payload: TypePayloadProgress) => {
    try {
      // ตรวจสอบว่าเปอร์เซ็นต์ถูกต้อง
      if (payload.percent < 0 || payload.percent > 100) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Percent value must be between 0 and 100",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // ตรวจสอบว่ามี task_id หรือ subtask_id อย่างใดอย่างหนึ่ง
      if (!payload.task_id && !payload.subtask_id) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Either task_id or subtask_id is required",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // ตรวจสอบว่า task มีอยู่จริง
      if (payload.task_id) {
        const task = await TaskRepository.findById(payload.task_id);
        if (!task) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Task not found",
            null,
            StatusCodes.NOT_FOUND
          );
        }
      }

      // ตรวจสอบว่า subtask มีอยู่จริง
      if (payload.subtask_id) {
        const subtask = await SubTaskRepository.findById(payload.subtask_id);
        if (!subtask) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Subtask not found",
            null,
            StatusCodes.NOT_FOUND
          );
        }
      }

      // บันทึกความคืบหน้า
      const progress = await ProgressRepository.create(payload);

      // อัปเดตสถานะของ task หรือ subtask ตามความเหมาะสม
      if (payload.task_id) {
        // ถ้าความคืบหน้า 100% ให้เปลี่ยนสถานะเป็น completed
        if (payload.percent === 100) {
          await TaskRepository.update(payload.task_id, {
            status: "completed",
            updated_by: payload.created_by,
          });
        }
        // ถ้าความคืบหน้ามากกว่า 0% แต่ไม่ถึง 100% ให้เปลี่ยนสถานะเป็น in progress
        else if (payload.percent > 0) {
          await TaskRepository.update(payload.task_id, {
            status: "in progress",
            updated_by: payload.created_by,
          });
        }
      }

      // ทำเช่นเดียวกันกับ subtask
      if (payload.subtask_id) {
        if (payload.percent === 100) {
          await SubTaskRepository.update(payload.subtask_id, {
            status: "completed",
            updated_by: payload.created_by,
          });
        } else if (payload.percent > 0) {
          await SubTaskRepository.update(payload.subtask_id, {
            status: "in progress",
            updated_by: payload.created_by,
          });
        }
      }

      // ถ้าอัปเดต subtask ให้คำนวณความคืบหน้ารวมของ task
      if (payload.subtask_id && !payload.task_id) {
        // ดึงข้อมูล subtask เพื่อหา task_id
        const subtask = await SubTaskRepository.findById(payload.subtask_id);

        if (subtask && subtask.task_id) {
          // ดึงทุก subtasks ของ task นั้น
          const subtasks = await SubTaskRepository.findByTaskId(subtask.task_id);

          // ดึงความคืบหน้าล่าสุดของแต่ละ subtask
          let totalPercent = 0;
          for (const sub of subtasks) {
            // ใช้เปอร์เซ็นต์ที่เพิ่งอัปเดตหากเป็น subtask ที่กำลังทำงานอยู่
            if (sub.subtask_id === payload.subtask_id) {
              totalPercent += payload.percent;
            } else {
              const latestProgress = await ProgressRepository.findLatestBySubtaskId(sub.subtask_id);
              totalPercent += latestProgress ? latestProgress.percent : 0;
            }
          }

          // คำนวณค่าเฉลี่ย
          const averagePercent = Math.round(totalPercent / subtasks.length);

          // บันทึกความคืบหน้ารวมของ task
          await ProgressRepository.create({
            task_id: subtask.task_id,
            percent: averagePercent,
            description: `Auto-updated from subtasks progress`,
            created_by: payload.created_by,
          });

          // อัปเดตสถานะของ task
          if (averagePercent === 100) {
            await TaskRepository.update(subtask.task_id, {
              status: "completed",
              updated_by: payload.created_by,
            });
          } else if (averagePercent > 0) {
            await TaskRepository.update(subtask.task_id, {
              status: "in progress",
              updated_by: payload.created_by,
            });
          }
        }
      }

      return new ServiceResponse(
        ResponseStatus.Success,
        "Progress recorded successfully",
        progress,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error recording progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // อัปเดตความคืบหน้า
  update: async (progress_id: string, payload: Partial<TypePayloadProgress>) => {
    try {
      // ตรวจสอบว่ามีรายการความคืบหน้านี้อยู่จริง
      const existingProgress = await ProgressRepository.findById(progress_id);
      if (!existingProgress) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Progress record not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบค่าเปอร์เซ็นต์
      if (payload.percent !== undefined && (payload.percent < 0 || payload.percent > 100)) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Percent value must be between 0 and 100",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // อัปเดตข้อมูล
      const updatedProgress = await ProgressRepository.update(progress_id, payload);

      return new ServiceResponse<Progress>(
        ResponseStatus.Success,
        "Update progress success",
        updatedProgress,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error updating progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // ลบความคืบหน้า
  delete: async (progress_id: string) => {
    try {
      // ตรวจสอบว่ามีรายการความคืบหน้านี้อยู่จริง
      const existingProgress = await ProgressRepository.findById(progress_id);
      if (!existingProgress) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Progress record not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      await ProgressRepository.delete(progress_id);

      return new ServiceResponse(
        ResponseStatus.Success,
        "Delete progress success",
        null,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error deleting progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // ดึงประวัติความคืบหน้าของ task
  getTaskProgressHistory: async (task_id: string) => {
    try {
      const progressHistory = await ProgressRepository.findByTaskId(task_id);
      return new ServiceResponse(
        ResponseStatus.Success,
        "Task progress history retrieved successfully",
        progressHistory,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error retrieving task progress history: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // ดึงประวัติความคืบหน้าของ subtask
  getSubtaskProgressHistory: async (subtask_id: string) => {
    try {
      const progressHistory = await ProgressRepository.findBySubtaskId(subtask_id);
      return new ServiceResponse(
        ResponseStatus.Success,
        "Subtask progress history retrieved successfully",
        progressHistory,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error retrieving subtask progress history: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  calculateProjectProgress: async (project_id: string) => {
    try {
      // ดึงข้อมูลทั้งหมดที่ต้องใช้ในการคำนวณ
      const tasks = await TaskRepository.findByProjectId(project_id);

      if (!tasks || tasks.length === 0) {
        return new ServiceResponse(
          ResponseStatus.Success,
          "No tasks found for this project",
          { progress: 0 },
          StatusCodes.OK
        );
      }

      let totalProgress = 0;
      let totalDuration = 0;

      for (const task of tasks) {
        if (!task.start_date || !task.end_date) continue;

        // คำนวณระยะเวลาทำงานในวัน
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

        // หาความคืบหน้าของ task จาก subtasks
        const subtasks = await SubTaskRepository.findByTaskId(task.task_id);
        const taskProgress = await calculateTaskProgressFromSubtasks(task.task_id, subtasks);

        // เพิ่มค่าถ่วงน้ำหนักตามระยะเวลา
        totalProgress += durationDays * taskProgress;
        totalDuration += durationDays;
      }

      // คำนวณค่าเฉลี่ยถ่วงน้ำหนัก
      const projectProgress = totalDuration > 0 ? totalProgress / totalDuration : 0;

      return new ServiceResponse(
        ResponseStatus.Success,
        "Project progress calculated successfully",
        { progress: projectProgress },
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error calculating project progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // เพิ่มฟังก์ชันสำหรับดึงข้อมูลความคืบหน้าแบบละเอียด
  getDetailedProjectProgress: async (project_id: string) => {
    try {
      const tasks = await TaskRepository.findByProjectId(project_id);

      if (!tasks || tasks.length === 0) {
        return new ServiceResponse(
          ResponseStatus.Success,
          "No tasks found for this project",
          {
            projectProgress: 0,
            taskProgress: {},
            subtaskProgress: {}
          },
          StatusCodes.OK
        );
      }

      // สร้าง object เก็บความคืบหน้าของ tasks และ subtasks
      const taskProgressMap: Record<string, number> = {};
      const subtaskProgressMap: Record<string, number> = {};

      // ดึงข้อมูลความคืบหน้าของแต่ละ task
      for (const task of tasks) {
        const subtasks = await SubTaskRepository.findByTaskId(task.task_id);

        // เก็บข้อมูล subtask progress
        for (const subtask of subtasks) {
          const progress = await ProgressRepository.findLatestBySubtaskId(subtask.subtask_id);
          subtaskProgressMap[subtask.subtask_id] = progress?.percent || 0;
        }

        // คำนวณและเก็บความคืบหน้าของ task
        taskProgressMap[task.task_id] = await calculateTaskProgressFromSubtasks(task.task_id, subtasks);
      }

      // คำนวณความคืบหน้าของโปรเจค
      const projectProgress = await calculateWeightedProjectProgress(tasks, taskProgressMap);

      return new ServiceResponse(
        ResponseStatus.Success,
        "Detailed project progress retrieved successfully",
        {
          projectProgress,
          taskProgress: taskProgressMap,
          subtaskProgress: subtaskProgressMap
        },
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error retrieving detailed project progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }



};