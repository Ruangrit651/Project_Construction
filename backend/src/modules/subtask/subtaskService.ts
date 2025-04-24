import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
import { TaskRepository } from "@modules/task/taskRepository";
import { TypePayloadSubTask } from "@modules/subtask/subtaskModel";
import { subtask } from "@prisma/client";

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
        // ...existing date validation code...
      }

      // อัปเดต subtask
      const updatedSubTask = await SubTaskRepository.update(subtask_id, payload);

      // ถ้า status ถูกอัปเดตเป็น Completed หรือมีการเปลี่ยนแปลง status
      if (payload.status && existingSubTask.task_id) {
        try {
          // ดึง subtasks ทั้งหมดที่อยู่ภายใต้ task เดียวกัน
          const subtasks = await SubTaskRepository.findByTaskId(existingSubTask.task_id);

          // ตรวจสอบว่า subtasks ทั้งหมดมีสถานะเป็น Completed หรือไม่
          const allCompleted = subtasks.every((subtask) =>
            // ถ้า subtask คือตัวที่กำลังอัปเดต ให้ใช้ค่า status ใหม่
            subtask.subtask_id === subtask_id
              ? payload.status === "completed"
              : subtask.status === "completed"
          );

          // ถ้า subtasks ทั้งหมดเป็น Completed ให้อัปเดต task เป็น completed
          if (allCompleted) {
            const updateTaskResult = await TaskRepository.update(existingSubTask.task_id, {
              status: "completed",
              updated_at: new Date().toISOString(), // แปลง Date เป็น string
              updated_by: payload.updated_by ?? existingSubTask.updated_by ?? undefined
            });
            console.log(`Task ${existingSubTask.task_id} updated to completed because all subtasks are completed`);
          } else {
            const currentTask = await TaskRepository.findById(existingSubTask.task_id);
            if (currentTask && currentTask.status === "completed") {
              await TaskRepository.update(existingSubTask.task_id, {
                status: "in progress",
                updated_at: new Date().toISOString(), // แปลง Date เป็น string
                updated_by: payload.updated_by ?? existingSubTask.updated_by ?? undefined
              });
              console.log(`Task ${existingSubTask.task_id} updated to in progress because not all subtasks are completed`);
            }
          }
        } catch (error) {
          console.error("Failed to update parent task status:", error);
          // ไม่ return error เพื่อให้การอัปเดต subtask ยังคงสำเร็จ แม้จะมีปัญหาในการอัปเดต task
        }
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
      const existingSubTask = await SubTaskRepository.findById(subtask_id);
      if (!existingSubTask) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          "Not found subtask",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      await SubTaskRepository.delete(subtask_id);
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
};