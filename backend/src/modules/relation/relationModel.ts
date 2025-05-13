import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ Relation
export type TypePayloadRelation = {
    project_id: string;
    user_id: string;
    created_at?: Date;
};

// Schema สำหรับการสร้าง Relation ใหม่
export const CreateRelationSchema = z.object({
    body: z.object({
        project_id: z.string().uuid(),
        user_id: z.string().uuid(),
    })
});

// Schema สำหรับการค้นหา Relations ตาม Project
export const GetRelationsByProjectSchema = z.object({
    params: z.object({
        project_id: z.string().uuid(),
    })
});

// Schema สำหรับการค้นหา Relations ตาม User
export const GetRelationsByUserSchema = z.object({
    params: z.object({
        user_id: z.string().uuid(),
    })
});

// Schema สำหรับการลบ Relation
export const DeleteRelationSchema = z.object({
    params: z.object({
        relation_id: z.string().uuid(),
    })
});

// Schema สำหรับการลบ Relation โดยระบุ project_id และ user_id
export const DeleteRelationByProjectUserSchema = z.object({
    body: z.object({
        project_id: z.string().uuid(),
        user_id: z.string().uuid(),
    })
});