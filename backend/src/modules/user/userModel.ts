import { z } from "zod";

// เพิ่ม is_active ในประเภทข้อมูลสำหรับ payload ของ User
export type TypePayloadUser = {
    project_id?: string | null;
    project_name?: string | null; 
    role: string;
    username: string;
    password: string;
    fullname?: string | null;
    is_active?: boolean; // เพิ่มฟิลด์นี้
    created_by?: string;
    updated_by?: string;
};

// เพิ่ม is_active ในสคีมาสำหรับการสร้างและอัปเดต User
export const CreateUserSchema = z.object({
    body: z.object({
        project_id: z.string().uuid().nullable().optional(),
        username: z.string().max(255),
        password: z.string().max(255),
        role: z.string().max(255),
        fullname: z.string().max(255).optional(),
        is_active: z.boolean().optional().default(true), // เพิ่มฟิลด์นี้
        created_by: z.string().uuid().optional(),
        updated_by: z.string().uuid().optional(),
    }),
});

export const UpdateUserSchema = z.object({
    body: z.object({
        user_id: z.string().uuid(),
        project_id: z.string().uuid().nullable().optional(),
        role: z.string().optional(),
        username: z.string().max(255).optional(),
        password: z.string().max(255).optional(),
        fullname: z.string().max(255).optional(),
        is_active: z.boolean().optional(), // เพิ่มฟิลด์นี้
        updated_by: z.string().uuid().optional(),
    }),
});

// เพิ่ม Schema สำหรับการระงับ/คืนสิทธิ์ User
export const ToggleUserStatusSchema = z.object({
    params: z.object({
        user_id: z.string().uuid(),
    }),
    body: z.object({
        is_active: z.boolean(),
        updated_by: z.string().uuid().optional(),
    }),
});

// Schema สำหรับการลบ User
export const DeleteUserSchema = z.object({
    params: z.object({
        user_id: z.string().uuid(),  // รับ UUID ของ user ผ่าน body
    })
});

// Model vaildate Body ตรวจสอบข้อมูลที่รับเข้ามา vaildate Schema,Body