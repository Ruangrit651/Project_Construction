import { user } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { UserRepository } from "@modules/user/userRepository";
import { TypePayloadUser } from "@modules/auth/authModel";
import bcrypt from "bcrypt";
import { generateAccessToken } from "@common/utils/jwt";

export const authService = {

    // login a user
    login: async (payload: TypePayloadUser, res: any) => {
        try {
            const checkUser = await UserRepository.findByUsername(payload.username);
            if (!checkUser) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Incorrect Username",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบสถานะการระงับใช้งานของผู้ใช้
            if (checkUser.is_active === false) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Your account has been suspended. Please contact administrator.",
                    null,
                    StatusCodes.FORBIDDEN
                );
            }

            // ตรวจสอบรหัสผ่านโดยใช้ bcrypt.compare
            const isPasswordValid = await bcrypt.compare(payload.password, checkUser.password);

            if (!isPasswordValid) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Incorrect password",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }


            const accessToken = generateAccessToken(checkUser.user_id, checkUser.role);
            // ตั้งค่า HTTP-Only Cookie
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // ใช้ HTTPS ใน production
                sameSite: 'strict',

            });


            return new ServiceResponse<user>(
                ResponseStatus.Success,
                "Login success",
                checkUser,
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

    // logout a user
    logout: async (res: any) => {
        try {
            res.clearCookie("token", { //ล้างค่า Cookie ที่ชื่อ token ออกไป , ลบค่า Cookie ที่ชื่อ token ออกไป
                httpOnly: true, // ไม่สามารถเข้าถึงค่า Cookie จาก JavaScript ได้ หรือ เพื่อป้องกันการเข้าถึง Cookie จาก JavaScript โดยตรง
                secure: process.env.NODE_ENV === "production", // ใช้ HTTPS ใน production เท่านั้น หรือ ใช้งานใน localhost ได้
                sameSite: "strict",
            });

            return new ServiceResponse(
                ResponseStatus.Success,      // แจ้งว่าออกจากระบบสำเร็จ
                "Logout successful",         // ข้อความบอกผู้ใช้
                null,                        // ไม่มีข้อมูลพิเศษอื่นๆ ส่งกลับไป
                StatusCodes.OK               // รหัส HTTP 200 (OK)
            );

        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,      // แจ้งว่าสถานะล้มเหลว
                "Error during logout: " + (ex as Error).message,  // ข้อความอธิบายข้อผิดพลาด
                null,
                StatusCodes.INTERNAL_SERVER_ERROR  // รหัส HTTP 500 (เกิดปัญหาภายในเซิร์ฟเวอร์)
            );
        }
    },

    verifyToken: async (user: any, res: any): Promise<ServiceResponse<any>> => {
        // Verify token implementation
        try {
            // ตรวจสอบว่า user มีข้อมูลหรือไม่
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Invalid token",
                    null,
                    StatusCodes.UNAUTHORIZED
                );
            }

            // ส่งข้อมูลผู้ใช้กลับไป
            return new ServiceResponse(
                ResponseStatus.Success,
                "Token is valid",
                user,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error verifying token: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

};

//ตรวจสอบฐานข้อมูล และจัดการ Logic