import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { TaskRepository } from "@modules/task/taskRepository";
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
            const existingTask = await TaskRepository.findById(task_id); // ต้องเพิ่ม findById ใน TaskRepository
            if (!existingTask) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found task",
                    null,
                    StatusCodes.NOT_FOUND
                );
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

    // ลบ task
    delete: async (task_id: string) => {
        try {
            // ตรวจสอบว่า Task มีอยู่หรือไม่
            const existingTask = await TaskRepository.findById(task_id); // ต้องเพิ่ม findById ใน TaskRepository
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
