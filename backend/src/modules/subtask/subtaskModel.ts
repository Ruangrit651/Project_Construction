import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ SubTask
export type TypePayloadSubTask = {
  task_id?: string | null;
  subtask_name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status: string;
};

// Schema สำหรับการสร้าง SubTask
export const CreateSubTaskSchema = z.object({
  body: z.object({
    task_id: z.string().uuid().nullable().optional(),
    subtask_name: z.string().max(255),
    description: z.string().optional(),
    budget: z.number(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Schema สำหรับการอัปเดต SubTask
export const UpdateSubTaskSchema = z.object({
  body: z.object({
    subtask_id: z.string().uuid(),
    task_id: z.string().uuid().nullable().optional(),
    subtask_name: z.string().max(255).optional(),
    description: z.string().optional(),
    budget: z.number().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Schema สำหรับการลบ SubTask
export const DeleteSubTaskSchema = z.object({
  params: z.object({
    subtask_id: z.string().uuid(),
  }),
});
