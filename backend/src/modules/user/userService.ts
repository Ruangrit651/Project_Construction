import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { UserRepository } from "@modules/user/userRepository";
import { TypePayloadUser } from "@modules/user/userModel";
import { ProjectRepository } from "@modules/project/projectRepository";
import { RelationRepository } from "@modules/relation/relationRepository";
import { user } from "@prisma/client";
import bcrypt from "bcrypt";

export const userService = {
    // อ่านข้อมูลผู้ใช้ทั้งหมด
    findAll: async () => {
        const users = await UserRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get All success",
            users,
            StatusCodes.OK
        );
    },

    getUserProjects: async (user_id: string) => {
        try {
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

            // ดึงข้อมูลความสัมพันธ์ทั้งหมดของผู้ใช้
            const relations = await RelationRepository.findByUserId(user_id);

            return new ServiceResponse(
                ResponseStatus.Success,
                "User projects retrieved successfully",
                relations,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error retrieving user projects: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    getCurrentUser: async (userId: string) => {
        try {
            // Get user info based on the token's user ID
            const user = await UserRepository.findById(userId);
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            return new ServiceResponse(
                ResponseStatus.Success,
                "Current user retrieved successfully",
                user,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error retrieving current user: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },


    //สร้างผู้ใช้ใหม่
    create: async (payload: TypePayloadUser) => {
        try {
            const checkUser = await UserRepository.findByUsername(payload.username);
            if (checkUser) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Username already taken",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }
            // เข้ารหัสรหัสผ่านก่อนบันทึก
            const hashedPassword = await bcrypt.hash(payload.password, 10);
            const newUser = await UserRepository.create({
                ...payload,
                password: hashedPassword
            });
            return new ServiceResponse<user>(
                ResponseStatus.Success,
                "Create user success",
                newUser,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error create user: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );

        }
    },


    // ปรับปรุงฟังก์ชัน update

    update: async (user_id: string, payload: Partial<TypePayloadUser>) => {
        try {
            // ตรวจสอบว่าผู้ใช้มีอยู่จริง
            const existingUser = await UserRepository.findById(user_id);
            if (!existingUser) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found user",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ถ้ามีการส่ง project_id ใหม่มาตรวจสอบว่าโปรเจกต์มีอยู่จริง
            if (payload.project_id && payload.project_id !== existingUser.project_id) {
                const existingProject = await ProjectRepository.findById(payload.project_id);
                if (!existingProject) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Not found project",
                        null,
                        StatusCodes.NOT_FOUND
                    );
                }

                // อัปเดต user_id ใน project ถ้ามีการเปลี่ยน project_id
                const prisma = ProjectRepository.getPrismaClient();
                await prisma.project.update({
                    where: { project_id: payload.project_id },
                    data: { user_id: user_id }
                });
            } else if (payload.project_id === null && existingUser.project_id) {
                // ถ้า project_id เป็น null และเคยมีค่า ให้อัปเดต user_id ใน project เป็น null ด้วย
                const prisma = ProjectRepository.getPrismaClient();
                await prisma.project.updateMany({
                    where: {
                        project_id: existingUser.project_id,
                        user_id: user_id
                    },
                    data: { user_id: null }
                });
            }

            // ตรวจสอบว่าชื่อผู้ใช้ใหม่ถูกใช้งานแล้วหรือยัง (ตรวจสอบเฉพาะถ้ามีการส่ง username ใหม่มา)
            if (payload.username) {
                const checkUser = await UserRepository.findByUsername(payload.username);
                if (checkUser && checkUser.user_id !== user_id) {
                    return new ServiceResponse(
                        ResponseStatus.Failed,
                        "Username already taken",
                        null,
                        StatusCodes.BAD_REQUEST
                    );
                }
            }

            // ถ้ามีการเปลี่ยนแปลงรหัสผ่าน ให้อัปเดตรหัสผ่านใหม่
            if (payload.password) {
                payload.password = await bcrypt.hash(payload.password, 10);
            }

            // อัปเดตข้อมูลผู้ใช้
            const updatedUser = await UserRepository.update(user_id, payload);
            return new ServiceResponse<user>(
                ResponseStatus.Success,
                "Update user success",
                updatedUser,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error update user: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบผู้ใช้
    delete: async (user_id: string) => {
        try {
            const existingUser = await UserRepository.findById(user_id);
            if (!existingUser) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found user",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ลบความสัมพันธ์ทั้งหมดของผู้ใช้
            await RelationRepository.deleteAllByUser(user_id);

            await UserRepository.delete(user_id);
            return new ServiceResponse<string>(
                ResponseStatus.Success,
                "User found",
                "Delete user success",
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error delete user: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    toggleUserStatus: async (user_id: string, is_active: boolean, updated_by?: string) => {
        try {
            // ตรวจสอบว่าผู้ใช้มีอยู่จริง
            const existingUser = await UserRepository.findById(user_id);
            if (!existingUser) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // เปลี่ยนสถานะผู้ใช้
            const updatedUser = await UserRepository.toggleStatus(user_id, is_active, updated_by);
            const statusMessage = is_active ? "User activated successfully" : "User suspended successfully";

            return new ServiceResponse<user>(
                ResponseStatus.Success,
                statusMessage,
                updatedUser,
                StatusCodes.OK
            );
        } catch (ex) {
            const actionText = is_active ? "activate" : "suspend";
            const errorMessage = `Error ${actionText} user: ${(ex as Error).message}`;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },


};

//ตรวจสอบฐานข้อมูล และจัดการ Logic