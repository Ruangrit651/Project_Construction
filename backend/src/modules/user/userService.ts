import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { UserRepository } from "@modules/user/userRepository";
import { TypePayloadUser } from "@modules/user/userModel";
import { ProjectRepository } from "@modules/project/projectRepository";
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

            // ตรวจสอบว่าชื่อผู้ใช้ใหม่ถูกใช้งานแล้วหรือยัง (ตรวจสอบเฉพาะถ้ามีการส่ง username ใหม่มา)
            if (payload.username) {
                const checkUser = await UserRepository.findByUsername(payload.username);
                if (checkUser && checkUser.user_id !== user_id) {  // ตรวจสอบว่าไม่ใช่ user เดียวกัน
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
    

};

//ตรวจสอบฐานข้อมูล และจัดการ Logic