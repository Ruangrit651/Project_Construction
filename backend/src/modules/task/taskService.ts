import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { TaskRepository } from "@modules/task/taskRepository";
import { SubTaskRepository } from "@modules/subtask/subtaskRepository";
import { TypePayloadTask } from "@modules/task/taskModel";
import { ProjectRepository } from "@modules/project/projectRepository";
import { task } from "@prisma/client";

export const taskService = {
    // อ่านข้อมูล task ทั้งหมด
    findAll: async () => {
        const tasks = await TaskRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get All tasks success",
            tasks,
            StatusCodes.OK
        );
    },

    create: async (payload: TypePayloadTask) => {
        try {
            // ตรวจสอบว่าโปรเจกต์มีอยู่หรือไม่
            if (payload.project_id) {
                const projectExists = await ProjectRepository.findById(payload.project_id);
                if (!projectExists) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Project not found",
                        null,
                        StatusCodes.NOT_FOUND
                    );
                }
            }

            const task = await TaskRepository.create(payload);
            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Create task success",
                task,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error creating task: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดต task
    update: async (task_id: string, payload: Partial<TypePayloadTask>) => {
        // ถ้ามีการส่ง project_id ใหม่มาตรวจสอบว่าโปรเจกต์มีอยู่จริง
        if (payload.project_id) {
            const existingProject = await ProjectRepository.findById(payload.project_id);
            if (!existingProject) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found project",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }
        }
    
        try {
            // ตรวจสอบว่า Task มีอยู่หรือไม่
            const existingTask = await TaskRepository.findById(task_id);
            if (!existingTask) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found task",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }
    
            // ถ้าสถานะของ Task เปลี่ยนเป็น Completed
            if (payload.status === "completed") {
                try {
                    const updateResult = await SubTaskRepository.updateManyByTaskId(task_id, { status: "completed" });
    
                    // ตรวจสอบว่ามี Subtask ที่ถูกอัปเดตหรือไม่
                    if (updateResult.count === 0) {
                        console.warn(`No subtasks found for task_id: ${task_id}`);
                    }
                } catch (error) {
                    console.error("Failed to update subtasks:", error);
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Failed to update subtasks to completed",
                        null,
                        StatusCodes.INTERNAL_SERVER_ERROR
                    );
                }
            }
    
            // ถ้า Task มีอยู่ ทำการอัปเดต
            const updatedTask = await TaskRepository.update(task_id, payload);
            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update task success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating task: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดตวันที่เริ่มต้น
    updateStartDate: async (task_id: string, payload: { start_date: string, updated_by: string }) => {
        try {
            // Check if the task exists
            const existingTask = await TaskRepository.findById(task_id);
            if (!existingTask) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found task",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // Update the start date
            const updatedTask = await TaskRepository.updateStartDate(task_id, payload.start_date, payload.updated_by);
            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update task start date success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating task start date: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดตวันที่สิ้นสุด
    updateEndDate: async (task_id: string, payload: { end_date: string, updated_by: string }) => {
        try {
            // Check if the task exists
            const existingTask = await TaskRepository.findById(task_id);
            if (!existingTask) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found task",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // Update the end date
            const updatedTask = await TaskRepository.updateEndDate(task_id, payload.end_date, payload.updated_by);
            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update task end date success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating task end date: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    findByProjectId: async (projectId: string) => {
        try {
          const tasks = await TaskRepository.findByProjectId(projectId);
          return new ServiceResponse(
            ResponseStatus.Success, 
            "Tasks retrieved successfully", 
            tasks, 
            StatusCodes.OK
          );
        } catch (ex) {
          return new ServiceResponse(
            ResponseStatus.Failed, 
            "Error retrieving tasks: " + (ex as Error).message, 
            null, 
            StatusCodes.INTERNAL_SERVER_ERROR
          );
        }
      },

    // ลบ task
    delete: async (task_id: string) => {
        try {
            // ตรวจสอบว่า Task มีอยู่หรือไม่
            const existingTask = await TaskRepository.findById(task_id);
            console.log("Checking Task:", task_id, "Exists:", existingTask);

            if (!existingTask) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found task",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await TaskRepository.delete(task_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete task success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error deleting task: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};