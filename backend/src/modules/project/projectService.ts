import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { ProjectRepository } from "@modules/project/projectRepository";
import { TypePayloadProject } from "@modules/project/projectModel";
import { project } from "@prisma/client";
import { RelationRepository } from "@modules/relation/relationRepository";
import { UserRepository } from "@modules/user/userRepository";


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

    // เพิ่มฟังก์ชันเพื่อดึงข้อมูลผู้ใช้ทั้งหมดในโปรเจค
    getProjectUsers: async (project_id: string) => {
        try {
            // ตรวจสอบว่าโปรเจคมีอยู่จริง
            const project = await ProjectRepository.findById(project_id);
            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ดึงข้อมูลความสัมพันธ์ทั้งหมดของโปรเจค
            const relations = await RelationRepository.findByProjectId(project_id);

            return new ServiceResponse(
                ResponseStatus.Success,
                "Project users retrieved successfully",
                relations,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error retrieving project users: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // เพิ่มฟังก์ชันเพื่อเพิ่มผู้ใช้เข้าโปรเจค
    addUserToProject: async (project_id: string, user_id: string, requestUserId: string) => {
        try {
            // ตรวจสอบว่าโปรเจคมีอยู่จริง
            const project = await ProjectRepository.findById(project_id);
            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าผู้ใช้มีอยู่จริง
            const user = await UserRepository.findById(user_id);
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าความสัมพันธ์นี้มีอยู่แล้วหรือไม่
            const existingRelation = await RelationRepository.findByProjectAndUser(project_id, user_id);
            if (existingRelation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User is already in this project",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }

            // สร้างความสัมพันธ์ใหม่
            const relation = await RelationRepository.create({
                project_id,
                user_id
            });

            return new ServiceResponse(
                ResponseStatus.Success,
                "User added to project successfully",
                relation,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error adding user to project: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // เพิ่มฟังก์ชันเพื่อลบผู้ใช้ออกจากโปรเจค
    removeUserFromProject: async (project_id: string, user_id: string, requestUserId: string) => {
        try {
            // ตรวจสอบว่าโปรเจคมีอยู่จริง
            const project = await ProjectRepository.findById(project_id);
            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าผู้ใช้มีอยู่จริง
            const user = await UserRepository.findById(user_id);
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าผู้ใช้อยู่ในโปรเจคหรือไม่
            const existingRelation = await RelationRepository.findByProjectAndUser(project_id, user_id);
            if (!existingRelation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User is not in this project",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ลบความสัมพันธ์
            await RelationRepository.deleteByProjectAndUser(project_id, user_id);

            return new ServiceResponse(
                ResponseStatus.Success,
                "User removed from project successfully",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error removing user from project: " + (ex as Error).message,
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

            // ตรวจสอบว่ามี user_id มาหรือไม่
            if (!payload.user_id && payload.created_by) {
                payload.user_id = payload.created_by;
            }

            const project = await ProjectRepository.create(payload);

            // อัปเดต project_id ใน User ถ้ามี user_id
            if (payload.user_id) {
                const prisma = ProjectRepository.getPrismaClient();
                await prisma.user.update({
                    where: { user_id: payload.user_id },
                    data: { project_id: project.project_id }
                });
            }

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

            // ถ้ามีการเปลี่ยนแปลง user_id
            if (payload.user_id && existingProject.user_id !== payload.user_id) {
                const prisma = ProjectRepository.getPrismaClient();

                // อัปเดต project_id ของ user เก่าให้เป็น null (ถ้ามี)
                if (existingProject.user_id) {
                    await prisma.user.updateMany({
                        where: {
                            user_id: existingProject.user_id,
                            project_id: project_id
                        },
                        data: { project_id: null }
                    });
                }

                // อัปเดต project_id ของ user ใหม่
                await prisma.user.update({
                    where: { user_id: payload.user_id },
                    data: { project_id: project_id }
                });
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

    // แก้ไขฟังก์ชัน delete เพื่อลบความสัมพันธ์ทั้งหมดเมื่อลบโปรเจค
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

            // อัปเดต project_id ของ users ที่เกี่ยวข้องเป็น null
            if (existingProject.user_id) {
                const prisma = ProjectRepository.getPrismaClient();
                await prisma.user.updateMany({
                    where: {
                        project_id: project_id
                    },
                    data: { project_id: null }
                });
            }

            // ลบความสัมพันธ์ทั้งหมดของโปรเจค
            await RelationRepository.deleteAllByProject(project_id);

            // ลบโปรเจค
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
            const project = await ProjectRepository.findById(projectId);

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
