import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
import { TaskRepository } from "@modules/task/taskRepository";
import { TypePayloadSubTask } from "@modules/subtask/subtaskModel";
import { subtask } from "@prisma/client";
import { ProgressRepository } from "@modules/progress/progressRepository";

// เพิ่มฟังก์ชันสำหรับคำนวณและอัปเดต progress ของ task จาก subtasks
async function updateTaskProgress(task_id: string, updater_id: string) {
  try {
    // ดึง subtasks ทั้งหมดของ task
    const subtasks = await SubTaskRepository.findByTaskId(task_id);
    
    // ถ้าไม่มี subtasks ไม่ต้องทำอะไร
    if (!subtasks || subtasks.length === 0) {
      return;
    }
    
    // คำนวณความคืบหน้าเฉลี่ยจาก subtasks
    let totalProgress = 0;
    
    for (const subtask of subtasks) {
      // ดึง progress ล่าสุดของแต่ละ subtask
      const latestProgress = await ProgressRepository.findLatestBySubtaskId(subtask.subtask_id);
      
      // ถ้ามี progress ให้นำค่าไปรวม
      if (latestProgress) {
        totalProgress += latestProgress.percent;
      }
    }
    
    // คำนวณค่าเฉลี่ย
    const averageProgress = Math.round(totalProgress / subtasks.length);
    
    // บันทึก progress ใหม่ของ task
    await ProgressRepository.create({
      task_id,
      percent: averageProgress,
      description: `Auto-calculated from subtasks (average ${averageProgress}%)`,
      created_by: updater_id,
      updated_by: updater_id
    });
    
    // อัปเดตสถานะของ task ตามความคืบหน้า
    if (averageProgress === 100) {
      await TaskRepository.update(task_id, {
        status: "completed",
        updated_by: updater_id
      });
    } else if (averageProgress > 0) {
      await TaskRepository.update(task_id, {
        status: "in progress", 
        updated_by: updater_id
      });
    }
    
    console.log(`Updated task ${task_id} progress to ${averageProgress}%`);
  } catch (error) {
    console.error("Error updating task progress:", error);
  }
}

export const subtaskService = {
  // อ่านข้อมูล subtask ทั้งหมด
  findAll: async () => {
    const subtasks = await SubTaskRepository.findAllAsync();
    return new ServiceResponse(
      ResponseStatus.Success,
      "Get all subtasks success",
      subtasks,
      StatusCodes.OK
    );
  },

  // สร้าง subtask
  create: async (payload: TypePayloadSubTask) => {
    try {
      // ตรวจสอบว่า Task มีอยู่หรือไม่
      if (!payload.task_id) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Task ID is required for creating a subtask",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const parentTask = await TaskRepository.findById(payload.task_id);
      if (!parentTask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Parent task not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบว่า subtask dates อยู่ภายในช่วงเวลาของ parent task
      if (payload.start_date && parentTask.start_date) {
        const subtaskStartDate = new Date(payload.start_date);
        const taskStartDate = new Date(parentTask.start_date);

        if (subtaskStartDate < taskStartDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Subtask start date cannot be earlier than the parent task start date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      if (payload.end_date && parentTask.end_date) {
        const subtaskEndDate = new Date(payload.end_date);
        const taskEndDate = new Date(parentTask.end_date);

        if (subtaskEndDate > taskEndDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Subtask end date cannot be later than the parent task end date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // ตรวจสอบว่า subtask end_date ไม่เกิดก่อน start_date
      if (payload.start_date && payload.end_date) {
        const startDate = new Date(payload.start_date);
        const endDate = new Date(payload.end_date);

        if (endDate < startDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Subtask end date cannot be earlier than start date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      const subtask = await SubTaskRepository.create(payload);
      
      // สร้าง progress เริ่มต้นที่ 0% สำหรับ subtask
      await ProgressRepository.create({
        subtask_id: subtask.subtask_id,
        percent: 0,
        description: "Initial progress",
        created_by: payload.created_by || "system",
        updated_by: payload.updated_by || "system"
      });
      
      // หลังจากสร้าง subtask แล้ว ให้อัปเดต progress ของ task แม่
      await updateTaskProgress(payload.task_id, payload.created_by || "system");
      
      return new ServiceResponse<subtask>(
        ResponseStatus.Success,
        "Create subtask success",
        subtask,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error creating subtask: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // อัปเดต subtask
  update: async (subtask_id: string, payload: Partial<TypePayloadSubTask>) => {
    try {
      const existingSubTask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubTask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // จัดเก็บ task_id ของ subtask ก่อนจะอัปเดต
      const taskId = existingSubTask.task_id;

      // ตรวจสอบ task_id ถ้ามีการอัปเดต
      let parentTask;
      if (payload.task_id) {
        parentTask = await TaskRepository.findById(payload.task_id);
        if (!parentTask) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Parent task not found",
            null,
            StatusCodes.NOT_FOUND
          );
        }
      } else if (existingSubTask.task_id) {
        // ถ้าไม่มีการอัปเดต task_id ให้ใช้ task_id เดิม
        parentTask = await TaskRepository.findById(existingSubTask.task_id);
      }

      // ตรวจสอบว่า subtask dates อยู่ภายในช่วงเวลาของ parent task
      if (parentTask) {
        // ตรวจสอบวันที่ต่างๆ...
      }

      // อัปเดต subtask
      const updatedSubTask = await SubTaskRepository.update(subtask_id, payload);

      // ถ้า status ถูกอัปเดตเป็น "completed"
      if (payload.status === "completed") {
        // บันทึก progress 100%
        await ProgressRepository.create({
          subtask_id: subtask_id,
          percent: 100,
          description: "Completed subtask",
          created_by: payload.updated_by || "system",
          updated_by: payload.updated_by || "system"
        });
      } 
      // ถ้า status ถูกอัปเดตเป็น "in progress"
      else if (payload.status === "in progress") {
        // ดึง progress ล่าสุดของ subtask
        const latestProgress = await ProgressRepository.findLatestBySubtaskId(subtask_id);
        
        // ถ้าไม่มี progress หรือ progress เป็น 0 หรือ 100 ให้สร้าง progress 50%
        if (!latestProgress || latestProgress.percent === 0 || latestProgress.percent === 100) {
          await ProgressRepository.create({
            subtask_id: subtask_id,
            percent: 50,  // สมมติให้เป็น 50% เมื่อเปลี่ยนเป็น "in progress"
            description: "In progress status update",
            created_by: payload.updated_by || "system",
            updated_by: payload.updated_by || "system"
          });
        }
      }

      // อัปเดต progress ของ task แม่ (ถ้ามี)
      if (taskId) {
        await updateTaskProgress(taskId, payload.updated_by || "system");
      }

      return new ServiceResponse<subtask>(
        ResponseStatus.Success,
        "Update subtask success",
        updatedSubTask,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error updating subtask: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // ลบ subtask
  delete: async (subtask_id: string) => {
    try {
      // ตรวจสอบว่า Subtask มีอยู่หรือไม่
      const existingSubtask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubtask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // จัดเก็บ task_id ของ subtask ก่อนจะลบ
      const taskId = existingSubtask.task_id;

      // ลบ subtask
      await SubTaskRepository.delete(subtask_id);

      // อัปเดต progress ของ task แม่ (ถ้ามี)
      if (taskId) {
        await updateTaskProgress(taskId, "system");
      }

      return new ServiceResponse(
        ResponseStatus.Success,
        "Delete subtask success",
        null,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error deleting subtask: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
  
  // เพิ่มเมธอดสำหรับบันทึกความคืบหน้าของ Subtask
  recordProgress: async (subtask_id: string, percent: number, description?: string, updated_by?: string) => {
    try {
      // ตรวจสอบว่า Subtask มีอยู่หรือไม่
      const existingSubtask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubtask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบค่า percent
      if (percent < 0 || percent > 100) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Percent value must be between 0 and 100",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // บันทึก progress
      const progress = await ProgressRepository.create({
        subtask_id,
        percent,
        description: description || `Updated progress to ${percent}%`,
        created_by: updated_by || "system",
        updated_by: updated_by || "system"
      });

      // อัปเดตสถานะของ subtask
      let status = existingSubtask.status;
      if (percent === 100) {
        status = "completed";
      } else if (percent > 0) {
        status = "in progress";
      } else {
        status = "pending";
      }

      await SubTaskRepository.update(subtask_id, {
        status,
        updated_by
      });

      // อัปเดต progress ของ task แม่ (ถ้ามี)
      if (existingSubtask.task_id) {
        await updateTaskProgress(existingSubtask.task_id, updated_by || "system");
      }

      return new ServiceResponse(
        ResponseStatus.Success,
        "Record subtask progress success",
        progress,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error recording subtask progress: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // อัปเดต start date ของ subtask
  updateStartDate: async (subtask_id: string, payload: { start_date: string, updated_by: string }) => {
    try {
      // ตรวจสอบว่า Subtask มีอยู่หรือไม่
      const existingSubtask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubtask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบว่าวันที่ไม่ล้ำกับ end_date
      if (existingSubtask.end_date) {
        const startDate = new Date(payload.start_date);
        const endDate = new Date(existingSubtask.end_date);

        if (startDate > endDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Start date cannot be later than end date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // ตรวจสอบ task_id ถ้ามี
      if (existingSubtask.task_id) {
        const parentTask = await TaskRepository.findById(existingSubtask.task_id);
        if (parentTask && parentTask.start_date) {
          const subtaskStartDate = new Date(payload.start_date);
          const taskStartDate = new Date(parentTask.start_date);

          if (subtaskStartDate < taskStartDate) {
            return new ServiceResponse(
              ResponseStatus.Failed,
              "Subtask start date cannot be earlier than the parent task start date",
              null,
              StatusCodes.BAD_REQUEST
            );
          }
        }
      }

      // อัปเดต start date
      const updatedSubtask = await SubTaskRepository.update(subtask_id, {
        start_date: payload.start_date,
        updated_by: payload.updated_by
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        "Update subtask start date success",
        updatedSubtask,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error updating subtask start date: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // อัปเดต end date ของ subtask
  updateEndDate: async (subtask_id: string, payload: { end_date: string, updated_by: string }) => {
    try {
      // ตรวจสอบว่า Subtask มีอยู่หรือไม่
      const existingSubtask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubtask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบว่าวันที่ไม่ล้ำกับ start_date
      if (existingSubtask.start_date) {
        const startDate = new Date(existingSubtask.start_date);
        const endDate = new Date(payload.end_date);

        if (endDate < startDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "End date cannot be earlier than start date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // ตรวจสอบ task_id ถ้ามี
      if (existingSubtask.task_id) {
        const parentTask = await TaskRepository.findById(existingSubtask.task_id);
        if (parentTask && parentTask.end_date) {
          const subtaskEndDate = new Date(payload.end_date);
          const taskEndDate = new Date(parentTask.end_date);

          if (subtaskEndDate > taskEndDate) {
            return new ServiceResponse(
              ResponseStatus.Failed,
              "Subtask end date cannot be later than the parent task end date",
              null,
              StatusCodes.BAD_REQUEST
            );
          }
        }
      }

      // อัปเดต end date
      const updatedSubtask = await SubTaskRepository.update(subtask_id, {
        end_date: payload.end_date,
        updated_by: payload.updated_by
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        "Update subtask end date success",
        updatedSubtask,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error updating subtask end date: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  // อัปเดตทั้ง start และ end date พร้อมกัน
  updateDates: async (subtask_id: string, payload: { start_date: string, end_date: string, updated_by: string }) => {
    try {
      // ตรวจสอบว่า Subtask มีอยู่หรือไม่
      const existingSubtask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubtask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // ตรวจสอบว่าวันที่ไม่ล้ำกัน
      const startDate = new Date(payload.start_date);
      const endDate = new Date(payload.end_date);

      if (endDate < startDate) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "End date cannot be earlier than start date",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // ตรวจสอบว่าอยู่ในช่วงของ task หลัก (ถ้ามี)
      if (existingSubtask.task_id) {
        const parentTask = await TaskRepository.findById(existingSubtask.task_id);
        if (parentTask) {
          // ตรวจสอบว่า start_date ไม่น้อยกว่า start_date ของ task
          if (parentTask.start_date) {
            const taskStartDate = new Date(parentTask.start_date);
            if (startDate < taskStartDate) {
              return new ServiceResponse(
                ResponseStatus.Failed,
                "Subtask start date cannot be earlier than the parent task start date",
                null,
                StatusCodes.BAD_REQUEST
              );
            }
          }

          // ตรวจสอบว่า end_date ไม่มากกว่า end_date ของ task
          if (parentTask.end_date) {
            const taskEndDate = new Date(parentTask.end_date);
            if (endDate > taskEndDate) {
              return new ServiceResponse(
                ResponseStatus.Failed,
                "Subtask end date cannot be later than the parent task end date",
                null,
                StatusCodes.BAD_REQUEST
              );
            }
          }
        }
      }

      // อัปเดตทั้ง start และ end date
      const updatedSubtask = await SubTaskRepository.update(subtask_id, {
        start_date: payload.start_date,
        end_date: payload.end_date,
        updated_by: payload.updated_by
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        "Update subtask dates success",
        updatedSubtask,
        StatusCodes.OK
      );
    } catch (ex) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        "Error updating subtask dates: " + (ex as Error).message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
};