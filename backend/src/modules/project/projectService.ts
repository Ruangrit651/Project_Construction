import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { ProjectRepository } from "@modules/project/projectRepository";
import { TypePayloadProject } from "@modules/project/projectModel";
import { project } from "@prisma/client";


export const projectService = {
    // อ่านข้อมูลโปรเจกต์ทั้งหมด
    findAll: async () => {
        const project = await ProjectRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get All success",
            project,
            StatusCodes.OK
        );
    },

    findByManagerId: async (managerId: string) => {
        try {
            const projects = await ProjectRepository.findByManagerId(managerId);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Projects retrieved successfully",
                projects,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error retrieving manager projects: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // สร้างโปรเจกต์ใหม่
    create: async (payload: TypePayloadProject) => {
        try {
            const checkProject = await ProjectRepository.findByName(payload.project_name);
            if (checkProject) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project already taken",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }
            const project = await ProjectRepository.create(payload);
            return new ServiceResponse<project>(
                ResponseStatus.Success,
                "Create project success",
                project,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error create project :" + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดตโปรเจกต์
    update: async (project_id: string, payload: Partial<TypePayloadProject>) => {
        try {
            // ตรวจสอบว่าโปรเจกต์มีอยู่จริง
            const existingProject = await ProjectRepository.findById(project_id);
            if (!existingProject) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found project",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าชื่อโปรเจกต์ซ้ำหรือไม่
            if (payload.project_name) {
                const checkProject = await ProjectRepository.findByName(payload.project_name);
                if (checkProject && checkProject.project_id !== project_id) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Project name already taken",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            const updatedProject = await ProjectRepository.update(project_id, payload);
            return new ServiceResponse<project>(
                ResponseStatus.Success,
                "Update project success",
                updatedProject,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error update project :" + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบโปรเจกต์
    delete: async (project_id: string) => {
        try {
            // ตรวจสอบว่าโปรเจกต์มีอยู่จริง
            const existingProject = await ProjectRepository.findById(project_id);
            if (!existingProject) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found project",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await ProjectRepository.delete(project_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete project success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error delete project :" + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    checkManagerOwnership: async (projectId: string, managerId: string) => {
        try {
            const project = await projectRepository.findById(projectId);

            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "ไม่พบโปรเจกต์",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            if (project.created_by !== managerId) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "คุณไม่ใช่เจ้าของโปรเจกต์นี้",
                    null,
                    StatusCodes.FORBIDDEN
                );
            }

            return new ServiceResponse(
                ResponseStatus.Success,
                "ตรวจสอบสิทธิ์สำเร็จ",
                true,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },
};
