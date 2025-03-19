// import { StatusCodes } from "http-status-codes";
// import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
// import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
// import { TaskRepository } from "@modules/task/taskRepository";
// import { TypePayloadSubTask } from "@modules/subtask/subtaskModel";
// import { subtask } from "@prisma/client";

// export const subtaskService = {
//   // อ่านข้อมูล subtask ทั้งหมด
//   findAll: async () => {
//     const subtasks = await SubTaskRepository.findAllAsync();
//     return new ServiceResponse(
//       ResponseStatus.Success,
//       "Get all subtasks success",
//       subtasks,
//       StatusCodes.OK
//     );
//   },

//   // สร้าง subtask
//   create: async (payload: TypePayloadSubTask) => {
//     try {
//       // ตรวจสอบว่า Task มีอยู่หรือไม่
//       if (payload.task_id) {
//         const taskExists = await TaskRepository.findById(payload.task_id);
//         if (!taskExists) {
//           return new ServiceResponse(
//             ResponseStatus.Failed,
//             "Task not found",
//             null,
//             StatusCodes.NOT_FOUND
//           );
//         }
//       }

//       const subtask = await SubTaskRepository.create(payload);
//       return new ServiceResponse<subtask>(
//         ResponseStatus.Success,
//         "Create subtask success",
//         subtask,
//         StatusCodes.OK
//       );
//     } catch (ex) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "Error creating subtask: " + (ex as Error).message,
//         null,
//         StatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }
//   },

//   // อัปเดต subtask
//   update: async (subtask_id: string, payload: Partial<TypePayloadSubTask>) => {
//     try {
//       const existingSubTask = await SubTaskRepository.findById(subtask_id);
//       if (!existingSubTask) {
//         return new ServiceResponse(
//           ResponseStatus.Failed,
//           "Not found subtask",
//           null,
//           StatusCodes.NOT_FOUND
//         );
//       }

//       const updatedSubTask = await SubTaskRepository.update(subtask_id, payload);
//       return new ServiceResponse<subtask>(
//         ResponseStatus.Success,
//         "Update subtask success",
//         updatedSubTask,
//         StatusCodes.OK
//       );
//     } catch (ex) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "Error updating subtask: " + (ex as Error).message,
//         null,
//         StatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }
//   },

//   // ลบ subtask
//   delete: async (subtask_id: string) => {
//     try {
//       const existingSubTask = await SubTaskRepository.findById(subtask_id);
//       if (!existingSubTask) {
//         return new ServiceResponse(
//           ResponseStatus.Failed,
//           "Not found subtask",
//           null,
//           StatusCodes.NOT_FOUND
//         );
//       }

//       await SubTaskRepository.delete(subtask_id);
//       return new ServiceResponse(
//         ResponseStatus.Success,
//         "Delete subtask success",
//         null,
//         StatusCodes.OK
//       );
//     } catch (ex) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "Error deleting subtask: " + (ex as Error).message,
//         null,
//         StatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }
//   },
// };

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
        const subtaskStartDate = payload.start_date 
          ? new Date(payload.start_date) 
          : (existingSubTask.start_date ? new Date(existingSubTask.start_date) : null);
          
        const subtaskEndDate = payload.end_date 
          ? new Date(payload.end_date) 
          : (existingSubTask.end_date ? new Date(existingSubTask.end_date) : null);
        
        // ตรวจสอบวันที่เริ่มต้น
        if (subtaskStartDate && parentTask.start_date) {
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
        
        // ตรวจสอบวันที่สิ้นสุด
        if (subtaskEndDate && parentTask.end_date) {
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
        
        // ตรวจสอบความสอดคล้องของวันที่เริ่มต้นและสิ้นสุดของ subtask
        if (subtaskStartDate && subtaskEndDate && subtaskEndDate < subtaskStartDate) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Subtask end date cannot be earlier than start date",
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      const updatedSubTask = await SubTaskRepository.update(subtask_id, payload);
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