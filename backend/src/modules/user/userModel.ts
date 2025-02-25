import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ User
export type TypePayloadUser = {
    project_id?: string | null; // UUID, optional
    project_name?: string | null; 
    role: string;    
    username: string;    // ชื่อผู้ใช้ที่ต้องการ
    password: string;    // รหัสผ่าน
    created_by?: string; // UUID, optional
    updated_by?: string; // UUID, optional
};

// Schema สำหรับการสร้าง User ใหม่
export const CreateUserSchema = z.object({
    body: z.object({
        project_id: z.string().uuid().nullable().optional(),
        username: z.string().max(255),
        password: z.string().max(255),
        role: z.string().max(255),
        created_by: z.string().uuid().optional(),
        updated_by: z.string().uuid().optional(),
    }),
});

// Schema สำหรับการอัปเดต User
export const UpdateUserSchema = z.object({
    body: z.object({
        user_id: z.string().uuid(), // ต้องระบุ user_id เพื่อทำการอัปเดต
        project_id: z.string().uuid() .nullable() .optional(),
        role: z.string().optional(),
        username: z.string().max(255).optional(), // ถ้าไม่ต้องการให้เป็น required
        password: z.string().max(255).optional(), // ถ้ารหัสผ่านไม่ถูกส่งมา จะไม่ทำการอัปเดต
        updated_by: z.string().uuid().optional(), // ต้องระบุ updated_by เพื่อบันทึกว่าใครแก้ไข
    }),
});

// Schema สำหรับการลบ User
export const DeleteUserSchema = z.object({
    params: z.object({
        user_id: z.string().uuid(),  // รับ UUID ของ user ผ่าน body
    })
});

// Model vaildate Body ตรวจสอบข้อมูลที่รับเข้ามา vaildate Schema,Body