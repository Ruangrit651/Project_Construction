import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ Role
export type TypePayloadRole = {
    name: string;
};

// Schema สำหรับการสร้าง Role ใหม่
export const CreateRoleSchema = z.object({
    body: z.object({
        name: z.string().max(255),
    }),
});

// Schema สำหรับการอัปเดต Role
export const UpdateRoleSchema = z.object({
    body: z.object({
        role_id: z.string().uuid(),
        name: z.string().max(255).optional(),
    }),
});

// Schema สำหรับการลบ Role
export const DeleteRoleSchema = z.object({
    body: z.object({
        role_id: z.string().uuid(),
    }),
});
