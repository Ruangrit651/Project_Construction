import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของทรัพยากร
export type TypePayloadResource = {
    task_id: string;
    subtask_id?: string; // Optional subtask_id
    resource_name: string;
    resource_type: string;
    cost: number;
    total: number;
    quantity: number;
    created_at?:string;
    created_by?: string;
    updated_at?:string;
    updated_by?: string;
};

// Schema สำหรับการสร้างทรัพยากรใหม่
export const CreateResourceSchema = z.object({
    body: z.object({
        task_id: z.string().uuid(),
        subtask_id: z.string().uuid().optional(), // Optional subtask_id
        resource_name: z.string().max(255),
        resource_type: z.string().max(255),
        cost: z.number().min(0),
        total: z.number().min(0),
        quantity: z.number().min(0),
        created_at: z.string().optional(),
        created_by: z.string().optional(),
        updated_at: z.string().optional(),
        updated_by: z.string().optional(),
    }),
});

// Schema สำหรับการอัปเดตทรัพยากร
export const UpdateResourceSchema = z.object({
    body: z.object({
        resource_id: z.string().uuid(),
        resource_name: z.string().max(255).optional(),
        resource_type: z.string().max(255).optional(),
        cost: z.number().min(0).optional(),
        total: z.number().min(0).optional(),
        quantity: z.number().min(0).optional(),
        task_id: z.string().uuid().optional(),
        subtask_id: z.string().uuid().optional(), // Optional subtask_id
        updated_at: z.string().optional(),
        updated_by: z.string().optional(),  // ต้องมี updated_by เพื่อบันทึกว่าใครแก้ไข
    }),
});

// Schema สำหรับการลบทรัพยากร
export const DeleteResourceSchema = z.object({
    params: z.object({
        resource_id: z.string().uuid(),
    }),
});