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
            // ตรวจสอบว่า Project ID ถูกระบุหรือไม่
            if (!payload.project_id) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project ID is required for creating a task",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }

            // ตรวจสอบว่าโปรเจกต์มีอยู่จริงหรือไม่
            const parentProject = await ProjectRepository.findById(payload.project_id);
            if (!parentProject) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Parent project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่า task dates อยู่ภายในช่วงเวลาของ project
            if (payload.start_date && parentProject.start_date) {
                const taskStartDate = new Date(payload.start_date);
                const projectStartDate = new Date(parentProject.start_date);

                if (taskStartDate < projectStartDate) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Task start date cannot be earlier than the parent project start date",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            if (payload.end_date && parentProject.end_date) {
                const taskEndDate = new Date(payload.end_date);
                const projectEndDate = new Date(parentProject.end_date);

                if (taskEndDate > projectEndDate) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Task end date cannot be later than the parent project end date",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            // ตรวจสอบว่า task end_date ไม่เกิดก่อน start_date
            if (payload.start_date && payload.end_date) {
                const startDate = new Date(payload.start_date);
                const endDate = new Date(payload.end_date);

                if (endDate < startDate) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Task end date cannot be earlier than start date",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            // สร้าง task
            const task = await TaskRepository.create(payload);

            // อัปเดต progress ของ project หลังจากสร้าง task (ถ้ามีฟังก์ชันนี้)
            // ถ้ามีฟังก์ชัน updateProjectProgress เหมือนใน subtask
            // await updateProjectProgress(payload.project_id, payload.created_by || "system");

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
    },

    // อัปเดต start date ของ task
    updateStartDate: async (task_id: string, payload: { start_date: string, updated_by: string }) => {
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

            // ตรวจสอบว่าวันที่ไม่ล้ำกับ end_date
            if (existingTask.end_date) {
                const startDate = new Date(payload.start_date);
                const endDate = new Date(existingTask.end_date);

                if (startDate > endDate) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Start date cannot be later than end date",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            // อัปเดต start date
            const updatedTask = await TaskRepository.update(task_id, {
                start_date: payload.start_date,
                updated_by: payload.updated_by,
                updated_at: new Date().toISOString()
            });

            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update start date success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating start date: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดต end date ของ task
    updateEndDate: async (task_id: string, payload: { end_date: string, updated_by: string }) => {
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

            // ตรวจสอบว่าวันที่ไม่ล้ำกับ start_date
            if (existingTask.start_date) {
                const startDate = new Date(existingTask.start_date);
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

            // อัปเดต end date
            const updatedTask = await TaskRepository.update(task_id, {
                end_date: payload.end_date,
                updated_by: payload.updated_by,
                updated_at: new Date().toISOString()
            });

            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update end date success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating end date: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดตทั้ง start และ end date พร้อมกัน
    updateDates: async (task_id: string, payload: { start_date: string, end_date: string, updated_by: string }) => {
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

            // อัปเดตทั้ง start และ end date
            const updatedTask = await TaskRepository.update(task_id, {
                start_date: payload.start_date,
                end_date: payload.end_date,
                updated_by: payload.updated_by,
                updated_at: new Date().toISOString()
            });

            return new ServiceResponse<task>(
                ResponseStatus.Success,
                "Update dates success",
                updatedTask,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating dates: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};