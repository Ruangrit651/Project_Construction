import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของงาน (Task)
export type TypePayloadTask = {
  project_id?: string | null;
  task_name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status: boolean;
  // created_at?: string;
  // created_by?: string;
  // updated_at?: string;
  // updated_by?: string;
};

// Schema สำหรับการสร้าง Task ใหม่
export const CreateTaskSchema = z.object({
  body: z.object({
    project_id: z.string().uuid().nullable().optional(),
    task_name: z.string().max(255),
    description: z.string().optional(),
    budget: z.number(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.boolean().optional(),
    // created_at: z.string().optional(),
    // created_by: z.string().optional(),
    // updated_at: z.string().optional(),
    // updated_by: z.string().optional(),
  }),
});

// Schema สำหรับการอัปเดต Task
export const UpdateTaskSchema = z.object({
  body: z.object({
    task_id: z.string().uuid(), // ต้องระบุ task_id เพื่อทำการอัปเดต
    project_id: z.string().uuid() .nullable() .optional(),
    task_name: z.string().max(255).optional(),
    description: z.string().optional(),
    budget: z.number().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.boolean().optional(),
    //updated_at: z.string().optional(),
    //updated_by: z.string().optional(), // ต้องมี updated_by เพื่อบันทึกว่าใครแก้ไข
  }),
});

// Schema สำหรับการลบ Task
export const DeleteTaskSchema = z.object({
  body: z.object({
    task_id: z.string().uuid(),  // รับ UUID ของ task ผ่าน body
  }),
});
