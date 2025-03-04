// import { StatusCodes } from "http-status-codes";
// import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
// import { TypePayloadSubTask } from "@modules/subtask/subtaskModel";
// import { ServiceResponse, ResponseStatus } from "@common/models/serviceResponse";
// import { Decimal } from "@prisma/client/runtime/library";

// export const subtaskService = {
//   findAll: async () => {
//     const subtasks = await SubTaskRepository.findAllAsync();
//     return new ServiceResponse(
//       ResponseStatus.Success,
//       "Get All SubTasks Success",
//       subtasks,
//       StatusCodes.OK
//     );
//   },

// //   create: async (payload: TypePayloadSubTask) => {
// //     try {
// //       const subtask = await SubTaskRepository.create(payload);
// //       return new ServiceResponse(
// //         ResponseStatus.Success,
// //         "Create SubTask Success",
// //         subtask,
// //         StatusCodes.OK
// //       );
// //     } catch (ex) {
// //       return new ServiceResponse(
// //         ResponseStatus.Failed,
// //         "Error Creating SubTask: " + (ex as Error).message,
// //         null,
// //         StatusCodes.INTERNAL_SERVER_ERROR
// //       );
// //     }
// //   },
// create: async (payload: TypePayloadSubTask) => {
//     try {
//       if (!prisma) {
//         throw new Error("Prisma client is not initialized");
//       }
  
//       const task = await prisma.task.findUnique({
//         where: { task_id: payload.task_id ?? undefined },
//         select: { budget: true },
//       });
  
//       if (task && payload.budget! > (task.budget as Decimal).toNumber()) {
//         return new ServiceResponse(
//           ResponseStatus.Failed,
//           "SubTask Budget มากกว่า Task Budget",
//           null,
//           StatusCodes.BAD_REQUEST
//         );
//       }
  
//       const subtask = await SubTaskRepository.create(payload);
//       return new ServiceResponse(
//         ResponseStatus.Success,
//         "Create SubTask Success",
//         subtask,
//         StatusCodes.OK
//       );
//     } catch (ex) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "Error Creating SubTask: " + (ex as Error).message,
//         null,
//         StatusCodes.INTERNAL_SERVER_ERROR
//       );
//     }
//   },

//   update: async (subtask_id: string, payload: Partial<TypePayloadSubTask>) => {
//     const subtask = await SubTaskRepository.findById(subtask_id);
//     if (!subtask) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "SubTask Not Found",
//         null,
//         StatusCodes.NOT_FOUND
//       );
//     }

//     const updatedSubTask = await SubTaskRepository.update(subtask_id, payload);
//     return new ServiceResponse(
//       ResponseStatus.Success,
//       "Update SubTask Success",
//       updatedSubTask,
//       StatusCodes.OK
//     );
//   },

//   delete: async (subtask_id: string) => {
//     const subtask = await SubTaskRepository.findById(subtask_id);
//     if (!subtask) {
//       return new ServiceResponse(
//         ResponseStatus.Failed,
//         "SubTask Not Found",
//         null,
//         StatusCodes.NOT_FOUND
//       );
//     }

//     await SubTaskRepository.delete(subtask_id);
//     return new ServiceResponse(
//       ResponseStatus.Success,
//       "Delete SubTask Success",
//       null,
//       StatusCodes.OK
//     );
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
      if (payload.task_id) {
        const taskExists = await TaskRepository.findById(payload.task_id);
        if (!taskExists) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            "Task not found",
            null,
            StatusCodes.NOT_FOUND
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
